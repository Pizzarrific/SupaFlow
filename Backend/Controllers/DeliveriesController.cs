using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Data;
using StoreFlow.Api.DTOs;
using StoreFlow.Api.Models;
using StoreFlow.Api.Services;

namespace StoreFlow.Api.Controllers;

[ApiController]
[Route("api/deliveries")]
[Authorize]
public class DeliveriesController : ControllerBase
{
    private readonly StoreFlowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IActivityLogService _activityLog;

    public DeliveriesController(StoreFlowContext context, ICurrentUserService currentUser, IActivityLogService activityLog)
    {
        _context = context;
        _currentUser = currentUser;
        _activityLog = activityLog;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        var query = _context.Deliveries.Include(d => d.Events).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DeliveryStatus>(status, true, out var st)) query = query.Where(d => d.Status == st);

        var list = await query.OrderBy(d => d.ExpectedArrival).ToListAsync();
        return Ok(ApiResponse<List<DeliveryDto>>.Ok(list.Select(Map).ToList()));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _context.Deliveries.Include(x => x.Events).FirstOrDefaultAsync(x => x.Id == id);
        if (d == null) return NotFound(ApiResponse<object>.Fail("Delivery not found."));
        return Ok(ApiResponse<DeliveryDto>.Ok(Map(d)));
    }

    [HttpPost]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Create([FromBody] CreateDeliveryRequest request)
    {
        var count = await _context.Deliveries.CountAsync() + 2048;
        var delivery = new Delivery
        {
            DeliveryNumber = $"DLV{count}",
            Supplier = request.Supplier,
            ExpectedArrival = request.ExpectedArrival,
            Dock = request.Dock,
            Notes = request.Notes,
            Status = DeliveryStatus.Scheduled
        };
        delivery.Events.Add(new DeliveryEvent { Label = "Order dispatched", OccurredAt = DateTime.UtcNow });

        _context.Deliveries.Add(delivery);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Created delivery {delivery.DeliveryNumber}", "Delivery", delivery.Id);

        return Ok(ApiResponse<DeliveryDto>.Ok(Map(delivery), "Delivery created."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDeliveryRequest request)
    {
        var d = await _context.Deliveries.Include(x => x.Events).FirstOrDefaultAsync(x => x.Id == id);
        if (d == null) return NotFound(ApiResponse<object>.Fail("Delivery not found."));

        if (!string.IsNullOrWhiteSpace(request.Supplier)) d.Supplier = request.Supplier;
        if (request.ExpectedArrival.HasValue) d.ExpectedArrival = request.ExpectedArrival.Value;
        if (!string.IsNullOrWhiteSpace(request.Dock)) d.Dock = request.Dock;
        if (request.Notes != null) d.Notes = request.Notes;

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<DeliveryStatus>(request.Status, true, out var status))
        {
            d.Status = status;
            d.Events.Add(new DeliveryEvent { Label = $"Status changed to {status}", OccurredAt = DateTime.UtcNow });
            if (status == DeliveryStatus.Arrived || status == DeliveryStatus.Completed) d.ActualArrival ??= DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Updated delivery {d.DeliveryNumber}", "Delivery", d.Id);

        return Ok(ApiResponse<DeliveryDto>.Ok(Map(d), "Delivery updated."));
    }

    private static DeliveryDto Map(Delivery d) => new()
    {
        Id = d.Id,
        DeliveryNumber = d.DeliveryNumber,
        Supplier = d.Supplier,
        ExpectedArrival = d.ExpectedArrival,
        ActualArrival = d.ActualArrival,
        Dock = d.Dock,
        Status = d.Status.ToString(),
        Notes = d.Notes,
        Events = d.Events.OrderBy(e => e.OccurredAt).Select(e => new DeliveryEventDto { Label = e.Label, OccurredAt = e.OccurredAt }).ToList()
    };
}
