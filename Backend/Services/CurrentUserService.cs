using System.Security.Claims;

namespace Supaflow.Api.Services;

public interface ICurrentUserService
{
    int UserId { get; }
    string Role { get; }
    bool IsManager { get; }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserService(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public int UserId
    {
        get
        {
            var claim = _accessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }
    }

    public string Role => _accessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value ?? "Employee";

    public bool IsManager => Role == "Manager";
}
