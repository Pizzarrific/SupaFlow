namespace Supaflow.Api.DTOs;

public class NotificationDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public string? LinkType { get; set; }
    public int? LinkId { get; set; }
    public DateTime CreatedAt { get; set; }
}
