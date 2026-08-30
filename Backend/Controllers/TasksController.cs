using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Data;
using StoreFlow.Api.DTOs;
using StoreFlow.Api.Models;
using StoreFlow.Api.Services;

namespace StoreFlow.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly StoreFlowContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationService _notifications;
    private readonly IActivityLogService _activityLog;

    public TasksController(StoreFlowContext context, ICurrentUserService currentUser, INotificationService notifications, IActivityLogService activityLog)
    {
        _context = context;
        _currentUser = currentUser;
        _notifications = notifications;
        _activityLog = activityLog;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? priority,
        [FromQuery] string? category, [FromQuery] int? assignedToUserId, [FromQuery] string? search)
    {
        var query = _context.Tasks.Include(t => t.AssignedToUser).Include(t => t.CreatedByUser).Include(t => t.Comments).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<TaskStatusType>(status, true, out var st)) query = query.Where(t => t.Status == st);
        if (!string.IsNullOrWhiteSpace(priority) && Enum.TryParse<TaskPriority>(priority, true, out var pr)) query = query.Where(t => t.Priority == pr);
        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<TaskCategory>(category, true, out var cat)) query = query.Where(t => t.Category == cat);
        if (assignedToUserId.HasValue) query = query.Where(t => t.AssignedToUserId == assignedToUserId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(s) || (t.Description ?? "").ToLower().Contains(s));
        }

        var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(ApiResponse<List<TaskDto>>.Ok(tasks.Select(MapTask).ToList()));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var t = await _context.Tasks.Include(x => x.AssignedToUser).Include(x => x.CreatedByUser).Include(x => x.Comments).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (t == null) return NotFound(ApiResponse<object>.Fail("Task not found."));

        var dto = MapTask(t);
        var comments = t.Comments.OrderBy(c => c.CreatedAt).Select(c => new TaskCommentDto
        {
            Id = c.Id,
            UserName = c.User!.Name,
            EmployeeId = c.User.EmployeeId,
            Comment = c.Comment,
            CreatedAt = c.CreatedAt
        }).ToList();

        return Ok(ApiResponse<object>.Ok(new { Task = dto, Comments = comments }));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(ApiResponse<object>.Fail("Title is required."));
        if (!Enum.TryParse<TaskCategory>(request.Category, true, out var category)) category = TaskCategory.Other;
        if (!Enum.TryParse<TaskPriority>(request.Priority, true, out var priority)) priority = TaskPriority.Medium;

        var task = new TaskItem
        {
            Title = request.Title,
            Description = request.Description,
            Category = category,
            Priority = priority,
            AssignedToUserId = request.AssignedToUserId,
            DueDate = request.DueDate,
            CreatedByUserId = _currentUser.UserId,
            Status = TaskStatusType.Todo
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Created task '{task.Title}'", "Task", task.Id);

        if (task.AssignedToUserId.HasValue)
        {
            var type = priority == TaskPriority.Urgent ? NotificationType.TaskUrgent : NotificationType.TaskAssigned;
            await _notifications.NotifyAsync(task.AssignedToUserId.Value, type, "New task assigned", $"You were assigned: {task.Title}", "Task", task.Id);
        }

        var reloaded = await _context.Tasks.Include(x => x.AssignedToUser).Include(x => x.CreatedByUser).FirstAsync(x => x.Id == task.Id);
        return Ok(ApiResponse<TaskDto>.Ok(MapTask(reloaded), "Task created."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest request)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Task not found."));

        if (!Enum.TryParse<TaskCategory>(request.Category, true, out var category)) category = task.Category;
        if (!Enum.TryParse<TaskPriority>(request.Priority, true, out var priority)) priority = task.Priority;

        var previousAssignee = task.AssignedToUserId;
        task.Title = request.Title;
        task.Description = request.Description;
        task.Category = category;
        task.Priority = priority;
        task.AssignedToUserId = request.AssignedToUserId;
        task.DueDate = request.DueDate;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Updated task '{task.Title}'", "Task", task.Id);

        if (task.AssignedToUserId.HasValue && task.AssignedToUserId != previousAssignee)
        {
            await _notifications.NotifyAsync(task.AssignedToUserId.Value, NotificationType.TaskAssigned, "Task assigned to you", task.Title, "Task", task.Id);
        }

        return Ok(ApiResponse<object>.Ok(new { }, "Task updated."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTaskStatusRequest request)
    {
        var task = await _context.Tasks.Include(t => t.AssignedToUser).FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Task not found."));
        if (!Enum.TryParse<TaskStatusType>(request.Status, true, out var status))
            return BadRequest(ApiResponse<object>.Fail("Invalid status."));

        task.Status = status;
        if (status == TaskStatusType.Completed) task.CompletedAt = DateTime.UtcNow;
        else task.CompletedAt = null;

        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Moved task '{task.Title}' to {status}", "Task", task.Id);

        if (status == TaskStatusType.Completed && task.CreatedByUserId != _currentUser.UserId)
        {
            await _notifications.NotifyAsync(task.CreatedByUserId, NotificationType.TaskCompleted, "Task completed", task.Title, "Task", task.Id);
        }

        return Ok(ApiResponse<object>.Ok(new { }, "Status updated."));
    }

    [HttpPost("{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddCommentRequest request)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Task not found."));
        if (string.IsNullOrWhiteSpace(request.Comment)) return BadRequest(ApiResponse<object>.Fail("Comment cannot be empty."));

        var comment = new TaskComment { TaskId = id, UserId = _currentUser.UserId, Comment = request.Comment };
        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Commented on task '{task.Title}'", "Task", task.Id);

        // simple @mention detection
        foreach (var word in request.Comment.Split(' '))
        {
            if (word.StartsWith("@") && word.Length > 1)
            {
                var name = word.TrimStart('@').Trim('.', ',', '!', '?');
                var mentioned = await _context.Users.FirstOrDefaultAsync(u => u.Name.Contains(name));
                if (mentioned != null && mentioned.Id != _currentUser.UserId)
                {
                    await _notifications.NotifyAsync(mentioned.Id, NotificationType.Mention, "You were mentioned", $"On task '{task.Title}': {request.Comment}", "Task", task.Id);
                }
            }
        }

        if (task.AssignedToUserId.HasValue && task.AssignedToUserId != _currentUser.UserId)
        {
            await _notifications.NotifyAsync(task.AssignedToUserId.Value, NotificationType.General, "New comment", $"On '{task.Title}'", "Task", task.Id);
        }

        return Ok(ApiResponse<object>.Ok(new { }, "Comment added."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return NotFound(ApiResponse<object>.Fail("Task not found."));

        if (!_currentUser.IsManager && task.CreatedByUserId != _currentUser.UserId)
            return Forbid();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        await _activityLog.LogAsync(_currentUser.UserId, $"Deleted task '{task.Title}'", "Task", id);

        return Ok(ApiResponse<object>.Ok(new { }, "Task deleted."));
    }

    private static TaskDto MapTask(TaskItem t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        Category = t.Category.ToString(),
        Status = t.Status.ToString(),
        Priority = t.Priority.ToString(),
        AssignedTo = t.AssignedToUser == null ? null : new UserSummaryDto
        {
            Id = t.AssignedToUser.Id,
            EmployeeId = t.AssignedToUser.EmployeeId,
            Name = t.AssignedToUser.Name,
            Department = t.AssignedToUser.Department,
            JobTitle = t.AssignedToUser.JobTitle,
            Role = t.AssignedToUser.Role.ToString(),
            CurrentStatus = t.AssignedToUser.CurrentStatus.ToString(),
            ProfileImageUrl = t.AssignedToUser.ProfileImageUrl
        },
        CreatedByName = t.CreatedByUser?.Name ?? "",
        DueDate = t.DueDate,
        CreatedAt = t.CreatedAt,
        CompletedAt = t.CompletedAt,
        CommentCount = t.Comments?.Count ?? 0
    };
}
