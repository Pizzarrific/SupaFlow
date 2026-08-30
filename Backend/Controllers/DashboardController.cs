using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Data;
using StoreFlow.Api.DTOs;
using StoreFlow.Api.Models;

namespace StoreFlow.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly StoreFlowContext _context;

    public DashboardController(StoreFlowContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var today = DateTime.UtcNow.Date;

        var tasksActive = await _context.Tasks.CountAsync(t => t.Status != TaskStatusType.Completed);
        var tasksUrgent = await _context.Tasks.CountAsync(t => t.Status != TaskStatusType.Completed && t.Priority == TaskPriority.Urgent);
        var employeesClockedIn = await _context.Attendance.CountAsync(a => a.ClockOut == null);
        var lowStock = await _context.InventoryItems.CountAsync(i => i.Status == InventoryStatus.LowStock);
        var critical = await _context.InventoryItems.CountAsync(i => i.Status == InventoryStatus.Critical || i.Status == InventoryStatus.OutOfStock);
        var deliveriesToday = await _context.Deliveries.CountAsync(d => d.ExpectedArrival.Date == today);
        var deliveriesDelayed = await _context.Deliveries.CountAsync(d => d.Status == DeliveryStatus.Delayed);
        var openIssues = await _context.CustomerIssues.CountAsync(c => c.Status == CustomerIssueStatus.Open || c.Status == CustomerIssueStatus.InProgress);

        var feed = new List<ActivityFeedItemDto>();

        var recentLogs = await _context.ActivityLogs.Include(a => a.User).OrderByDescending(a => a.CreatedAt).Take(12).ToListAsync();
        foreach (var log in recentLogs)
        {
            feed.Add(new ActivityFeedItemDto
            {
                Time = log.CreatedAt.ToString("HH:mm"),
                Message = $"{log.Action} — {log.User?.Name}",
                EntityType = log.EntityType,
                EntityId = log.EntityId
            });
        }

        var dto = new DashboardDto
        {
            TasksActive = tasksActive,
            TasksUrgent = tasksUrgent,
            EmployeesClockedIn = employeesClockedIn,
            LowStockProducts = lowStock,
            CriticalStockProducts = critical,
            DeliveriesToday = deliveriesToday,
            DeliveriesDelayed = deliveriesDelayed,
            OpenCustomerIssues = openIssues,
            ActivityFeed = feed
        };

        return Ok(ApiResponse<DashboardDto>.Ok(dto));
    }
}
