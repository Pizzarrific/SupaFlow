namespace StoreFlow.Api.DTOs;

public class DashboardDto
{
    public int TasksActive { get; set; }
    public int TasksUrgent { get; set; }
    public int EmployeesClockedIn { get; set; }
    public int LowStockProducts { get; set; }
    public int CriticalStockProducts { get; set; }
    public int DeliveriesToday { get; set; }
    public int DeliveriesDelayed { get; set; }
    public int OpenCustomerIssues { get; set; }
    public List<ActivityFeedItemDto> ActivityFeed { get; set; } = new();
}

public class ActivityFeedItemDto
{
    public string Time { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public int? EntityId { get; set; }
}

public class ReportsDto
{
    public DailyOperationsDto DailyOperations { get; set; } = new();
    public List<EmployeePerformanceDto> EmployeePerformance { get; set; } = new();
    public InventoryReportDto Inventory { get; set; } = new();
    public CustomerServiceReportDto CustomerService { get; set; } = new();
}

public class DailyOperationsDto
{
    public int CompletedTasks { get; set; }
    public int OverdueTasks { get; set; }
    public double AverageCompletionHours { get; set; }
    public int InventoryAlerts { get; set; }
    public int EmployeesPresent { get; set; }
}

public class EmployeePerformanceDto
{
    public string EmployeeId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int TasksCompleted { get; set; }
    public int TasksOverdue { get; set; }
    public double HoursWorked { get; set; }
}

public class InventoryReportDto
{
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public int RestocksCompletedToday { get; set; }
}

public class CustomerServiceReportDto
{
    public int IssuesOpened { get; set; }
    public int IssuesResolved { get; set; }
    public double AverageResolutionHours { get; set; }
}
