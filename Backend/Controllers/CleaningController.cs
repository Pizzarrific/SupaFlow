using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Models;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/cleaning")]
[Authorize]
public class CleaningController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IActivityLogService _activityLog;

    public CleaningController(SupaflowContext context, ICurrentUserService currentUser, IActivityLogService activityLog)
    {
        _context = context;
        _currentUser = currentUser;
        _activityLog = activityLog;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? area)
    {
        var query = _context.CleaningTasks.Include(c => c.AssignedToUser).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CleaningStatus>(status, true, out var st)) query = query.Where(c => c.Status == st);
        if (!string.IsNullOrWhiteSpace(area)) query = query.Where(c => c.Area == area);

        var list = await query.OrderBy(c => c.NextDue).ToListAsync();
        return Ok(ApiResponse<List<CleaningTaskDto>>.Ok(list.Select(Map).ToList()));
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Create([FromBody] CreateCleaningTaskRequest request)
    {
        if (!Enum.TryParse<TaskPriority>(request.Priority, true, out var priority)) priority = TaskPriority.Medium;

        var task = new CleaningTask
        {
            Area = request.Area,
            AssignedToUserId = request.AssignedToUserId,
            Priority = priority,
            NextDue = request.NextDue,
            Status = CleaningStatus.Due
        };
        _context.CleaningTasks.Add(task);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Scheduled cleaning for {task.Area}", "CleaningTask", task.Id);

        var reloaded = await _context.CleaningTasks.Include(c => c.AssignedToUser).FirstAsync(c => c.Id == task.Id);
        return Ok(ApiResponse<CleaningTaskDto>.Ok(Map(reloaded), "Cleaning task created."));
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCleaningTaskRequest request)
    {
        var task = await _context.CleaningTasks.FirstOrDefaultAsync(c => c.Id == id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Cleaning task not found."));

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<CleaningStatus>(request.Status, true, out var status))
        {
            if (status == CleaningStatus.InProgress) task.StartedAt = DateTime.UtcNow;
            if (status == CleaningStatus.Clean)
            {
                task.LastCleaned = DateTime.UtcNow;
                task.NextDue = DateTime.UtcNow.AddHours(8);
            }
            task.Status = status;
        }
        if (request.AssignedToUserId.HasValue) task.AssignedToUserId = request.AssignedToUserId;
        if (!string.IsNullOrWhiteSpace(request.Priority) && Enum.TryParse<TaskPriority>(request.Priority, true, out var p)) task.Priority = p;
        if (request.NextDue.HasValue) task.NextDue = request.NextDue.Value;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Updated cleaning task for {task.Area}", "CleaningTask", task.Id);

        return Ok(ApiResponse<object>.Ok(new { }, "Cleaning task updated."));
    }

    private static CleaningTaskDto Map(CleaningTask c) => new()
    {
        Id = c.Id,
        Area = c.Area,
        AssignedTo = c.AssignedToUser == null ? null : new UserSummaryDto
        {
            Id = c.AssignedToUser.Id, EmployeeId = c.AssignedToUser.EmployeeId, Name = c.AssignedToUser.Name,
            Department = c.AssignedToUser.Department, JobTitle = c.AssignedToUser.JobTitle,
            Role = c.AssignedToUser.Role.ToString(), CurrentStatus = c.AssignedToUser.CurrentStatus.ToString(),
            ProfileImageUrl = c.AssignedToUser.ProfileImageUrl
        },
        Status = c.Status.ToString(),
        Priority = c.Priority.ToString(),
        LastCleaned = c.LastCleaned,
        NextDue = c.NextDue
    };
}
