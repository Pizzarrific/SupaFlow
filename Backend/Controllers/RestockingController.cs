using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Models;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/restocking")]
[Authorize]
public class RestockingController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IActivityLogService _activityLog;
    private readonly INotificationService _notifications;

    public RestockingController(SupaflowContext context, ICurrentUserService currentUser, IActivityLogService activityLog, INotificationService notifications)
    {
        _context = context;
        _currentUser = currentUser;
        _activityLog = activityLog;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _context.RestockingTasks.Include(r => r.InventoryItem).Include(r => r.AssignedToUser).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<RestockingStatus>(status, true, out var st)) query = query.Where(r => r.Status == st);

        var list = await query.OrderByDescending(r => r.Priority).ThenBy(r => r.CreatedAt).ToListAsync();
        return Ok(ApiResponse<List<RestockingTaskDto>>.Ok(list.Select(Map).ToList()));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRestockingTaskRequest request)
    {
        var item = await _context.InventoryItems.FindAsync(request.InventoryItemId);
        if (item == null) return NotFound(ApiResponse<object>.Fail("Product not found."));
        if (!Enum.TryParse<TaskPriority>(request.Priority, true, out var priority)) priority = TaskPriority.Medium;

        var task = new RestockingTask
        {
            InventoryItemId = item.Id,
            AssignedToUserId = request.AssignedToUserId,
            Priority = priority,
            Status = RestockingStatus.Queued
        };
        _context.RestockingTasks.Add(task);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Queued restock for '{item.Name}'", "RestockingTask", task.Id);

        if (request.AssignedToUserId.HasValue)
            await _notifications.NotifyAsync(request.AssignedToUserId.Value, NotificationType.TaskAssigned, "Restock assigned", item.Name, "RestockingTask", task.Id);

        var reloaded = await _context.RestockingTasks.Include(r => r.InventoryItem).Include(r => r.AssignedToUser).FirstAsync(r => r.Id == task.Id);
        return Ok(ApiResponse<RestockingTaskDto>.Ok(Map(reloaded), "Restocking task created."));
    }

    [HttpPatch("{id:int}/start")]
    public async Task<IActionResult> Start(int id)
    {
        var task = await _context.RestockingTasks.Include(r => r.InventoryItem).FirstOrDefaultAsync(r => r.Id == id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Restocking task not found."));

        task.Status = RestockingStatus.InProgress;
        task.StartedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Started restocking '{task.InventoryItem!.Name}'", "RestockingTask", task.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Restocking started."));
    }

    [HttpPatch("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, [FromBody] CompleteRestockingRequest request)
    {
        var task = await _context.RestockingTasks.Include(r => r.InventoryItem).FirstOrDefaultAsync(r => r.Id == id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Restocking task not found."));

        var item = task.InventoryItem!;
        item.Quantity += Math.Max(0, request.QuantityAdded);
        item.Status = InventoryController.ComputeStatus(item.Quantity, item.MinimumQuantity);
        item.UpdatedAt = DateTime.UtcNow;

        task.Status = RestockingStatus.Completed;
        task.CompletedAt = DateTime.UtcNow;
        task.QuantityAdded = request.QuantityAdded;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Completed restocking '{item.Name}' (+{request.QuantityAdded})", "RestockingTask", task.Id);

        return Ok(ApiResponse<InventoryItemDto>.Ok(new InventoryItemDto
        {
            Id = item.Id, Sku = item.Sku, Name = item.Name, Category = item.Category,
            Quantity = item.Quantity, MinimumQuantity = item.MinimumQuantity, Location = item.Location,
            Status = item.Status.ToString(), UpdatedAt = item.UpdatedAt
        }, "Restocking completed. Inventory updated."));
    }

    private static RestockingTaskDto Map(RestockingTask r) => new()
    {
        Id = r.Id,
        InventoryItemId = r.InventoryItemId,
        ProductName = r.InventoryItem?.Name ?? "",
        Location = r.InventoryItem?.Location ?? "",
        CurrentStock = r.InventoryItem?.Quantity ?? 0,
        MinimumStock = r.InventoryItem?.MinimumQuantity ?? 0,
        Priority = r.Priority.ToString(),
        Status = r.Status.ToString(),
        AssignedTo = r.AssignedToUser == null ? null : new UserSummaryDto
        {
            Id = r.AssignedToUser.Id, EmployeeId = r.AssignedToUser.EmployeeId, Name = r.AssignedToUser.Name,
            Department = r.AssignedToUser.Department, JobTitle = r.AssignedToUser.JobTitle,
            Role = r.AssignedToUser.Role.ToString(), CurrentStatus = r.AssignedToUser.CurrentStatus.ToString(),
            ProfileImageUrl = r.AssignedToUser.ProfileImageUrl
        },
        CreatedAt = r.CreatedAt,
        StartedAt = r.StartedAt,
        CompletedAt = r.CompletedAt,
        QuantityAdded = r.QuantityAdded
    };
}
