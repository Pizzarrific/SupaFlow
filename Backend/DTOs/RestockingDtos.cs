namespace Supaflow.Api.DTOs;

public class CreateRestockingTaskRequest
{
    public int InventoryItemId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string Priority { get; set; } = "Medium";
}

public class RestockingTaskDto
{
    public int Id { get; set; }
    public int InventoryItemId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int MinimumStock { get; set; }
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public UserSummaryDto? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int QuantityAdded { get; set; }
}

public class CompleteRestockingRequest
{
    public int QuantityAdded { get; set; }
}
