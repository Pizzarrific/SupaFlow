namespace StoreFlow.Api.Models;

public class CustomerIssue
{
    public int Id { get; set; }
    public CustomerIssueType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public CustomerIssueStatus Status { get; set; } = CustomerIssueStatus.Open;
    public int? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }
    public int CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
}
