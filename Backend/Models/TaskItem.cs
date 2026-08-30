namespace StoreFlow.Api.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskCategory Category { get; set; }
    public TaskStatusType Status { get; set; } = TaskStatusType.Todo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }
    public int CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
}
