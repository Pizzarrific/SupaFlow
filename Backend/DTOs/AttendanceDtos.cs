namespace StoreFlow.Api.DTOs;

public class AttendanceStatusDto
{
    public bool IsClockedIn { get; set; }
    public bool IsOnBreak { get; set; }
    public DateTime? ClockIn { get; set; }
    public DateTime? BreakStart { get; set; }
    public string TodayHours { get; set; } = "0h 0m";
    public string WeeklyHours { get; set; } = "0h 0m";
}

public class AttendanceRecordDto
{
    public int Id { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public DateTime? BreakStart { get; set; }
    public DateTime? BreakEnd { get; set; }
    public string Duration { get; set; } = string.Empty;
}
