namespace StoreFlow.Api.DTOs;

public class CreateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public DateTime DateJoined { get; set; }
    public int? ManagerId { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
    public string Role { get; set; } = "Employee";
}

public class UpdateEmployeeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public int? ManagerId { get; set; }
}

public class EmployeeListItemDto
{
    public int Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string EmploymentStatus { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public int ActiveTaskCount { get; set; }
    public string TodayHours { get; set; } = "0h 0m";
}

public class EmployeeProfileDto
{
    public int Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string EmploymentStatus { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public string? ManagerName { get; set; }
    public DateTime DateJoined { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int TasksAssigned { get; set; }
    public int TasksCompleted { get; set; }
    public string? CurrentShiftStart { get; set; }
}

public class ResetPasswordResponse
{
    public string TemporaryPassword { get; set; } = string.Empty;
}
