using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Models;

namespace StoreFlow.Api.Data;

public class StoreFlowContext : DbContext
{
    public StoreFlowContext(DbContextOptions<StoreFlowContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<Attendance> Attendance => Set<Attendance>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<RestockingTask> RestockingTasks => Set<RestockingTask>();
    public DbSet<CleaningTask> CleaningTasks => Set<CleaningTask>();
    public DbSet<Delivery> Deliveries => Set<Delivery>();
    public DbSet<DeliveryEvent> DeliveryEvents => Set<DeliveryEvent>();
    public DbSet<CustomerIssue> CustomerIssues => Set<CustomerIssue>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.EmployeeId).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
            e.Property(u => u.EmploymentStatus).HasConversion<string>();
            e.Property(u => u.CurrentStatus).HasConversion<string>();
            e.HasOne(u => u.Manager)
                .WithMany()
                .HasForeignKey(u => u.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TaskItem>(e =>
        {
            e.Property(t => t.Status).HasConversion<string>();
            e.Property(t => t.Priority).HasConversion<string>();
            e.Property(t => t.Category).HasConversion<string>();
            e.HasOne(t => t.AssignedToUser)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TaskComment>(e =>
        {
            e.HasOne(c => c.Task).WithMany(t => t.Comments).HasForeignKey(c => c.TaskId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Attendance>(e =>
        {
            e.HasOne(a => a.User).WithMany(u => u.AttendanceRecords).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InventoryItem>(e =>
        {
            e.HasIndex(i => i.Sku).IsUnique();
            e.Property(i => i.Status).HasConversion<string>();
        });

        modelBuilder.Entity<RestockingTask>(e =>
        {
            e.Property(r => r.Status).HasConversion<string>();
            e.Property(r => r.Priority).HasConversion<string>();
            e.HasOne(r => r.InventoryItem).WithMany(i => i.RestockingTasks).HasForeignKey(r => r.InventoryItemId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.AssignedToUser).WithMany().HasForeignKey(r => r.AssignedToUserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<CleaningTask>(e =>
        {
            e.Property(c => c.Status).HasConversion<string>();
            e.Property(c => c.Priority).HasConversion<string>();
            e.HasOne(c => c.AssignedToUser).WithMany().HasForeignKey(c => c.AssignedToUserId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Delivery>(e =>
        {
            e.HasIndex(d => d.DeliveryNumber).IsUnique();
            e.Property(d => d.Status).HasConversion<string>();
        });

        modelBuilder.Entity<DeliveryEvent>(e =>
        {
            e.HasOne(ev => ev.Delivery).WithMany(d => d.Events).HasForeignKey(ev => ev.DeliveryId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CustomerIssue>(e =>
        {
            e.Property(c => c.Type).HasConversion<string>();
            e.Property(c => c.Status).HasConversion<string>();
            e.Property(c => c.Priority).HasConversion<string>();
            e.HasOne(c => c.AssignedToUser).WithMany().HasForeignKey(c => c.AssignedToUserId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(c => c.CreatedByUser).WithMany().HasForeignKey(c => c.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.Property(n => n.Type).HasConversion<string>();
            e.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
