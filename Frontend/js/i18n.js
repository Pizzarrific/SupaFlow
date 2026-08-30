// ================= Lightweight i18n =================
// Translates StoreFlow's UI chrome (nav, headers, buttons, login) between
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
    login_title: 'Sign in to your shift', login_subtitle: 'Enter your StoreFlow credentials to access the floor.',
    email: 'Email', password: 'Password', sign_in: 'Sign in', signing_in: 'Signing in…',
    demo_accounts: 'Demo accounts', demo_password_note: 'Password for both: Password123!',
    lang_toggle: '日本語',

    dash_subtitle: "Here's what needs attention on the floor.",
    dash_attention: 'What needs attention?', dash_quick_actions: 'Quick actions',
    qa_add_task: 'Add task', qa_clock: 'Go to attendance', qa_report_issue: 'Report customer issue', qa_restock: 'View restock queue',

    tasks_title: 'My Tasks', tasks_subtitle: 'Drag cards between columns to update status.', add_task: 'Add Task',
    team_title: 'Team Board', team_subtitle: "Who's on the floor right now.",
    emp_title: 'Employee Directory', emp_subtitle: 'Every StoreFlow employee ID, department, and status.', add_employee: 'Add Employee',
    att_title: 'Attendance', att_subtitle: 'Clock in, take breaks, and track your hours.',
    inv_title: 'Inventory', inv_subtitle: 'Live stock levels across the store.', add_product: 'Add Product',
    rs_title: 'Restocking Queue', rs_subtitle: 'Work through low stock products, shelf by shelf.',
    cl_title: 'Cleaning', cl_subtitle: 'Track cleanliness across every area of the store.', schedule_cleaning: 'Schedule Cleaning',
    dl_title: 'Deliveries', dl_subtitle: 'Track incoming shipments and dock activity.', new_delivery: 'New Delivery',
    cs_title: 'Customer Service', cs_subtitle: 'Log and resolve customer issues quickly.', report_issue: 'Report Issue',
    rep_title: 'Reports', rep_subtitle: 'Real time statistics generated from live store data.'
  },
  ja: {
    tagline: '店舗の稼働を止めない',
    nav_dashboard: '店舗概況', nav_tasks: 'マイタスク', nav_team: 'チームボード',
    nav_employees: '従業員', nav_attendance: '勤怠', nav_inventory: '在庫',
    nav_restocking: '補充', nav_cleaning: '清掃', nav_deliveries: '配送',
    nav_customerService: 'カスタマーサービス', nav_reports: 'レポート', logout: 'ログアウト',
    search_placeholder: 'タスク・従業員・SKUを検索…', notifications: '通知',
    login_title: 'シフトにサインイン', login_subtitle: 'StoreFlowの認証情報を入力してください。',
    email: 'メールアドレス', password: 'パスワード', sign_in: 'サインイン', signing_in: 'サインイン中…',
    demo_accounts: 'デモアカウント', demo_password_note: '共通パスワード: Password123!',
    lang_toggle: 'English',

    dash_subtitle: '現場で対応が必要な項目です。',
    dash_attention: '対応が必要な項目', dash_quick_actions: 'クイックアクション',
    qa_add_task: 'タスクを追加', qa_clock: '勤怠へ移動', qa_report_issue: '顧客対応を報告', qa_restock: '補充キューを見る',

    tasks_title: 'マイタスク', tasks_subtitle: 'カードをドラッグしてステータスを変更できます。', add_task: 'タスクを追加',
    team_title: 'チームボード', team_subtitle: '現在フロアにいるメンバー。',
    emp_title: '従業員ディレクトリ', emp_subtitle: 'StoreFlowの全従業員ID・部門・ステータス。', add_employee: '従業員を追加',
    att_title: '勤怠', att_subtitle: '出退勤・休憩・勤務時間を記録します。',
    inv_title: '在庫', inv_subtitle: '店舗全体のリアルタイム在庫状況。', add_product: '商品を追加',
    rs_title: '補充キュー', rs_subtitle: '在庫の少ない商品を棚ごとに処理します。',
    cl_title: '清掃', cl_subtitle: '店舗内すべてのエリアの清掃状況。', schedule_cleaning: '清掃を予定',
    dl_title: '配送', dl_subtitle: '入荷と搬入口の状況を確認します。', new_delivery: '新規配送',
    cs_title: 'カスタマーサービス', cs_subtitle: '顧客対応を記録し、迅速に解決します。', report_issue: '問題を報告',
    rep_title: 'レポート', rep_subtitle: '実店舗データから生成されたリアルタイム統計。'
  }
};

const I18n = {
  lang: localStorage.getItem('sf_lang') || 'en',

  t(key) {
    return (DICT[this.lang] && DICT[this.lang][key]) || DICT.en[key] || key;
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
