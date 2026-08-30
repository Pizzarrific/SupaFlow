using StoreFlow.Api.Data;
using StoreFlow.Api.Models;

namespace StoreFlow.Api.Services;

public interface INotificationService
{
    Task NotifyAsync(int userId, NotificationType type, string title, string message, string? linkType = null, int? linkId = null);
}

public class NotificationService : INotificationService
{
    private readonly StoreFlowContext _context;

    public NotificationService(StoreFlowContext context)
    {
        _context = context;
    }

    public async Task NotifyAsync(int userId, NotificationType type, string title, string message, string? linkType = null, int? linkId = null)
    {
        _context.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            LinkType = linkType,
            LinkId = linkId
        });
        await _context.SaveChangesAsync();
    }
}
