using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Models;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IActivityLogService _activityLog;

    public AttendanceController(SupaflowContext context, ICurrentUserService currentUser, IActivityLogService activityLog)
    {
        _context = context;
        _currentUser = currentUser;
        _activityLog = activityLog;
    }

    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> GetAll([FromQuery] int? userId, [FromQuery] DateTime? date)
    {
        var query = _context.Attendance.Include(a => a.User).AsQueryable();
        if (userId.HasValue) query = query.Where(a => a.UserId == userId);
        if (date.HasValue) query = query.Where(a => a.ClockIn.Date == date.Value.Date);

        var records = await query.OrderByDescending(a => a.ClockIn).Take(200).ToListAsync();
        return Ok(ApiResponse<List<AttendanceRecordDto>>.Ok(records.Select(Map).ToList()));
    }

    [HttpGet("me/status")]
    public async Task<IActionResult> MyStatus()
    {
        var uid = _currentUser.UserId;
        var active = await _context.Attendance.Where(a => a.UserId == uid && a.ClockOut == null).OrderByDescending(a => a.ClockIn).FirstOrDefaultAsync();

        var today = DateTime.UtcNow.Date;
        var todayRecords = await _context.Attendance.Where(a => a.UserId == uid && a.ClockIn >= today).ToListAsync();
        var weekStart = DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek);
        var weekRecords = await _context.Attendance.Where(a => a.UserId == uid && a.ClockIn >= weekStart).ToListAsync();

        int todayMins = SumMinutes(todayRecords);
        int weekMins = SumMinutes(weekRecords);

        var dto = new AttendanceStatusDto
        {
            IsClockedIn = active != null,
            IsOnBreak = active != null && active.BreakStart != null && active.BreakEnd == null,
            ClockIn = active?.ClockIn,
            BreakStart = active?.BreakStart != null && active.BreakEnd == null ? active.BreakStart : null,
            TodayHours = $"{todayMins / 60}h {todayMins % 60}m",
            WeeklyHours = $"{weekMins / 60}h {weekMins % 60}m"
        };

        return Ok(ApiResponse<AttendanceStatusDto>.Ok(dto));
    }

    private static int SumMinutes(List<Attendance> records)
    {
        int total = 0;
        foreach (var r in records)
        {
            var end = r.ClockOut ?? DateTime.UtcNow;
            var mins = (int)(end - r.ClockIn).TotalMinutes - r.TotalBreakMinutes;
            if (mins > 0) total += mins;
        }
        return total;
    }

    [HttpPost("clock-in")]
    public async Task<IActionResult> ClockIn()
    {
        var uid = _currentUser.UserId;
        var alreadyActive = await _context.Attendance.AnyAsync(a => a.UserId == uid && a.ClockOut == null);
        if (alreadyActive) return BadRequest(ApiResponse<object>.Fail("You are already clocked in."));

        var record = new Attendance { UserId = uid, ClockIn = DateTime.UtcNow };
        _context.Attendance.Add(record);

        var user = await _context.Users.FindAsync(uid);
        if (user != null) user.CurrentStatus = ShiftStatus.OnFloor;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(uid, "Clocked in", "Attendance", record.Id);

        return Ok(ApiResponse<object>.Ok(new { record.Id, record.ClockIn }, "Clocked in."));
    }

    [HttpPost("clock-out")]
    public async Task<IActionResult> ClockOut()
    {
        var uid = _currentUser.UserId;
        var active = await _context.Attendance.Where(a => a.UserId == uid && a.ClockOut == null).OrderByDescending(a => a.ClockIn).FirstOrDefaultAsync();
        if (active == null) return BadRequest(ApiResponse<object>.Fail("You are not currently clocked in."));

        if (active.BreakStart != null && active.BreakEnd == null)
            return BadRequest(ApiResponse<object>.Fail("End your break before clocking out."));

        active.ClockOut = DateTime.UtcNow;

        var user = await _context.Users.FindAsync(uid);
        if (user != null) user.CurrentStatus = ShiftStatus.OffShift;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(uid, "Clocked out", "Attendance", active.Id);

        var mins = (int)(active.ClockOut.Value - active.ClockIn).TotalMinutes - active.TotalBreakMinutes;
        return Ok(ApiResponse<object>.Ok(new { Duration = $"{mins / 60}h {mins % 60}m" }, "Clocked out."));
    }

    [HttpPost("break/start")]
    public async Task<IActionResult> StartBreak()
    {
        var uid = _currentUser.UserId;
        var active = await _context.Attendance.Where(a => a.UserId == uid && a.ClockOut == null).OrderByDescending(a => a.ClockIn).FirstOrDefaultAsync();
        if (active == null) return BadRequest(ApiResponse<object>.Fail("Clock in before starting a break."));
        if (active.BreakStart != null && active.BreakEnd == null) return BadRequest(ApiResponse<object>.Fail("Break already in progress."));

        active.BreakStart = DateTime.UtcNow;
        active.BreakEnd = null;

        var user = await _context.Users.FindAsync(uid);
        if (user != null) user.CurrentStatus = ShiftStatus.OnBreak;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(uid, "Started break", "Attendance", active.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Break started."));
    }

    [HttpPost("break/end")]
    public async Task<IActionResult> EndBreak()
    {
        var uid = _currentUser.UserId;
        var active = await _context.Attendance.Where(a => a.UserId == uid && a.ClockOut == null).OrderByDescending(a => a.ClockIn).FirstOrDefaultAsync();
        if (active == null || active.BreakStart == null || active.BreakEnd != null)
            return BadRequest(ApiResponse<object>.Fail("No break in progress."));

        active.BreakEnd = DateTime.UtcNow;
        active.TotalBreakMinutes += (int)(active.BreakEnd.Value - active.BreakStart.Value).TotalMinutes;

        var user = await _context.Users.FindAsync(uid);
        if (user != null) user.CurrentStatus = ShiftStatus.OnFloor;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(uid, "Ended break", "Attendance", active.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Break ended."));
    }

    private static AttendanceRecordDto Map(Attendance a)
    {
        var end = a.ClockOut ?? DateTime.UtcNow;
        var mins = (int)(end - a.ClockIn).TotalMinutes - a.TotalBreakMinutes;
        if (mins < 0) mins = 0;
        return new AttendanceRecordDto
        {
            Id = a.Id,
            EmployeeId = a.User!.EmployeeId,
            EmployeeName = a.User.Name,
            ClockIn = a.ClockIn,
            ClockOut = a.ClockOut,
            BreakStart = a.BreakStart,
            BreakEnd = a.BreakEnd,
            Duration = $"{mins / 60}h {mins % 60}m"
        };
    }
}
