namespace StoreFlow.Api.DTOs;

public class CreateDeliveryRequest
{
    public string Supplier { get; set; } = string.Empty;
    public DateTime ExpectedArrival { get; set; }
    public string Dock { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class UpdateDeliveryRequest
{
    public string? Supplier { get; set; }
    public DateTime? ExpectedArrival { get; set; }
    public string? Dock { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public class DeliveryEventDto
{
    public string Label { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
}

public class DeliveryDto
{
    public int Id { get; set; }
    public string DeliveryNumber { get; set; } = string.Empty;
    public string Supplier { get; set; } = string.Empty;
    public DateTime ExpectedArrival { get; set; }
    public DateTime? ActualArrival { get; set; }
    public string Dock { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<DeliveryEventDto> Events { get; set; } = new();
}
