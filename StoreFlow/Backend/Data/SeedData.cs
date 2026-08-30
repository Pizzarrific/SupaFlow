using Microsoft.EntityFrameworkCore;
using StoreFlow.Api.Helpers;
using StoreFlow.Api.Models;

namespace StoreFlow.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(StoreFlowContext context)
    {
        if (await context.Users.AnyAsync()) return; // already seeded

        var now = DateTime.UtcNow;
        var demoPasswordHash = PasswordHasher.Hash("Password123!");

        // ---- Employees ----
        var manager = new User
        {
            EmployeeId = "STF0001", Name = "Sato Morgan", Email = "manager@storeflow.local",
            Phone = "555 0101", PasswordHash = demoPasswordHash, Role = UserRole.Manager,
            Department = "Management", JobTitle = "Store Manager", EmploymentStatus = EmploymentStatus.Active,
            DateJoined = now.AddYears(-3), CurrentStatus = ShiftStatus.OnFloor, LastLoginAt = now.AddHours(-2)
        };

        var employee1 = new User
        {
            EmployeeId = "STF0002", Name = "Sarah Williams", Email = "employee@storeflow.local",
            Phone = "555 0102", PasswordHash = demoPasswordHash, Role = UserRole.Employee,
            Department = "Checkout", JobTitle = "Cashier", EmploymentStatus = EmploymentStatus.Active,
            DateJoined = now.AddYears(-1).AddMonths(-2), CurrentStatus = ShiftStatus.OnFloor, LastLoginAt = now.AddHours(-1)
        };

        var employees = new List<User> { manager, employee1 };

        var extra = new (string Name, string Dept, string Title)[]
        {
            ("Aisha Khan", "Customer Service", "Customer Service Associate"),
            ("Daniel Tanaka", "Dairy", "Stock Associate"),
            ("Maya Patel", "Produce", "Produce Associate"),
            ("Kenji Sato", "Warehouse", "Warehouse Associate"),
            ("Liam O'Connor", "Bakery", "Baker"),
            ("Priya Sharma", "Meat", "Butcher Associate"),
            ("Noah Becker", "Frozen", "Stock Associate"),
            ("Emma Novak", "Grocery", "Grocery Associate")
        };

        var statuses = new[] { ShiftStatus.OnFloor, ShiftStatus.OnBreak, ShiftStatus.OffShift, ShiftStatus.Busy };
        int idx = 3;
        foreach (var (name, dept, title) in extra)
        {
            employees.Add(new User
            {
                EmployeeId = $"STF{idx:D4}",
                Name = name,
                Email = BuildEmail(name),
                Phone = $"555 01{idx:D2}",
                PasswordHash = demoPasswordHash,
                Role = UserRole.Employee,
                Department = dept,
                JobTitle = title,
                EmploymentStatus = EmploymentStatus.Active,
                ManagerId = null, // set after save (needs manager.Id)
                DateJoined = now.AddMonths(-(idx * 2)),
                CurrentStatus = statuses[idx % statuses.Length],
                LastLoginAt = now.AddDays(-(idx % 5))
            });
            idx++;
        }

        context.Users.AddRange(employees);
        await context.SaveChangesAsync();

        foreach (var e in employees.Where(e => e.Id != manager.Id))
        {
            e.ManagerId = manager.Id;
        }
        await context.SaveChangesAsync();

        var rnd = new Random(42);
        var staff = employees.Where(e => e.Role == UserRole.Employee).ToList();

        // ---- Inventory ----
        var productSeed = new (string Name, string Category, string Location)[]
        {
            ("Milk 1L", "Dairy", "Aisle 4 / Shelf B"),
            ("Bread", "Bakery", "Aisle 1 / Shelf A"),
            ("Eggs 12 Pack", "Dairy", "Aisle 4 / Shelf C"),
            ("Rice 5kg", "Grocery", "Aisle 6 / Shelf A"),
            ("Chicken Breast", "Meat", "Aisle 9 / Cooler 2"),
            ("Apples", "Produce", "Aisle 0 / Bin 3"),
            ("Bananas", "Produce", "Aisle 0 / Bin 1"),
            ("Frozen Peas", "Frozen", "Aisle 10 / Freezer 2"),
            ("Orange Juice", "Dairy", "Aisle 4 / Shelf D"),
            ("Coffee", "Grocery", "Aisle 7 / Shelf B"),
            ("Toilet Paper", "Household", "Aisle 12 / Shelf A"),
            ("Dish Soap", "Household", "Aisle 12 / Shelf C"),
            ("Cheddar Cheese", "Dairy", "Aisle 4 / Shelf A"),
            ("Ground Beef", "Meat", "Aisle 9 / Cooler 1"),
            ("Salmon Fillet", "Meat", "Aisle 9 / Cooler 3"),
            ("Tomatoes", "Produce", "Aisle 0 / Bin 5"),
            ("Potatoes 2kg", "Produce", "Aisle 0 / Bin 6"),
            ("Frozen Pizza", "Frozen", "Aisle 10 / Freezer 1"),
            ("Ice Cream", "Frozen", "Aisle 10 / Freezer 4"),
            ("Pasta", "Grocery", "Aisle 6 / Shelf C"),
            ("Pasta Sauce", "Grocery", "Aisle 6 / Shelf D"),
            ("Cereal", "Grocery", "Aisle 5 / Shelf A"),
            ("Croissants", "Bakery", "Aisle 1 / Shelf B"),
            ("Bagels", "Bakery", "Aisle 1 / Shelf C"),
            ("Yogurt 4 Pack", "Dairy", "Aisle 4 / Shelf E"),
            ("Butter", "Dairy", "Aisle 4 / Shelf F"),
            ("Paper Towels", "Household", "Aisle 12 / Shelf B"),
            ("Laundry Detergent", "Household", "Aisle 13 / Shelf A"),
            ("Sparkling Water", "Beverages", "Aisle 8 / Shelf A"),
            ("Orange Soda", "Beverages", "Aisle 8 / Shelf B")
        };

        var inventoryItems = new List<InventoryItem>();
        int sku = 1000;
        foreach (var (name, cat, loc) in productSeed)
        {
            var min = 20 + rnd.Next(0, 20);
            // roughly 1 in 4 products start low/critical/out for a lively demo
            var roll = rnd.Next(0, 10);
            int qty = roll switch
            {
                0 => 0,
                1 or 2 => rnd.Next(1, min / 2),
                3 or 4 => rnd.Next(min / 2, min),
                _ => rnd.Next(min, min * 3)
            };

            var item = new InventoryItem
            {
                Sku = $"SKU{sku++}",
                Name = name,
                Category = cat,
                Quantity = qty,
                MinimumQuantity = min,
                Location = loc,
                UpdatedAt = now.AddHours(-rnd.Next(1, 72))
            };
            item.Status = Controllers.InventoryController.ComputeStatus(item.Quantity, item.MinimumQuantity);
            inventoryItems.Add(item);
        }
        context.InventoryItems.AddRange(inventoryItems);
        await context.SaveChangesAsync();

        // ---- Tasks (30) ----
        var categories = Enum.GetValues<TaskCategory>();
        var priorities = Enum.GetValues<TaskPriority>();
        var taskTitles = new[]
        {
            "Restock milk aisle", "Clean produce section spill", "Count dairy inventory", "Check delivery dock 2",
            "Assist customer in electronics", "Restock frozen aisle", "Deep clean checkout lanes", "Update bakery price tags",
            "Restock rice and pasta shelf", "Check expiry dates in dairy", "Refill bagging stations", "Sanitize restrooms",
            "Restock beverages aisle", "Report broken freezer door", "Organize warehouse pallets", "Restock produce apples",
            "Clean up aisle 6 spill", "Verify delivery DLV2048 contents", "Restock meat cooler", "Update shelf labels in grocery",
            "Assist with price mismatch complaint", "Sweep entrance area", "Restock paper goods", "Check freezer temperature logs",
            "Prepare bakery display", "Restock cereal aisle", "Clean dairy cooler glass", "Log damaged goods in produce",
            "Restock household aisle", "Follow up on refund request"
        };

        var tasksList = new List<TaskItem>();
        for (int i = 0; i < taskTitles.Length; i++)
        {
            var status = (TaskStatusType)(rnd.Next(0, 10) switch
            {
                < 4 => 0,
                < 6 => 1,
                < 7 => 2,
                _ => 3
            });
            var assignee = staff[rnd.Next(staff.Count)];
            var creator = rnd.Next(0, 2) == 0 ? manager : staff[rnd.Next(staff.Count)];
            var createdAt = now.AddHours(-rnd.Next(1, 96));

            var task = new TaskItem
            {
                Title = taskTitles[i],
                Description = $"{taskTitles[i]} — logged during floor walk.",
                Category = categories[rnd.Next(categories.Length)],
                Priority = priorities[rnd.Next(priorities.Length)],
                Status = status,
                AssignedToUserId = assignee.Id,
                CreatedByUserId = creator.Id,
                DueDate = createdAt.AddHours(rnd.Next(2, 48)),
                CreatedAt = createdAt,
                CompletedAt = status == TaskStatusType.Completed ? createdAt.AddHours(rnd.Next(1, 20)) : null
            };
            tasksList.Add(task);
        }
        context.Tasks.AddRange(tasksList);
        await context.SaveChangesAsync();

        // a few comments for interconnected activity feed
        var commentTasks = tasksList.Take(5).ToList();
        foreach (var t in commentTasks)
        {
            context.TaskComments.Add(new TaskComment
            {
                TaskId = t.Id,
                UserId = manager.Id,
                Comment = $"@{staff[0].Name.Split(' ')[0]} please prioritize this before the afternoon rush.",
                CreatedAt = t.CreatedAt.AddHours(1)
            });
        }
        await context.SaveChangesAsync();

        // ---- Restocking tasks (linked to low-stock inventory) ----
        var lowStockItems = inventoryItems.Where(i => i.Status != InventoryStatus.InStock).Take(10).ToList();
        var restockStatuses = new[] { RestockingStatus.Queued, RestockingStatus.InProgress, RestockingStatus.Completed };
        foreach (var item in lowStockItems)
        {
            var status = restockStatuses[rnd.Next(restockStatuses.Length)];
            var assignee = staff[rnd.Next(staff.Count)];
            var created = now.AddHours(-rnd.Next(1, 48));
            var rt = new RestockingTask
            {
                InventoryItemId = item.Id,
                AssignedToUserId = assignee.Id,
                Priority = item.Status == InventoryStatus.Critical || item.Status == InventoryStatus.OutOfStock ? TaskPriority.High : TaskPriority.Medium,
                Status = status,
                CreatedAt = created,
                StartedAt = status != RestockingStatus.Queued ? created.AddMinutes(20) : null,
                CompletedAt = status == RestockingStatus.Completed ? created.AddHours(1) : null,
                QuantityAdded = status == RestockingStatus.Completed ? rnd.Next(20, 60) : 0
            };
            context.RestockingTasks.Add(rt);
        }
        await context.SaveChangesAsync();

        // ---- Cleaning tasks (10 areas) ----
        var areas = new[] { "Entrance", "Produce", "Dairy", "Bakery", "Meat", "Frozen", "Checkout", "Restrooms", "Warehouse", "Aisle 7" };
        var cleaningStatuses = Enum.GetValues<CleaningStatus>();
        foreach (var area in areas)
        {
            var status = cleaningStatuses[rnd.Next(cleaningStatuses.Length)];
            var lastCleaned = now.AddHours(-rnd.Next(1, 30));
            context.CleaningTasks.Add(new CleaningTask
            {
                Area = area,
                AssignedToUserId = staff[rnd.Next(staff.Count)].Id,
                Status = status,
                Priority = priorities[rnd.Next(priorities.Length)],
                LastCleaned = status != CleaningStatus.Overdue ? lastCleaned : lastCleaned.AddHours(-24),
                NextDue = status == CleaningStatus.Overdue ? now.AddHours(-4) : now.AddHours(rnd.Next(1, 10)),
                StartedAt = status == CleaningStatus.InProgress ? now.AddMinutes(-15) : null
            });
        }
        await context.SaveChangesAsync();

        // ---- Deliveries (8) ----
        var suppliers = new[] { "FreshFoods Ltd.", "Golden Valley Dairy", "Metro Bakery Supply", "Coastal Seafood Co.",
            "Prime Meats Inc.", "GreenLeaf Produce", "NorthStar Beverages", "EverStock Household Goods" };
        var deliveryStatuses = new[] { DeliveryStatus.Scheduled, DeliveryStatus.InTransit, DeliveryStatus.Arriving,
            DeliveryStatus.Arrived, DeliveryStatus.Checking, DeliveryStatus.Completed, DeliveryStatus.Delayed, DeliveryStatus.InTransit };
        for (int i = 0; i < suppliers.Length; i++)
        {
            var status = deliveryStatuses[i];
            var expected = now.AddHours(rnd.Next(-6, 10));
            var delivery = new Delivery
            {
                DeliveryNumber = $"DLV{2041 + i}",
                Supplier = suppliers[i],
                ExpectedArrival = expected,
                ActualArrival = status is DeliveryStatus.Arrived or DeliveryStatus.Completed ? expected.AddMinutes(rnd.Next(-10, 30)) : null,
                Dock = $"{(i % 3) + 1}",
                Status = status,
                Notes = status == DeliveryStatus.Delayed ? "Traffic delay reported by driver." : null,
                CreatedAt = expected.AddHours(-3)
            };
            delivery.Events.Add(new DeliveryEvent { Label = "Order dispatched", OccurredAt = expected.AddHours(-3) });
            delivery.Events.Add(new DeliveryEvent { Label = "Truck departed", OccurredAt = expected.AddHours(-1.5) });
            if (status != DeliveryStatus.Scheduled)
                delivery.Events.Add(new DeliveryEvent { Label = "Approaching store", OccurredAt = expected.AddMinutes(-20) });
            if (status == DeliveryStatus.Delayed)
                delivery.Events.Add(new DeliveryEvent { Label = "Delay reported", OccurredAt = expected.AddMinutes(-10) });
            context.Deliveries.Add(delivery);
        }
        await context.SaveChangesAsync();

        // ---- Customer issues (10) ----
        var issueTypes = Enum.GetValues<CustomerIssueType>();
        var issueDescriptions = new[]
        {
            "Customer asking whether gluten free bread is in stock.",
            "Customer complaint about long checkout wait time.",
            "Refund requested for spoiled milk purchased yesterday.",
            "Customer reports missing item from online pickup order.",
            "Price mismatch on discounted cereal box vs shelf tag.",
            "Customer requested assistance finding electronics section.",
            "Complaint about rude interaction at deli counter.",
            "Refund requested — wrong item delivered.",
            "Customer asking about bulk order for rice.",
            "Missing product: advertised sale item not on shelf."
        };
        var departments = new[] { "Grocery", "Bakery", "Dairy", "Electronics", "Checkout", "Deli", "Produce", "Customer Service", "Grocery", "Meat" };
        var issueStatuses = Enum.GetValues<CustomerIssueStatus>();

        for (int i = 0; i < issueDescriptions.Length; i++)
        {
            var status = issueStatuses[rnd.Next(issueStatuses.Length)];
            var created = now.AddHours(-rnd.Next(1, 72));
            context.CustomerIssues.Add(new CustomerIssue
            {
                Type = issueTypes[rnd.Next(issueTypes.Length)],
                Description = issueDescriptions[i],
                Department = departments[i],
                Priority = priorities[rnd.Next(priorities.Length)],
                Status = status,
                AssignedToUserId = status != CustomerIssueStatus.Open ? staff[rnd.Next(staff.Count)].Id : null,
                CreatedByUserId = staff[rnd.Next(staff.Count)].Id,
                CreatedAt = created,
                ResolvedAt = status == CustomerIssueStatus.Resolved ? created.AddHours(rnd.Next(1, 24)) : null
            });
        }
        await context.SaveChangesAsync();

        // ---- Attendance records ----
        foreach (var u in employees)
        {
            for (int d = 0; d < 5; d++)
            {
                var day = now.Date.AddDays(-d);
                var clockIn = day.AddHours(8 + rnd.Next(0, 2));
                var isToday = d == 0;
                var clockOut = isToday && u.CurrentStatus != ShiftStatus.OffShift ? (DateTime?)null : clockIn.AddHours(7 + rnd.Next(0, 2));

                var record = new Attendance
                {
                    UserId = u.Id,
                    ClockIn = clockIn,
                    ClockOut = clockOut,
                    TotalBreakMinutes = 30
                };
                if (!isToday || rnd.Next(0, 2) == 0)
                {
                    record.BreakStart = clockIn.AddHours(3);
                    record.BreakEnd = record.BreakStart.Value.AddMinutes(30);
                }
                context.Attendance.Add(record);
            }
        }
        await context.SaveChangesAsync();

        // ---- Notifications (20) ----
        var notifTargets = staff.Concat(new[] { manager }).ToList();
        var notifTemplates = new (NotificationType Type, string Title, string Message)[]
        {
            (NotificationType.TaskAssigned, "New task assigned", "You were assigned: Restock milk aisle"),
            (NotificationType.TaskUrgent, "Urgent task", "Frozen aisle spill needs immediate attention"),
            (NotificationType.StockCritical, "Low stock alert", "Chicken Breast is now Critical"),
            (NotificationType.DeliveryDelayed, "Delivery delayed", "DLV2044 is running behind schedule"),
            (NotificationType.IssueAssigned, "Customer issue assigned", "Refund request needs your attention"),
            (NotificationType.Mention, "You were mentioned", "Sato Morgan mentioned you on a task"),
            (NotificationType.TaskCompleted, "Task completed", "Dairy inventory count marked complete"),
            (NotificationType.General, "Shift reminder", "Your shift starts in 30 minutes")
        };

        for (int i = 0; i < 20; i++)
        {
            var t = notifTemplates[rnd.Next(notifTemplates.Length)];
            var target = notifTargets[rnd.Next(notifTargets.Count)];
            context.Notifications.Add(new Notification
            {
                UserId = target.Id,
                Type = t.Type,
                Title = t.Title,
                Message = t.Message,
                IsRead = rnd.Next(0, 2) == 0,
                CreatedAt = now.AddHours(-rnd.Next(1, 96))
            });
        }
        await context.SaveChangesAsync();

        // ---- Activity logs ----
        var actionSamples = new[]
        {
            "Clocked in", "Completed restocking task", "Marked cleaning task complete", "Created task",
            "Updated customer issue status", "Adjusted stock quantity", "Commented on task", "Clocked out"
        };
        for (int i = 0; i < 40; i++)
        {
            var u = notifTargets[rnd.Next(notifTargets.Count)];
            context.ActivityLogs.Add(new ActivityLog
            {
                UserId = u.Id,
                Action = actionSamples[rnd.Next(actionSamples.Length)],
                EntityType = "General",
                CreatedAt = now.AddMinutes(-rnd.Next(5, 6000))
            });
        }
        await context.SaveChangesAsync();
    }

    private static string BuildEmail(string name)
    {
        var cleaned = name.ToLower().Replace(" ", ".").Replace("'", "");
        return $"{cleaned}@storeflow.local";
    }
}
