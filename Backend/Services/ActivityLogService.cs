using Supaflow.Api.Data;
using Supaflow.Api.Models;

namespace Supaflow.Api.Services;

public interface IActivityLogService
{
    Task LogAsync(int userId, string action, string entityType, int? entityId = null);
}

public class ActivityLogService : IActivityLogService
{
    private readonly SupaflowContext _context;

    public ActivityLogService(SupaflowContext context)
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
