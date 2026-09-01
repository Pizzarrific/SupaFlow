namespace Supaflow.Api.DTOs;

public class CreateCleaningTaskRequest
{
    public string Area { get; set; } = string.Empty;
    public int? AssignedToUserId { get; set; }
    public string Priority { get; set; } = "Medium";
    public DateTime NextDue { get; set; }
}

public class UpdateCleaningTaskRequest
{
    public string? Status { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? Priority { get; set; }
    public DateTime? NextDue { get; set; }
}

public class CleaningTaskDto
{
    public int Id { get; set; }
    public string Area { get; set; } = string.Empty;
    public UserSummaryDto? AssignedTo { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime? LastCleaned { get; set; }
    public DateTime NextDue { get; set; }
}
