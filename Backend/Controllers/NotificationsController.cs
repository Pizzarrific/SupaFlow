using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(SupaflowContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var uid = _currentUser.UserId;
        var list = await _context.Notifications.Where(n => n.UserId == uid).OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync();
        return Ok(ApiResponse<List<NotificationDto>>.Ok(list.Select(Map).ToList()));
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var uid = _currentUser.UserId;
        var n = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (n == null) return NotFound(ApiResponse<object>.Fail("Notification not found."));
        n.IsRead = true;
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { }, "Marked as read."));
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var uid = _currentUser.UserId;
        var unread = await _context.Notifications.Where(n => n.UserId == uid && !n.IsRead).ToListAsync();
        foreach (var n in unread) n.IsRead = true;
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { }, "All notifications marked as read."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var uid = _currentUser.UserId;
        var n = await _context.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
        if (n == null) return NotFound(ApiResponse<object>.Fail("Notification not found."));
        _context.Notifications.Remove(n);
        await _context.SaveChangesAsync();
        return Ok(ApiResponse<object>.Ok(new { }, "Notification deleted."));
    }

    private static NotificationDto Map(Models.Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type.ToString(),
        Title = n.Title,
        Message = n.Message,
        IsRead = n.IsRead,
        LinkType = n.LinkType,
        LinkId = n.LinkId,
        CreatedAt = n.CreatedAt
    };
}
