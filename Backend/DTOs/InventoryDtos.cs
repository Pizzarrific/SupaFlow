namespace StoreFlow.Api.DTOs;

public class CreateInventoryItemRequest
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int MinimumQuantity { get; set; }
    public string Location { get; set; } = string.Empty;
}

public class UpdateInventoryItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int MinimumQuantity { get; set; }
    public string Location { get; set; } = string.Empty;
}

public class UpdateQuantityRequest
{
    public int Delta { get; set; }
}

public class InventoryItemDto
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int MinimumQuantity { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
