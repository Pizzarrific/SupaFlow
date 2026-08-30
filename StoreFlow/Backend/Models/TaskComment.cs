namespace StoreFlow.Api.Models;

public class TaskComment
{
    public int Id { get; set; }
    public int TaskId { get; set; }
    public TaskItem? Task { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
