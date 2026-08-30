namespace StoreFlow.Api.Models;

public class Delivery
{
    public int Id { get; set; }
    public string DeliveryNumber { get; set; } = string.Empty;
    public string Supplier { get; set; } = string.Empty;
    public DateTime ExpectedArrival { get; set; }
    public DateTime? ActualArrival { get; set; }
    public string Dock { get; set; } = string.Empty;
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Scheduled;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<DeliveryEvent> Events { get; set; } = new List<DeliveryEvent>();
}

public class DeliveryEvent
{
    public int Id { get; set; }
    public int DeliveryId { get; set; }
    public Delivery? Delivery { get; set; }
    public string Label { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
