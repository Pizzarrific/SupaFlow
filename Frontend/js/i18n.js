// ================= Lightweight i18n =================
// Translates Supaflow's UI chrome (nav, headers, buttons, login) between
// English and Japanese. Data coming from the API (task titles, product
// names, employee names, status/category enum values) is real content,
// not UI copy, so it is intentionally left as-is.

const DICT = {
  en: {
    tagline: 'Keep the store moving',
    nav_dashboard: 'Store Overview', nav_tasks: 'My Tasks', nav_team: 'Team Board',
    nav_employees: 'Employees', nav_attendance: 'Attendance', nav_inventory: 'Inventory',
    nav_restocking: 'Restocking', nav_cleaning: 'Cleaning', nav_deliveries: 'Deliveries',
    nav_customerService: 'Customer Service', nav_reports: 'Reports', logout: 'Log out',
    search_placeholder: 'Search tasks, employees, SKUs…', notifications: 'Notifications',
    lang_toggle: 'English',

    dash_subtitle: "Here's what needs attention on the floor.",
    dash_attention: 'What needs attention?', dash_quick_actions: 'Quick actions',
    qa_add_task: 'Add task', qa_clock: 'Go to attendance', qa_report_issue: 'Report customer issue', qa_restock: 'View restock queue',

    tasks_title: 'My Tasks', tasks_subtitle: 'Drag cards between columns to update status.', add_task: 'Add Task',
    team_title: 'Team Board', team_subtitle: "Who's on the floor right now.",
    emp_title: 'Employee Directory', emp_subtitle: 'Every Supaflow employee ID, department, and status.', add_employee: 'Add Employee',
    att_title: 'Attendance', att_subtitle: 'Clock in, take breaks, and track your hours.',
    inv_title: 'Inventory', inv_subtitle: 'Live stock levels across the store.', add_product: 'Add Product',
    rs_title: 'Restocking Queue', rs_subtitle: 'Work through low stock products, shelf by shelf.',
    cl_title: 'Cleaning', cl_subtitle: 'Track cleanliness across every area of the store.', schedule_cleaning: 'Schedule Cleaning',
    dl_title: 'Deliveries', dl_subtitle: 'Track incoming shipments and dock activity.', new_delivery: 'New Delivery',
    cs_title: 'Customer Service', cs_subtitle: 'Log and resolve customer issues quickly.', report_issue: 'Report Issue',
    rep_title: 'Reports', rep_subtitle: 'Real time statistics generated from live store data.',

    // ---- Common ----
    close: 'Close', cancel: 'Cancel', save: 'Save', save_changes: 'Save changes', delete: 'Delete', edit: 'Edit',
    view_profile: 'View Profile', unassigned: 'Unassigned', none: 'None', loading: 'Loading…',

    // ---- Task board ----
    col_todo: 'To Do', col_inprogress: 'In Progress', col_blocked: 'Blocked', col_done: 'Done',
    no_tasks_here: 'No tasks here.', filter_all_priorities: 'All priorities', filter_all_categories: 'All categories',
    filter_all_employees: 'All employees', search_tasks: 'Search tasks…',
    task_title_label: 'Title', task_title_ph: 'e.g. Restock dairy aisle', task_desc_label: 'Description',
    task_desc_ph: 'Optional details…', task_category_label: 'Category', task_priority_label: 'Priority',
    task_assignee_label: 'Assign to', task_due_label: 'Due date', create_task: 'Create Task',
    task_created: 'Task created.', task_updated: 'Task updated.', task_completed_toast: 'Task marked complete.',
    moved_to: 'Moved to', comment_added: 'Comment added.', task_deleted: 'Task deleted.',
    comments_heading: 'Comments', no_comments: 'No comments yet.', comment_ph: 'Add a comment… use @Name to mention',
    send: 'Send', status_label: 'Status', assignee_label: 'Assignee', delete_task: 'Delete task',
    delete_task_confirm_title: 'Delete this task?', delete_task_confirm_body: 'This will permanently delete the task.',

    // ---- Team / Employees ----
    active_tasks: 'Active tasks', today_label: 'Today', search_employees: 'Search name, ID, email…',
    filter_all_departments: 'All departments', filter_all_statuses: 'All statuses',
    kpi_total_employees: 'Total employees', kpi_on_floor: 'On floor', kpi_on_break: 'On break', kpi_off_shift: 'Off shift',
    full_name: 'Full name', email_label: 'Email', phone_label: 'Phone', date_joined: 'Date joined',
    department_label: 'Department', job_role: 'Job role', job_role_ph: 'e.g. Stock Associate', manager_label: 'Manager',
    employment_status: 'Employment status', id_note: 'An Employee ID (e.g. STF00##) will be generated automatically. Temporary password:',
    employee_created: 'Employee created:', personal_info: 'Personal Information', work_info: 'Work Information',
    operations_heading: 'Operations', view_id_card: 'View ID Card', print_id_card: 'Print ID Card', edit_info: 'Edit Info',
    reset_password: 'Reset Password', deactivate: 'Deactivate', reactivate: 'Reactivate',
    manager_colon: 'Manager:', date_joined_colon: 'Date joined:', tasks_assigned_colon: 'Tasks assigned:',
    completed_colon: 'Completed:', current_status_colon: 'Current status:', on_shift_since: 'On shift since',
    currently_off_shift: 'Currently off shift', employee_id_card: 'Employee ID Card', active_employee: 'ACTIVE EMPLOYEE',
    reset_password_confirm: 'Generate a new temporary password for', new_temp_password: 'New temporary password:',
    password_reset_toast: 'Password reset.', deactivate_confirm_title: 'Deactivate employee?',
    deactivate_confirm_body: "'s account will be deactivated. Historical records are preserved.",
    employee_deactivated: 'Employee deactivated.', employee_reactivated: 'Employee reactivated.',
    employee_updated: 'Employee info updated.', no_employees_match: 'No employees match',
    try_different_search: 'Try a different search or filter.', manager_edit_note:
      "Employee ID, role, department, and employment status can't be edited by the employee themselves and are managed separately.",

    // ---- Attendance ----
    currently_off_shift_msg: "You're currently off shift.", clock_in: 'Clock In', shift_active: 'Shift active',
    on_break_label: 'On break', started_label: 'Started', clock_out: 'Clock Out', start_break: 'Start Break',
    end_break: 'End Break', this_week: 'This week', hours_this_week: 'Hours this week', hours_today: 'Hours today',
    recent_shifts: 'Recent shifts', team_attendance: 'Team Attendance', team_attendance_sub: "Today's clock in records across the store.",
    no_shifts_yet: 'No shifts recorded yet.', no_attendance_yet: 'No attendance records yet.',
    clocked_in_toast: 'Clocked in. Have a great shift!', clock_out_confirm_title: 'Clock out?', clock_out_confirm_body: 'End your shift now?',
    clocked_out_toast: 'Clocked out. Shift duration:', break_started_toast: 'Break started.', break_ended_toast: 'Break ended. Back on the floor!',
    col_employee_id: 'Employee ID', col_name: 'Name', col_clock_in: 'Clock In', col_clock_out: 'Clock Out', col_duration: 'Duration', active_badge: 'Active',

    // ---- Inventory ----
    search_by_name_sku: 'Search by name or SKU…', units_label: 'units', min_label: 'Min:',
    sku_label: 'SKU', product_name: 'Product name', category_label: 'Category', shelf_location: 'Shelf location',
    shelf_location_ph: 'e.g. Aisle 4 / Shelf B', starting_qty: 'Starting quantity', minimum_qty: 'Minimum quantity',
    no_products_found: 'No products found', product_added: 'Product added.', product_updated: 'Product updated.',
    stock_increased: 'Stock increased.', stock_decreased: 'Stock decreased.',

    // ---- Restocking ----
    queue_clear: 'Queue is clear', start_restock: 'Start Restock', mark_restocked: 'Mark Restocked',
    current_colon: 'Current:', min_colon: 'Min:', units_added: 'units added', restock_started: 'Restocking started.',
    restock_qty_prompt: 'how many units were added to the shelf?', qty_added_label: 'Quantity added',
    confirm_restocked: 'Confirm Restocked', restock_complete_toast: 'Restocking complete. Inventory updated.',

    // ---- Cleaning ----
    nothing_scheduled: 'Nothing scheduled', last_cleaned_label: 'Last cleaned:', next_due_label: 'Next due:',
    priority_label: 'Priority:', start_cleaning: 'Start Cleaning', complete_btn: 'Complete', report_issue_btn: 'Report Issue',
    marked_clean_toast: 'Marked clean.', cleaning_started_toast: 'Cleaning started.', report_cleaning_issue: 'Report Cleaning Issue',
    report_cleaning_note: 'This will log a maintenance task for', notes_label: 'Notes', notes_ph: 'Describe the issue…',
    issue_reported_toast: 'Issue reported as a maintenance task.', area_label: 'Area', assign_to_label: 'Assign to',
    next_due_field: 'Next due', schedule_btn: 'Schedule', cleaning_scheduled_toast: 'Cleaning scheduled.',

    // ---- Deliveries ----
    no_deliveries_found: 'No deliveries found', expected_label: 'Expected:', arrived_label: 'Arrived:',
    supplier_label: 'Supplier', expected_arrival: 'Expected arrival', dock_label: 'Dock', dock_ph: 'e.g. 2',
    delivery_created_toast: 'Delivery created.', update_delivery: 'Update Delivery', delivery_updated_toast: 'Delivery updated.',

    // ---- Customer service ----
    no_issues_logged: 'No issues logged', issue_type_label: 'Issue type', description_label: 'Description',
    manage_btn: 'Manage', issue_logged_toast: 'Issue logged.', issue_updated_toast: 'Issue updated.',
    reported_by: 'Reported by', assigned_colon: 'Assigned:',

    // ---- Reports ----
    completed_today: 'Completed today', overdue_tasks: 'Overdue tasks', avg_completion: 'Avg. completion time',
    employees_present: 'Employees present', employee_performance: 'Employee Performance', inventory_health: 'Inventory Health',
    col_completed: 'Completed', col_overdue: 'Overdue', col_hours: 'Hours', low_critical_stock: 'Low / critical stock',
    out_of_stock: 'Out of stock', restocks_today: 'Restocks today', opened_today: 'Opened today',
    total_resolved: 'Total resolved', avg_resolution: 'Avg. resolution time', employee_col: 'Employee',

    // ---- Dashboard extras ----
    greeting_morning: 'Good morning, {name}', greeting_afternoon: 'Good afternoon, {name}', greeting_evening: 'Good evening, {name}',
    pulse_tasks: 'Tasks', pulse_stock: 'Stock', pulse_deliveries: 'Deliveries', pulse_customers: 'Customers',
    urgent_active: 'urgent · active', critical_out: 'critical / out', delayed_today: 'delayed today',
    open_issues: 'open issues', no_recent_activity: 'No recent activity yet.',
    mark_all_read: 'Mark all read', all_caught_up: "You're all caught up.", delete_notification: 'Delete notification',
    no_matches_found: 'No matches found.', searching: 'Searching…',
    search_group_employees: 'Employees', search_group_tasks: 'Tasks', search_group_inventory: 'Inventory',
    search_group_deliveries: 'Deliveries', search_group_issues: 'Customer Issues',
    manager_access_only: 'Manager access only', reports_manager_note: 'Reports are visible to store managers.',
    page_not_found: 'Page not found', something_wrong: 'Something went wrong', please_try_again: 'Please try again.',
    more_label: 'More', session_reconnecting: 'Your session expired. Signing back in…', view_profile_menu: 'My Profile', are_you_sure: 'Are you sure?'
  },
  ja: {
    tagline: '店舗の稼働を止めない',
    nav_dashboard: '店舗概況', nav_tasks: 'マイタスク', nav_team: 'チームボード',
    nav_employees: '従業員', nav_attendance: '勤怠', nav_inventory: '在庫',
    nav_restocking: '補充', nav_cleaning: '清掃', nav_deliveries: '配送',
    nav_customerService: 'カスタマーサービス', nav_reports: 'レポート', logout: 'ログアウト',
    search_placeholder: 'タスク・従業員・SKUを検索…', notifications: '通知',
    lang_toggle: '日本語',

    dash_subtitle: '現場で対応が必要な項目です。',
    dash_attention: '対応が必要な項目', dash_quick_actions: 'クイックアクション',
    qa_add_task: 'タスクを追加', qa_clock: '勤怠へ移動', qa_report_issue: '顧客対応を報告', qa_restock: '補充キューを見る',

    tasks_title: 'マイタスク', tasks_subtitle: 'カードをドラッグしてステータスを変更できます。', add_task: 'タスクを追加',
    team_title: 'チームボード', team_subtitle: '現在フロアにいるメンバー。',
    emp_title: '従業員ディレクトリ', emp_subtitle: 'Supaflowの全従業員ID・部門・ステータス。', add_employee: '従業員を追加',
    att_title: '勤怠', att_subtitle: '出退勤・休憩・勤務時間を記録します。',
    inv_title: '在庫', inv_subtitle: '店舗全体のリアルタイム在庫状況。', add_product: '商品を追加',
    rs_title: '補充キュー', rs_subtitle: '在庫の少ない商品を棚ごとに処理します。',
    cl_title: '清掃', cl_subtitle: '店舗内すべてのエリアの清掃状況。', schedule_cleaning: '清掃を予定',
    dl_title: '配送', dl_subtitle: '入荷と搬入口の状況を確認します。', new_delivery: '新規配送',
    cs_title: 'カスタマーサービス', cs_subtitle: '顧客対応を記録し、迅速に解決します。', report_issue: '問題を報告',
    rep_title: 'レポート', rep_subtitle: '実店舗データから生成されたリアルタイム統計。',

    // ---- Common ----
    close: '閉じる', cancel: 'キャンセル', save: '保存', save_changes: '変更を保存', delete: '削除', edit: '編集',
    view_profile: 'プロフィールを見る', unassigned: '未割当', none: 'なし', loading: '読み込み中…',

    // ---- Task board ----
    col_todo: '未着手', col_inprogress: '進行中', col_blocked: '保留中', col_done: '完了',
    no_tasks_here: 'タスクはありません。', filter_all_priorities: 'すべての優先度', filter_all_categories: 'すべてのカテゴリ',
    filter_all_employees: 'すべての従業員', search_tasks: 'タスクを検索…',
    task_title_label: 'タイトル', task_title_ph: '例: 乳製品売り場の補充', task_desc_label: '説明',
    task_desc_ph: '詳細（任意）…', task_category_label: 'カテゴリ', task_priority_label: '優先度',
    task_assignee_label: '担当者', task_due_label: '期限', create_task: 'タスクを作成',
    task_created: 'タスクを作成しました。', task_updated: 'タスクを更新しました。', task_completed_toast: 'タスクを完了にしました。',
    moved_to: '移動先:', comment_added: 'コメントを追加しました。', task_deleted: 'タスクを削除しました。',
    comments_heading: 'コメント', no_comments: 'コメントはまだありません。', comment_ph: 'コメントを追加… @名前でメンション',
    send: '送信', status_label: 'ステータス', assignee_label: '担当者', delete_task: 'タスクを削除',
    delete_task_confirm_title: 'このタスクを削除しますか？', delete_task_confirm_body: 'タスクは完全に削除されます。',

    // ---- Team / Employees ----
    active_tasks: '対応中タスク', today_label: '本日', search_employees: '名前・ID・メールで検索…',
    filter_all_departments: 'すべての部門', filter_all_statuses: 'すべてのステータス',
    kpi_total_employees: '総従業員数', kpi_on_floor: '勤務中', kpi_on_break: '休憩中', kpi_off_shift: '勤務外',
    full_name: '氏名', email_label: 'メールアドレス', phone_label: '電話番号', date_joined: '入社日',
    department_label: '部門', job_role: '役職', job_role_ph: '例: 品出し担当', manager_label: 'マネージャー',
    employment_status: '雇用ステータス', id_note: '従業員ID（例: STF00##）は自動的に生成されます。仮パスワード:',
    employee_created: '従業員を作成しました:', personal_info: '個人情報', work_info: '勤務情報',
    operations_heading: '稼働状況', view_id_card: 'IDカードを見る', print_id_card: 'IDカードを印刷', edit_info: '情報を編集',
    reset_password: 'パスワードを再設定', deactivate: '無効化', reactivate: '再有効化',
    manager_colon: 'マネージャー:', date_joined_colon: '入社日:', tasks_assigned_colon: '割当タスク:',
    completed_colon: '完了:', current_status_colon: '現在のステータス:', on_shift_since: '勤務開始',
    currently_off_shift: '現在勤務外です', employee_id_card: '従業員IDカード', active_employee: '在籍中の従業員',
    reset_password_confirm: 'の新しい仮パスワードを生成しますか？', new_temp_password: '新しい仮パスワード:',
    password_reset_toast: 'パスワードを再設定しました。', deactivate_confirm_title: '従業員を無効化しますか？',
    deactivate_confirm_body: 'のアカウントが無効化されます。過去の記録は保持されます。',
    employee_deactivated: '従業員を無効化しました。', employee_reactivated: '従業員を再有効化しました。',
    employee_updated: '従業員情報を更新しました。', no_employees_match: '該当する従業員がいません',
    try_different_search: '検索条件やフィルターを変更してください。', manager_edit_note:
      '従業員ID・役割・部門・雇用ステータスは従業員自身では編集できず、別途管理されます。',

    // ---- Attendance ----
    currently_off_shift_msg: '現在勤務外です。', clock_in: '出勤', shift_active: '勤務中',
    on_break_label: '休憩中', started_label: '開始', clock_out: '退勤', start_break: '休憩開始',
    end_break: '休憩終了', this_week: '今週', hours_this_week: '今週の勤務時間', hours_today: '本日の勤務時間',
    recent_shifts: '最近のシフト', team_attendance: 'チーム勤怠', team_attendance_sub: '本日の店舗全体の出退勤記録。',
    no_shifts_yet: 'まだシフトの記録がありません。', no_attendance_yet: 'まだ勤怠記録がありません。',
    clocked_in_toast: '出勤しました。良いシフトを！', clock_out_confirm_title: '退勤しますか？', clock_out_confirm_body: '今すぐシフトを終了しますか？',
    clocked_out_toast: '退勤しました。勤務時間:', break_started_toast: '休憩を開始しました。', break_ended_toast: '休憩を終了しました。フロアに戻りましょう！',
    col_employee_id: '従業員ID', col_name: '名前', col_clock_in: '出勤', col_clock_out: '退勤', col_duration: '時間', active_badge: '勤務中',

    // ---- Inventory ----
    search_by_name_sku: '商品名またはSKUで検索…', units_label: '個', min_label: '最小値:',
    sku_label: 'SKU', product_name: '商品名', category_label: 'カテゴリ', shelf_location: '棚の位置',
    shelf_location_ph: '例: 通路4 / 棚B', starting_qty: '初期数量', minimum_qty: '最小数量',
    no_products_found: '商品が見つかりません', product_added: '商品を追加しました。', product_updated: '商品を更新しました。',
    stock_increased: '在庫を増やしました。', stock_decreased: '在庫を減らしました。',

    // ---- Restocking ----
    queue_clear: 'キューは空です', start_restock: '補充を開始', mark_restocked: '補充完了にする',
    current_colon: '現在:', min_colon: '最小:', units_added: '個 追加', restock_started: '補充を開始しました。',
    restock_qty_prompt: '棚に追加した数量を入力してください。', qty_added_label: '追加した数量',
    confirm_restocked: '補充完了を確認', restock_complete_toast: '補充が完了しました。在庫を更新しました。',

    // ---- Cleaning ----
    nothing_scheduled: '予定はありません', last_cleaned_label: '前回清掃:', next_due_label: '次回予定:',
    priority_label: '優先度:', start_cleaning: '清掃を開始', complete_btn: '完了', report_issue_btn: '問題を報告',
    marked_clean_toast: '清掃完了にしました。', cleaning_started_toast: '清掃を開始しました。', report_cleaning_issue: '清掃の問題を報告',
    report_cleaning_note: 'のメンテナンスタスクとして記録されます。', notes_label: 'メモ', notes_ph: '問題の内容を記入…',
    issue_reported_toast: 'メンテナンスタスクとして報告しました。', area_label: 'エリア', assign_to_label: '担当者',
    next_due_field: '次回予定日', schedule_btn: '予定を登録', cleaning_scheduled_toast: '清掃を予定に登録しました。',

    // ---- Deliveries ----
    no_deliveries_found: '配送が見つかりません', expected_label: '到着予定:', arrived_label: '到着:',
    supplier_label: 'サプライヤー', expected_arrival: '到着予定時刻', dock_label: '搬入口', dock_ph: '例: 2',
    delivery_created_toast: '配送を作成しました。', update_delivery: '配送を更新', delivery_updated_toast: '配送を更新しました。',

    // ---- Customer service ----
    no_issues_logged: '記録された問題はありません', issue_type_label: '問題の種類', description_label: '内容',
    manage_btn: '管理', issue_logged_toast: '問題を記録しました。', issue_updated_toast: '問題を更新しました。',
    reported_by: '報告者', assigned_colon: '担当:',

    // ---- Reports ----
    completed_today: '本日の完了数', overdue_tasks: '期限超過タスク', avg_completion: '平均完了時間',
    employees_present: '出勤中の従業員', employee_performance: '従業員パフォーマンス', inventory_health: '在庫状況',
    col_completed: '完了', col_overdue: '期限超過', col_hours: '時間', low_critical_stock: '低在庫・危険在庫',
    out_of_stock: '欠品', restocks_today: '本日の補充数', opened_today: '本日の受付件数',
    total_resolved: '解決済み合計', avg_resolution: '平均解決時間', employee_col: '従業員',

    // ---- Dashboard extras ----
    greeting_morning: 'おはようございます、{name}さん', greeting_afternoon: 'こんにちは、{name}さん', greeting_evening: 'こんばんは、{name}さん',
    pulse_tasks: 'タスク', pulse_stock: '在庫', pulse_deliveries: '配送', pulse_customers: '顧客対応',
    urgent_active: '緊急・対応中', critical_out: '危険・欠品', delayed_today: '本日遅延',
    open_issues: '未対応の問題', no_recent_activity: '最近の活動はありません。',
    mark_all_read: 'すべて既読にする', all_caught_up: 'すべて確認済みです。', delete_notification: '通知を削除',
    no_matches_found: '一致する結果がありません。', searching: '検索中…',
    search_group_employees: '従業員', search_group_tasks: 'タスク', search_group_inventory: '在庫',
    search_group_deliveries: '配送', search_group_issues: 'カスタマー対応',
    manager_access_only: 'マネージャーのみ閲覧可能', reports_manager_note: 'レポートは店舗マネージャーのみ閲覧できます。',
    page_not_found: 'ページが見つかりません', something_wrong: '問題が発生しました', please_try_again: 'もう一度お試しください。',
    more_label: 'もっと見る', session_reconnecting: 'セッションが切れました。再接続しています…', view_profile_menu: 'マイプロフィール', are_you_sure: '本当によろしいですか？'
  }
};

