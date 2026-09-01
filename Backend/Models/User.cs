namespace Supaflow.Api.Models;

public class User
{
    public int Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty; // e.g. STF-0001, unique
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Active;
    public int? ManagerId { get; set; }
    public User? Manager { get; set; }
    public DateTime DateJoined { get; set; }
    public string? ProfileImageUrl { get; set; }
    public ShiftStatus CurrentStatus { get; set; } = ShiftStatus.OffShift;
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<Attendance> AttendanceRecords { get; set; } = new List<Attendance>();
}
