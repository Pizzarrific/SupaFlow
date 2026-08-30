namespace StoreFlow.Api.DTOs;

public class CreateCustomerIssueRequest
{
    public string Type { get; set; } = "Other";
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
}

public class UpdateCustomerIssueRequest
{
    public string? Status { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? Priority { get; set; }
}

public class CustomerIssueDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public UserSummaryDto? AssignedTo { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
