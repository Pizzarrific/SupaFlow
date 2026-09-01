using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Data;
using Supaflow.Api.DTOs;
using Supaflow.Api.Helpers;
using Supaflow.Api.Services;

namespace Supaflow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly SupaflowContext _context;
    private readonly JwtTokenGenerator _tokenGenerator;
    private readonly ICurrentUserService _currentUser;

    public AuthController(SupaflowContext context, JwtTokenGenerator tokenGenerator, ICurrentUserService currentUser)
    {
        _context = context;
        _tokenGenerator = tokenGenerator;
        _currentUser = currentUser;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<object>.Fail("Email and password are required."));

        var user = await _context.Users.Include(u => u.Manager)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(ApiResponse<object>.Fail("Invalid email or password."));

        if (user.EmploymentStatus == Models.EmploymentStatus.Suspended || user.EmploymentStatus == Models.EmploymentStatus.Inactive)
            return Unauthorized(ApiResponse<object>.Fail("This account is deactivated. Contact your manager."));

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user);

        var response = new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = MapProfile(user)
        };

        return Ok(ApiResponse<LoginResponse>.Ok(response, "Login successful."));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        // JWT is stateless; the client discards the token. Endpoint kept for a clean API contract.
        return Ok(ApiResponse<object>.Ok(new { }, "Logged out."));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _context.Users.Include(u => u.Manager).FirstOrDefaultAsync(u => u.Id == _currentUser.UserId);
        if (user == null) return NotFound(ApiResponse<object>.Fail("User not found."));
        return Ok(ApiResponse<UserProfileDto>.Ok(MapProfile(user)));
    }

    private static UserProfileDto MapProfile(Models.User user) => new()
    {
        Id = user.Id,
        EmployeeId = user.EmployeeId,
        Name = user.Name,
        Email = user.Email,
        Phone = user.Phone,
        Role = user.Role.ToString(),
        Department = user.Department,
        JobTitle = user.JobTitle,
        EmploymentStatus = user.EmploymentStatus.ToString(),
        CurrentStatus = user.CurrentStatus.ToString(),
        ManagerName = user.Manager?.Name,
        DateJoined = user.DateJoined,
        ProfileImageUrl = user.ProfileImageUrl,
        LastLoginAt = user.LastLoginAt
    };
}
