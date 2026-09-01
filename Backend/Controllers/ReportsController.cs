using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Models;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Manager")]
public class ReportsController : ControllerBase
{
    private readonly SupaflowContext _context;

    public ReportsController(SupaflowContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var today = DateTime.UtcNow.Date;

        var completedToday = await _context.Tasks.CountAsync(t => t.Status == TaskStatusType.Completed && t.CompletedAt != null && t.CompletedAt.Value.Date == today);
        var overdue = await _context.Tasks.CountAsync(t => t.Status != TaskStatusType.Completed && t.DueDate != null && t.DueDate < DateTime.UtcNow);

        var completedTasks = await _context.Tasks.Where(t => t.Status == TaskStatusType.Completed && t.CompletedAt != null).ToListAsync();
        double avgHours = completedTasks.Count > 0
            ? completedTasks.Average(t => (t.CompletedAt!.Value - t.CreatedAt).TotalHours)
            : 0;

        var inventoryAlerts = await _context.InventoryItems.CountAsync(i => i.Status != InventoryStatus.InStock);
        var employeesPresent = await _context.Attendance.CountAsync(a => a.ClockIn.Date == today);

        var users = await _context.Users.ToListAsync();
        var perf = new List<EmployeePerformanceDto>();
        foreach (var u in users)
        {
            var uCompleted = await _context.Tasks.CountAsync(t => t.AssignedToUserId == u.Id && t.Status == TaskStatusType.Completed);
            var uOverdue = await _context.Tasks.CountAsync(t => t.AssignedToUserId == u.Id && t.Status != TaskStatusType.Completed && t.DueDate != null && t.DueDate < DateTime.UtcNow);
            var records = await _context.Attendance.Where(a => a.UserId == u.Id).ToListAsync();
            double hours = 0;
            foreach (var r in records)
            {
                var end = r.ClockOut ?? DateTime.UtcNow;
                hours += Math.Max(0, (end - r.ClockIn).TotalMinutes - r.TotalBreakMinutes) / 60.0;
            }

            perf.Add(new EmployeePerformanceDto
            {
                EmployeeId = u.EmployeeId,
                Name = u.Name,
                TasksCompleted = uCompleted,
                TasksOverdue = uOverdue,
                HoursWorked = Math.Round(hours, 1)
            });
        }

        var lowStockCount = await _context.InventoryItems.CountAsync(i => i.Status == InventoryStatus.LowStock || i.Status == InventoryStatus.Critical);
        var outOfStockCount = await _context.InventoryItems.CountAsync(i => i.Status == InventoryStatus.OutOfStock);
        var restocksToday = await _context.RestockingTasks.CountAsync(r => r.Status == RestockingStatus.Completed && r.CompletedAt != null && r.CompletedAt.Value.Date == today);

        var issuesOpenedToday = await _context.CustomerIssues.CountAsync(c => c.CreatedAt.Date == today);
        var issuesResolvedTotal = await _context.CustomerIssues.CountAsync(c => c.Status == CustomerIssueStatus.Resolved);
        var resolvedIssues = await _context.CustomerIssues.Where(c => c.Status == CustomerIssueStatus.Resolved && c.ResolvedAt != null).ToListAsync();
        double avgResolution = resolvedIssues.Count > 0 ? resolvedIssues.Average(c => (c.ResolvedAt!.Value - c.CreatedAt).TotalHours) : 0;

        var dto = new ReportsDto
        {
            DailyOperations = new DailyOperationsDto
            {
                CompletedTasks = completedToday,
                OverdueTasks = overdue,
                AverageCompletionHours = Math.Round(avgHours, 1),
                InventoryAlerts = inventoryAlerts,
                EmployeesPresent = employeesPresent
            },
            EmployeePerformance = perf.OrderByDescending(p => p.TasksCompleted).ToList(),
            Inventory = new InventoryReportDto
            {
                LowStockCount = lowStockCount,
                OutOfStockCount = outOfStockCount,
                RestocksCompletedToday = restocksToday
            },
            CustomerService = new CustomerServiceReportDto
            {
                IssuesOpened = issuesOpenedToday,
                IssuesResolved = issuesResolvedTotal,
                AverageResolutionHours = Math.Round(avgResolution, 1)
            }
        };

        return Ok(ApiResponse<ReportsDto>.Ok(dto));
    }
}
