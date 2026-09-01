using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Helpers;
using Supaflow.Api.Models;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/employees")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IEmployeeIdGenerator _idGenerator;
    private readonly IActivityLogService _activityLog;

    public EmployeesController(SupaflowContext context, ICurrentUserService currentUser, IEmployeeIdGenerator idGenerator, IActivityLogService activityLog)
    {
        _context = context;
        _currentUser = currentUser;
        _idGenerator = idGenerator;
        _activityLog = activityLog;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? department, [FromQuery] string? role,
        [FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(department)) query = query.Where(u => u.Department == department);
        if (!string.IsNullOrWhiteSpace(role) && Enum.TryParse<UserRole>(role, true, out var roleEnum)) query = query.Where(u => u.Role == roleEnum);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<EmploymentStatus>(status, true, out var statusEnum)) query = query.Where(u => u.EmploymentStatus == statusEnum);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u => u.Name.ToLower().Contains(s) || u.EmployeeId.ToLower().Contains(s) || u.Email.ToLower().Contains(s));
        }

        var users = await query.OrderBy(u => u.EmployeeId).ToListAsync();
        var today = DateTime.UtcNow.Date;

        var result = new List<EmployeeListItemDto>();
        foreach (var u in users)
        {
            var activeTasks = await _context.Tasks.CountAsync(t => t.AssignedToUserId == u.Id && t.Status != TaskStatusType.Completed);
            var todayAttendance = await _context.Attendance
                .Where(a => a.UserId == u.Id && a.ClockIn >= today)
                .OrderByDescending(a => a.ClockIn)
                .FirstOrDefaultAsync();

            var hours = "0h 0m";
            if (todayAttendance != null)
            {
                var end = todayAttendance.ClockOut ?? DateTime.UtcNow;
                var mins = (int)(end - todayAttendance.ClockIn).TotalMinutes - todayAttendance.TotalBreakMinutes;
                if (mins < 0) mins = 0;
                hours = $"{mins / 60}h {mins % 60}m";
            }

            result.Add(new EmployeeListItemDto
            {
                Id = u.Id,
                EmployeeId = u.EmployeeId,
                Name = u.Name,
                Email = u.Email,
                Department = u.Department,
                JobTitle = u.JobTitle,
                Role = u.Role.ToString(),
                EmploymentStatus = u.EmploymentStatus.ToString(),
                CurrentStatus = u.CurrentStatus.ToString(),
                ProfileImageUrl = u.ProfileImageUrl,
                ActiveTaskCount = activeTasks,
                TodayHours = hours
            });
        }

        return Ok(ApiResponse<List<EmployeeListItemDto>>.Ok(result));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var u = await _context.Users.Include(x => x.Manager).FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));

        var tasksAssigned = await _context.Tasks.CountAsync(t => t.AssignedToUserId == id);
        var tasksCompleted = await _context.Tasks.CountAsync(t => t.AssignedToUserId == id && t.Status == TaskStatusType.Completed);
        var activeShift = await _context.Attendance.Where(a => a.UserId == id && a.ClockOut == null).OrderByDescending(a => a.ClockIn).FirstOrDefaultAsync();

        var dto = new EmployeeProfileDto
        {
            Id = u.Id,
            EmployeeId = u.EmployeeId,
            Name = u.Name,
            Email = u.Email,
            Phone = u.Phone,
            Department = u.Department,
            JobTitle = u.JobTitle,
            Role = u.Role.ToString(),
            EmploymentStatus = u.EmploymentStatus.ToString(),
            CurrentStatus = u.CurrentStatus.ToString(),
            ManagerName = u.Manager?.Name,
            DateJoined = u.DateJoined,
            ProfileImageUrl = u.ProfileImageUrl,
            LastLoginAt = u.LastLoginAt,
            TasksAssigned = tasksAssigned,
            TasksCompleted = tasksCompleted,
            CurrentShiftStart = activeShift?.ClockIn.ToString("o")
        };

        return Ok(ApiResponse<EmployeeProfileDto>.Ok(dto));
    }

    [HttpGet("id/{employeeId}")]
    public async Task<IActionResult> GetByEmployeeId(string employeeId)
    {
        var u = await _context.Users.FirstOrDefaultAsync(x => x.EmployeeId == employeeId);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        return await GetById(u.Id);
    }

    [HttpGet("{id:int}/id-card")]
    public async Task<IActionResult> GetIdCard(int id)
    {
        var u = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        return Ok(ApiResponse<object>.Ok(new
        {
            u.EmployeeId,
            u.Name,
            u.Department,
            u.JobTitle,
            EmploymentStatus = u.EmploymentStatus.ToString(),
            u.ProfileImageUrl,
            StoreName = "Supaflow Supermarket"
        }));
    }

    [HttpGet("{id:int}/attendance")]
    public async Task<IActionResult> GetAttendance(int id)
    {
        if (!_currentUser.IsManager && _currentUser.UserId != id)
            return Forbid();

        var records = await _context.Attendance.Where(a => a.UserId == id).OrderByDescending(a => a.ClockIn).Take(30).ToListAsync();
        return Ok(ApiResponse<object>.Ok(records));
    }

    [HttpGet("{id:int}/tasks")]
    public async Task<IActionResult> GetTasks(int id)
    {
        var tasks = await _context.Tasks.Where(t => t.AssignedToUserId == id).OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(ApiResponse<object>.Ok(tasks));
    }

    [HttpGet("{id:int}/activity")]
    public async Task<IActionResult> GetActivity(int id)
    {
        var logs = await _context.ActivityLogs.Where(a => a.UserId == id).OrderByDescending(a => a.CreatedAt).Take(50).ToListAsync();
        return Ok(ApiResponse<object>.Ok(logs));
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(ApiResponse<object>.Fail("Name and email are required."));

        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (emailExists) return BadRequest(ApiResponse<object>.Fail("An employee with this email already exists."));

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role)) role = UserRole.Employee;
        if (!Enum.TryParse<EmploymentStatus>(request.EmploymentStatus, true, out var status)) status = EmploymentStatus.Active;

        var employeeId = await _idGenerator.GenerateNextIdAsync();
        var tempPassword = "Password123!";

        var user = new User
        {
            EmployeeId = employeeId,
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = PasswordHasher.Hash(tempPassword),
            Role = role,
            Department = request.Department,
            JobTitle = request.JobTitle,
            EmploymentStatus = status,
            ManagerId = request.ManagerId,
            DateJoined = request.DateJoined == default ? DateTime.UtcNow : request.DateJoined,
            CurrentStatus = ShiftStatus.OffShift
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Created employee {user.EmployeeId} ({user.Name})", "Employee", user.Id);

        return Ok(ApiResponse<object>.Ok(new { user.Id, user.EmployeeId, TemporaryPassword = tempPassword }, "Employee created successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeeRequest request)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));

        u.Name = request.Name;
        u.Phone = request.Phone;
        u.JobTitle = request.JobTitle;
        u.ManagerId = request.ManagerId;
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Updated employee {u.EmployeeId}", "Employee", u.Id);

        return Ok(ApiResponse<object>.Ok(new { }, "Employee updated."));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] Dictionary<string, string> body)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        if (!body.TryGetValue("status", out var statusStr) || !Enum.TryParse<EmploymentStatus>(statusStr, true, out var status))
            return BadRequest(ApiResponse<object>.Fail("Invalid status."));

        u.EmploymentStatus = status;
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Changed {u.EmployeeId} status to {status}", "Employee", u.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Status updated."));
    }

    [HttpPatch("{id:int}/department")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] Dictionary<string, string> body)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        if (!body.TryGetValue("department", out var dept) || string.IsNullOrWhiteSpace(dept))
            return BadRequest(ApiResponse<object>.Fail("Department is required."));

        u.Department = dept;
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Changed {u.EmployeeId} department to {dept}", "Employee", u.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Department updated."));
    }

    [HttpPatch("{id:int}/role")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] Dictionary<string, string> body)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        if (!body.TryGetValue("role", out var roleStr) || !Enum.TryParse<UserRole>(roleStr, true, out var role))
            return BadRequest(ApiResponse<object>.Fail("Invalid role."));

        u.Role = role;
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Changed {u.EmployeeId} role to {role}", "Employee", u.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Role updated."));
    }

    [HttpPost("{id:int}/reset-password")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> ResetPassword(int id)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));

        var tempPassword = PasswordHasher.GenerateTemporaryPassword();
        u.PasswordHash = PasswordHasher.Hash(tempPassword);
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Reset password for {u.EmployeeId}", "Employee", u.Id);

        return Ok(ApiResponse<ResetPasswordResponse>.Ok(new ResetPasswordResponse { TemporaryPassword = tempPassword }, "Password reset."));
    }

    [HttpPost("{id:int}/deactivate")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Deactivate(int id)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        u.EmploymentStatus = EmploymentStatus.Inactive;
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Deactivated {u.EmployeeId}", "Employee", u.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Employee deactivated. Historical records preserved."));
    }

    [HttpPost("{id:int}/reactivate")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Reactivate(int id)
    {
        var u = await _context.Users.FindAsync(id);
        if (u == null) return NotFound(ApiResponse<object>.Fail("Employee not found."));
        u.EmploymentStatus = EmploymentStatus.Active;
        u.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Reactivated {u.EmployeeId}", "Employee", u.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Employee reactivated."));
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Stats()
    {
        var total = await _context.Users.CountAsync();
        var active = await _context.Users.CountAsync(u => u.EmploymentStatus == EmploymentStatus.Active);
        var onFloor = await _context.Users.CountAsync(u => u.CurrentStatus == ShiftStatus.OnFloor);
        var onBreak = await _context.Users.CountAsync(u => u.CurrentStatus == ShiftStatus.OnBreak);
        var offShift = await _context.Users.CountAsync(u => u.CurrentStatus == ShiftStatus.OffShift);
        var busy = await _context.Users.CountAsync(u => u.CurrentStatus == ShiftStatus.Busy);

        return Ok(ApiResponse<object>.Ok(new
        {
            Total = total,
            Active = active,
            OnFloor = onFloor,
            OnBreak = onBreak,
            OffShift = offShift,
            Busy = busy
        }));
    }
}
