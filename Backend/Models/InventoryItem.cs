namespace StoreFlow.Api.Models;

public class InventoryItem
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int MinimumQuantity { get; set; }
    public string Location { get; set; } = string.Empty;
    public InventoryStatus Status { get; set; } = InventoryStatus.InStock;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RestockingTask> RestockingTasks { get; set; } = new List<RestockingTask>();
}
