using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Data;
using StoreFlow.Api.DTOs;

namespace StoreFlow.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly StoreFlowContext _context;

    public SearchController(StoreFlowContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(ApiResponse<object>.Ok(new { Employees = new List<object>(), Tasks = new List<object>(), Inventory = new List<object>(), Deliveries = new List<object>(), CustomerIssues = new List<object>() }));

        var s = q.ToLower();

        var employees = await _context.Users
            .Where(u => u.Name.ToLower().Contains(s) || u.EmployeeId.ToLower().Contains(s) || u.Email.ToLower().Contains(s) || u.Department.ToLower().Contains(s))
            .Take(8)
            .Select(u => new { u.Id, u.EmployeeId, u.Name, u.Department, EmploymentStatus = u.EmploymentStatus.ToString() })
            .ToListAsync();

        var tasks = await _context.Tasks
            .Where(t => t.Title.ToLower().Contains(s))
            .Take(8)
            .Select(t => new { t.Id, t.Title, Status = t.Status.ToString(), Priority = t.Priority.ToString() })
            .ToListAsync();

        var inventory = await _context.InventoryItems
            .Where(i => i.Name.ToLower().Contains(s) || i.Sku.ToLower().Contains(s))
            .Take(8)
            .Select(i => new { i.Id, i.Name, i.Sku, Status = i.Status.ToString() })
            .ToListAsync();

        var deliveries = await _context.Deliveries
            .Where(d => d.DeliveryNumber.ToLower().Contains(s) || d.Supplier.ToLower().Contains(s))
            .Take(8)
            .Select(d => new { d.Id, d.DeliveryNumber, d.Supplier, Status = d.Status.ToString() })
            .ToListAsync();

        var issues = await _context.CustomerIssues
            .Where(c => c.Description.ToLower().Contains(s) || c.Department.ToLower().Contains(s))
            .Take(8)
            .Select(c => new { c.Id, c.Description, c.Department, Status = c.Status.ToString() })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(new
        {
            Employees = employees,
            Tasks = tasks,
            Inventory = inventory,
            Deliveries = deliveries,
            CustomerIssues = issues
        }));
    }
}