// ---- Enum value labels (status/priority/category badges everywhere) ----
const ENUM_JA = {
  Todo: '未着手', InProgress: '進行中', Blocked: '保留中', Completed: '完了',
  Low: '低', Medium: '中', High: '高', Urgent: '緊急',
  Restocking: '補充', Cleaning: '清掃', Inventory: '在庫', Delivery: '配送',
  CustomerService: 'カスタマーサービス', Maintenance: 'メンテナンス', Other: 'その他',
  InStock: '在庫あり', LowStock: '低在庫', Critical: '危険', OutOfStock: '欠品',
  Queued: '待機中', Clean: '清潔', Due: '要清掃', Overdue: '期限超過',
  Scheduled: '予定', InTransit: '輸送中', Arriving: '到着予定', Arrived: '到着済み',
  Checking: '確認中', Delayed: '遅延',
  ProductQuestion: '商品に関する質問', Complaint: '苦情', Refund: '返金',
  MissingProduct: '商品の欠品', PriceMismatch: '価格相違', AssistanceRequested: '接客希望',
  Open: '未対応', Waiting: '保留', Resolved: '解決済み',
  Active: '在籍中', OnLeave: '休職中', Suspended: '停止中', Inactive: '退職済み',
  OffShift: '勤務外', OnFloor: '勤務中', OnBreak: '休憩中', Busy: '対応中',
  Manager: 'マネージャー', Employee: '従業員'
};

const I18n = {
  lang: localStorage.getItem('sf_lang') || 'en',

  t(key) {
    return (DICT[this.lang] && DICT[this.lang][key]) || DICT.en[key] || key;
  },

  // Translates enum values (task status, priority, category, inventory
  // status, etc.) wherever they're displayed as badges across every view.
  // Falls back to the plain English humanize (space-split camelCase) when
  // there's no Japanese mapping for a given value.
  enumLabel(value) {
    if (!value) return '';
    if (this.lang === 'ja' && ENUM_JA[value]) return ENUM_JA[value];
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  },

  toggle() {
    this.lang = this.lang === 'en' ? 'ja' : 'en';
    localStorage.setItem('sf_lang', this.lang);
    this.apply();
    document.dispatchEvent(new CustomEvent('sf-lang-change'));
  },

  apply() {
    document.documentElement.lang = this.lang === 'ja' ? 'ja' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-lang-toggle-label]').forEach(el => {
      el.textContent = this.t('lang_toggle');
    });
  }
};
