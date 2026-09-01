using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Models;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IActivityLogService _activityLog;
    private readonly INotificationService _notifications;

    public InventoryController(SupaflowContext context, ICurrentUserService currentUser, IActivityLogService activityLog, INotificationService notifications)
    {
        _context = context;
        _currentUser = currentUser;
        _activityLog = activityLog;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _context.InventoryItems.AsQueryable();
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(i => i.Category == category);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<InventoryStatus>(status, true, out var st)) query = query.Where(i => i.Status == st);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(i => i.Name.ToLower().Contains(s) || i.Sku.ToLower().Contains(s));
        }

        var items = await query.OrderBy(i => i.Name).ToListAsync();
        return Ok(ApiResponse<List<InventoryItemDto>>.Ok(items.Select(Map).ToList()));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail("Product not found."));
        return Ok(ApiResponse<InventoryItemDto>.Ok(Map(item)));
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Create([FromBody] CreateInventoryItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Sku) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<object>.Fail("SKU and name are required."));

        if (await _context.InventoryItems.AnyAsync(i => i.Sku == request.Sku))
            return BadRequest(ApiResponse<object>.Fail("SKU already exists."));

        var item = new InventoryItem
        {
            Sku = request.Sku,
            Name = request.Name,
            Category = request.Category,
            Quantity = request.Quantity,
            MinimumQuantity = request.MinimumQuantity,
            Location = request.Location
        };
        item.Status = ComputeStatus(item.Quantity, item.MinimumQuantity);

        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Added product '{item.Name}'", "InventoryItem", item.Id);

        return Ok(ApiResponse<InventoryItemDto>.Ok(Map(item), "Product added."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateInventoryItemRequest request)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail("Product not found."));

        item.Name = request.Name;
        item.Category = request.Category;
        item.MinimumQuantity = request.MinimumQuantity;
        item.Location = request.Location;
        item.Status = ComputeStatus(item.Quantity, item.MinimumQuantity);
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Updated product '{item.Name}'", "InventoryItem", item.Id);
        return Ok(ApiResponse<object>.Ok(new { }, "Product updated."));
    }

    [HttpPatch("{id:int}/quantity")]
    public async Task<IActionResult> UpdateQuantity(int id, [FromBody] UpdateQuantityRequest request)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null) return NotFound(ApiResponse<object>.Fail("Product not found."));

        var wasLow = item.Status is InventoryStatus.LowStock or InventoryStatus.Critical or InventoryStatus.OutOfStock;
        item.Quantity = Math.Max(0, item.Quantity + request.Delta);
        item.Status = ComputeStatus(item.Quantity, item.MinimumQuantity);
        item.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Adjusted stock for '{item.Name}' by {request.Delta}", "InventoryItem", item.Id);

        if (!wasLow && item.Status is InventoryStatus.LowStock or InventoryStatus.Critical or InventoryStatus.OutOfStock)
        {
            var managers = await _context.Users.Where(u => u.Role == UserRole.Manager).ToListAsync();
            foreach (var m in managers)
                await _notifications.NotifyAsync(m.Id, NotificationType.StockCritical, "Low stock alert", $"{item.Name} is now {item.Status}", "InventoryItem", item.Id);
        }

        return Ok(ApiResponse<InventoryItemDto>.Ok(Map(item), "Quantity updated."));
    }

    public static InventoryStatus ComputeStatus(int quantity, int minimum)
    {
        if (quantity <= 0) return InventoryStatus.OutOfStock;
        if (quantity < minimum / 2.0) return InventoryStatus.Critical;
        if (quantity < minimum) return InventoryStatus.LowStock;
        return InventoryStatus.InStock;
    }

    private static InventoryItemDto Map(InventoryItem i) => new()
    {
        Id = i.Id,
        Sku = i.Sku,
        Name = i.Name,
        Category = i.Category,
        Quantity = i.Quantity,
        MinimumQuantity = i.MinimumQuantity,
        Location = i.Location,
        Status = i.Status.ToString(),
        UpdatedAt = i.UpdatedAt
    };
}
