using Microsoft.EntityFrameworkCore;
using Supaflow.Api.Helpers;
using Supaflow.Api.Models;

namespace Supaflow.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(SupaflowContext context)
    {
        if (await context.Users.AnyAsync()) return; // already seeded

        var now = DateTime.UtcNow;
        var demoPasswordHash = PasswordHasher.Hash("Password123!");

        // ---- Employees ----
        var manager = new User
        {
            EmployeeId = "STF0001", Name = "佐藤 学", Email = "manager@supaflow.local",
            Phone = "555 0101", PasswordHash = demoPasswordHash, Role = UserRole.Manager,
            Department = "管理部", JobTitle = "店長", EmploymentStatus = EmploymentStatus.Active,
            DateJoined = now.AddYears(-3), CurrentStatus = ShiftStatus.OnFloor, LastLoginAt = now.AddHours(-2)
        };

        var employee1 = new User
        {
            EmployeeId = "STF0002", Name = "鈴木 さくら", Email = "employee@supaflow.local",
            Phone = "555 0102", PasswordHash = demoPasswordHash, Role = UserRole.Employee,
            Department = "レジ", JobTitle = "レジ担当", EmploymentStatus = EmploymentStatus.Active,
            DateJoined = now.AddYears(-1).AddMonths(-2), CurrentStatus = ShiftStatus.OnFloor, LastLoginAt = now.AddHours(-1)
        };

        var employees = new List<User> { manager, employee1 };

        var extra = new (string Name, string Dept, string Title, string Email)[]
        {
            ("高橋 愛", "カスタマーサービス", "接客担当", "takahashi.ai@supaflow.local"),
            ("田中 大輔", "乳製品", "品出し担当", "tanaka.daisuke@supaflow.local"),
            ("渡辺 真央", "青果", "青果担当", "watanabe.mao@supaflow.local"),
            ("伊藤 健二", "倉庫", "倉庫担当", "ito.kenji@supaflow.local"),
            ("中村 涼", "ベーカリー", "パン職人", "nakamura.ryo@supaflow.local"),
            ("小林 舞", "精肉", "精肉担当", "kobayashi.mai@supaflow.local"),
            ("山本 直樹", "冷凍食品", "品出し担当", "yamamoto.naoki@supaflow.local"),
            ("吉田 美咲", "食料品", "食料品担当", "yoshida.misaki@supaflow.local")
        };

        var statuses = new[] { ShiftStatus.OnFloor, ShiftStatus.OnBreak, ShiftStatus.OffShift, ShiftStatus.Busy };
        int idx = 3;
        foreach (var (name, dept, title, email) in extra)
        {
            employees.Add(new User
            {
                EmployeeId = $"STF{idx:D4}",
                Name = name,
                Email = email,
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
            ("牛乳 1L", "乳製品", "4番通路 / B棚"),
            ("食パン", "ベーカリー", "1番通路 / A棚"),
            ("卵 12個パック", "乳製品", "4番通路 / C棚"),
            ("米 5kg", "食料品", "6番通路 / A棚"),
            ("鶏むね肉", "精肉", "9番通路 / 冷蔵ケース2"),
            ("りんご", "青果", "0番通路 / カゴ3"),
            ("バナナ", "青果", "0番通路 / カゴ1"),
            ("冷凍グリーンピース", "冷凍食品", "10番通路 / 冷凍ケース2"),
            ("オレンジジュース", "乳製品", "4番通路 / D棚"),
            ("コーヒー", "食料品", "7番通路 / B棚"),
            ("トイレットペーパー", "日用品", "12番通路 / A棚"),
            ("食器用洗剤", "日用品", "12番通路 / C棚"),
            ("チェダーチーズ", "乳製品", "4番通路 / A棚"),
            ("牛ひき肉", "精肉", "9番通路 / 冷蔵ケース1"),
            ("鮭の切り身", "精肉", "9番通路 / 冷蔵ケース3"),
            ("トマト", "青果", "0番通路 / カゴ5"),
            ("じゃがいも 2kg", "青果", "0番通路 / カゴ6"),
            ("冷凍ピザ", "冷凍食品", "10番通路 / 冷凍ケース1"),
            ("アイスクリーム", "冷凍食品", "10番通路 / 冷凍ケース4"),
            ("パスタ", "食料品", "6番通路 / C棚"),
            ("パスタソース", "食料品", "6番通路 / D棚"),
            ("シリアル", "食料品", "5番通路 / A棚"),
            ("クロワッサン", "ベーカリー", "1番通路 / B棚"),
            ("ベーグル", "ベーカリー", "1番通路 / C棚"),
            ("ヨーグルト 4個パック", "乳製品", "4番通路 / E棚"),
            ("バター", "乳製品", "4番通路 / F棚"),
            ("ペーパータオル", "日用品", "12番通路 / B棚"),
            ("洗濯洗剤", "日用品", "13番通路 / A棚"),
            ("炭酸水", "飲料", "8番通路 / A棚"),
            ("オレンジソーダ", "飲料", "8番通路 / B棚")
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
            "牛乳売り場の補充", "青果コーナーの液体をこぼした箇所を清掃", "乳製品の在庫確認", "搬入口2の配送確認",
            "電化製品コーナーで接客対応", "冷凍食品売り場の補充", "レジ周りの徹底清掃", "ベーカリーの値札更新",
            "米・パスタ棚の補充", "乳製品の賞味期限確認", "レジ袋の補充", "トイレの消毒",
            "飲料売り場の補充", "冷凍庫の扉故障を報告", "倉庫のパレット整理", "りんごの補充",
            "6番通路の液体をこぼした箇所を清掃", "配送DLV2048の内容確認", "精肉冷蔵ケースの補充", "食料品売り場の棚札更新",
            "価格相違の苦情対応", "入口周辺の清掃", "紙製品の補充", "冷凍庫の温度記録確認",
            "ベーカリーの陳列準備", "シリアル売り場の補充", "乳製品冷蔵ケースのガラス清掃", "青果の破損商品記録",
            "日用品売り場の補充", "返金対応のフォローアップ"
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
                Description = $"{taskTitles[i]}（フロア巡回時に記録）",
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
                Comment = $"@{staff[0].Name.Split(' ')[0]}さん、午後の忙しい時間帯前に優先して対応してください。",
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
        var areas = new[] { "入口", "青果", "乳製品", "ベーカリー", "精肉", "冷凍食品", "レジ", "トイレ", "倉庫", "7番通路" };
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
        var suppliers = new[] { "フレッシュフーズ", "ゴールデンバレー乳業", "メトロベーカリー資材", "コースタルシーフード",
            "プライムミート", "グリーンリーフ青果", "ノーススター飲料", "エバーストック日用品" };
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
                Notes = status == DeliveryStatus.Delayed ? "運転手より渋滞による遅延の報告あり。" : null,
                CreatedAt = expected.AddHours(-3)
            };
            delivery.Events.Add(new DeliveryEvent { Label = "発注しました", OccurredAt = expected.AddHours(-3) });
            delivery.Events.Add(new DeliveryEvent { Label = "トラックが出発しました", OccurredAt = expected.AddHours(-1.5) });
            if (status != DeliveryStatus.Scheduled)
                delivery.Events.Add(new DeliveryEvent { Label = "店舗に接近中です", OccurredAt = expected.AddMinutes(-20) });
            if (status == DeliveryStatus.Delayed)
                delivery.Events.Add(new DeliveryEvent { Label = "遅延が報告されました", OccurredAt = expected.AddMinutes(-10) });
            context.Deliveries.Add(delivery);
        }
        await context.SaveChangesAsync();

        // ---- Customer issues (10) ----
        var issueTypes = Enum.GetValues<CustomerIssueType>();
        var issueDescriptions = new[]
        {
            "グルテンフリーパンの在庫についての質問。",
            "レジの待ち時間が長いという苦情。",
            "昨日購入した牛乳が傷んでいたため返金希望。",
            "オンライン受け取り注文の商品が不足しているとの報告。",
            "割引シリアルの価格が棚札と異なっている。",
            "電化製品コーナーでの接客を希望。",
            "精肉コーナーでの対応についての苦情。",
            "誤った商品が届いたため返金希望。",
            "米のまとめ買いについての問い合わせ。",
            "セール対象商品が棚に見当たらないとの報告。"
        };
        var departments = new[] { "食料品", "ベーカリー", "乳製品", "電化製品", "レジ", "惣菜", "青果", "カスタマーサービス", "食料品", "精肉" };
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
            (NotificationType.TaskAssigned, "新しいタスクが割り当てられました", "牛乳売り場の補充が割り当てられました"),
            (NotificationType.TaskUrgent, "緊急タスク", "冷凍食品売り場の液体漏れに至急対応してください"),
            (NotificationType.StockCritical, "在庫不足の警告", "鶏むね肉が危険な在庫水準です"),
            (NotificationType.DeliveryDelayed, "配送遅延", "DLV2044の到着が遅れています"),
            (NotificationType.IssueAssigned, "顧客対応が割り当てられました", "返金対応の確認をお願いします"),
            (NotificationType.Mention, "メンションされました", "佐藤学さんがタスクであなたをメンションしました"),
            (NotificationType.TaskCompleted, "タスク完了", "乳製品の在庫確認が完了しました"),
            (NotificationType.General, "シフトのお知らせ", "30分後にシフトが始まります")
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
            "出勤しました", "補充タスクを完了しました", "清掃タスクを完了にしました", "タスクを作成しました",
            "顧客対応のステータスを更新しました", "在庫数を調整しました", "タスクにコメントしました", "退勤しました"
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
}
