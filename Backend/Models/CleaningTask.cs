namespace Supaflow.Api.Models;

public class CleaningTask
{
    public int Id { get; set; }
    public string Area { get; set; } = string.Empty;
    public int? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }
    public CleaningStatus Status { get; set; } = CleaningStatus.Due;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateTime? LastCleaned { get; set; }
    public DateTime NextDue { get; set; }
    public DateTime? StartedAt { get; set; }
}
