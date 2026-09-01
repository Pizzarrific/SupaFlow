namespace Supaflow.Api.Models;

public enum UserRole
{
    Employee,
    Manager
}

public enum EmploymentStatus
{
    Active,
    OnLeave,
    Suspended,
    Inactive
}

public enum ShiftStatus
{
    OffShift,
    OnFloor,
    OnBreak,
    Busy
}

public enum TaskStatusType
{
    Todo,
    InProgress,
    Blocked,
    Completed
}

public enum TaskPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum TaskCategory
{
    Restocking,
    Cleaning,
    Inventory,
    Delivery,
    CustomerService,
    Maintenance,
    Other
}

public enum InventoryStatus
{
    InStock,
    LowStock,
    Critical,
    OutOfStock
}

public enum RestockingStatus
{
    Queued,
    InProgress,
    Completed
}

public enum CleaningStatus
{
    Clean,
    Due,
    InProgress,
    Overdue
}

public enum DeliveryStatus
{
    Scheduled,
    InTransit,
    Arriving,
    Arrived,
    Checking,
    Completed,
    Delayed
}

public enum CustomerIssueType
{
    ProductQuestion,
    Complaint,
    Refund,
    MissingProduct,
    PriceMismatch,
    AssistanceRequested,
    Other
}

public enum CustomerIssueStatus
{
    Open,
    InProgress,
    Waiting,
    Resolved
}

public enum NotificationType
{
    TaskAssigned,
    TaskUrgent,
    StockCritical,
    DeliveryDelayed,
    IssueAssigned,
    Mention,
    TaskCompleted,
    General
}
