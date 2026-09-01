using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Models;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/customer-issues")]
[Authorize]
public class CustomerIssuesController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IActivityLogService _activityLog;
    private readonly INotificationService _notifications;

    public CustomerIssuesController(SupaflowContext context, ICurrentUserService currentUser, IActivityLogService activityLog, INotificationService notifications)
    {
        _context = context;
        _currentUser = currentUser;
        _activityLog = activityLog;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? priority)
    {
        var query = _context.CustomerIssues.Include(c => c.AssignedToUser).Include(c => c.CreatedByUser).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<CustomerIssueStatus>(status, true, out var st)) query = query.Where(c => c.Status == st);
        if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<TaskPriority>(priority, true, out var pr)) query = query.Where(c => c.Priority == pr);

        var list = await query.OrderByDescending(c => c.Priority).ThenByDescending(c => c.CreatedAt).ToListAsync();
        return Ok(ApiResponse<List<CustomerIssueDto>>.Ok(list.Select(Map).ToList()));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerIssueRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Description)) return BadRequest(ApiResponse<object>.Fail("Description is required."));
        if (!Enum.TryParse<CustomerIssueType>(request.Type, true, out var type)) type = CustomerIssueType.Other;
        if (!Enum.TryParse<TaskPriority>(request.Priority, true, out var priority)) priority = TaskPriority.Medium;

        var issue = new CustomerIssue
        {
            Type = type,
            Description = request.Description,
            Department = request.Department,
            Priority = priority,
            Status = CustomerIssueStatus.Open,
            CreatedByUserId = _currentUser.UserId
        };
        _context.CustomerIssues.Add(issue);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Reported customer issue in {issue.Department}", "CustomerIssue", issue.Id);

        var reloaded = await _context.CustomerIssues.Include(c => c.CreatedByUser).FirstAsync(c => c.Id == issue.Id);
        return Ok(ApiResponse<CustomerIssueDto>.Ok(Map(reloaded), "Issue logged."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerIssueRequest request)
    {
        var issue = await _context.CustomerIssues.FirstOrDefaultAsync(c => c.Id == id);
        if (issue == null) return NotFound(ApiResponse<object>.Fail("Issue not found."));

        if (request.AssignedToUserId.HasValue)
        {
            issue.AssignedToUserId = request.AssignedToUserId;
            await _notifications.NotifyAsync(request.AssignedToUserId.Value, NotificationType.IssueAssigned, "Customer issue assigned", issue.Description, "CustomerIssue", issue.Id);
        }
        if (!string.IsNullOrWhiteSpace(request.Priority) && Enum.TryParse<TaskPriority>(request.Priority, true, out var pr)) issue.Priority = pr;
        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<CustomerIssueStatus>(request.Status, true, out var status))
        {
            issue.Status = status;
            if (status == CustomerIssueStatus.Resolved) issue.ResolvedAt = DateTime.UtcNow;
            else issue.ResolvedAt = null;
        }

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Updated customer issue #{issue.Id}", "CustomerIssue", issue.Id);

        var reloaded = await _context.CustomerIssues.Include(c => c.AssignedToUser).Include(c => c.CreatedByUser).FirstAsync(c => c.Id == issue.Id);
        return Ok(ApiResponse<CustomerIssueDto>.Ok(Map(reloaded), "Issue updated."));
    }

    private static CustomerIssueDto Map(CustomerIssue c) => new()
    {
        Id = c.Id,
        Type = c.Type.ToString(),
        Description = c.Description,
        Department = c.Department,
        Priority = c.Priority.ToString(),
        Status = c.Status.ToString(),
        AssignedTo = c.AssignedToUser == null ? null : new UserSummaryDto
        {
            Id = c.AssignedToUser.Id, EmployeeId = c.AssignedToUser.EmployeeId, Name = c.AssignedToUser.Name,
            Department = c.AssignedToUser.Department, JobTitle = c.AssignedToUser.JobTitle,
            Role = c.AssignedToUser.Role.ToString(), CurrentStatus = c.AssignedToUser.CurrentStatus.ToString(),
            ProfileImageUrl = c.AssignedToUser.ProfileImageUrl
        },
        CreatedByName = c.CreatedByUser?.Name ?? "",
        CreatedAt = c.CreatedAt,
        ResolvedAt = c.ResolvedAt
    };
}
