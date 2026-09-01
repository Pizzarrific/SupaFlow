namespace Supaflow.Api.DTOs;

public class CreateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Other";
    public string Priority { get; set; } = "Medium";
    public int? AssignedToUserId { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "Other";
    public string Priority { get; set; } = "Medium";
    public int? AssignedToUserId { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskStatusRequest
{
    public string Status { get; set; } = "Todo";
}

public class AddCommentRequest
{
    public string Comment { get; set; } = string.Empty;
}

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public UserSummaryDto? AssignedTo { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int CommentCount { get; set; }
}

public class TaskCommentDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
