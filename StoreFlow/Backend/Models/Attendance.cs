namespace StoreFlow.Api.Models;

public class Attendance
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public DateTime ClockIn { get; set; }
    public DateTime? ClockOut { get; set; }
    public DateTime? BreakStart { get; set; }
    public DateTime? BreakEnd { get; set; }
    public int TotalBreakMinutes { get; set; } = 0;
}
