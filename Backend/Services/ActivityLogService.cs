using StoreFlow.Api.Data;
using StoreFlow.Api.Models;

namespace StoreFlow.Api.Services;

public interface IActivityLogService
{
    Task LogAsync(int userId, string action, string entityType, int? entityId = null);
}

public class ActivityLogService : IActivityLogService
{
    private readonly StoreFlowContext _context;

    public ActivityLogService(StoreFlowContext context)
    {
        _context = context;
    }

    public async Task LogAsync(int userId, string action, string entityType, int? entityId = null)
    {
        _context.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId
        });
        await _context.SaveChangesAsync();
    }
}
