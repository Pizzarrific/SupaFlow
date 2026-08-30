// ================= App bootstrap =================

(async function init() {
  const ok = await Auth.ensureSession();
  if (!ok) {
    showConnectionError();
    return;
  }

  const user = Auth.getUser();

  // Hide manager-only nav items for employees
  if (!Auth.isManager()) {
    document.getElementById('nav-reports')?.classList.add('hidden');
  }

  // Topbar profile
  document.getElementById('profile-avatar').textContent = Auth.initials(user.name);
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-role').textContent = `${user.jobTitle || user.role} · ${user.employeeId}`;

  // Live date/time
  updateDateTime();
  setInterval(updateDateTime, 1000 * 30);

  NotifCenter.init();
  GlobalSearch.init();
  wireProfileMenu();
  wireMobileMore();
  wireLangToggle();

  I18n.apply();

  runStartupSequence(user).then(() => {
    const { viewName, params } = parseHash();
    navigateTo(viewName, params);
  });
})();

function showConnectionError() {
  const overlay = document.getElementById('startup-overlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div style="width:64px; height:64px; border-radius: var(--radius-md); background: var(--status-urgent); color:#fff;
      display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.6rem; box-shadow: var(--shadow-lg);">!</div>
    <div class="startup-name">Can't reach StoreFlow</div>
    <div class="startup-tagline">The API isn't responding at ${window.STOREFLOW_API_BASE || 'the configured address'}.</div>
    <button class="btn btn-primary" style="margin-top:0.8rem;" id="startup-retry">Retry</button>
    <div class="startup-status">If you just deployed the frontend, make sure the backend is running and
      <code>Frontend/js/config.js</code> points at its real URL.</div>
  `;
  document.getElementById('startup-retry').onclick = () => location.reload();
}

function runStartupSequence(user) {
  const overlay = document.getElementById('startup-overlay');
  const fill = document.getElementById('startup-progress');
  const statusEl = document.getElementById('startup-status');
  if (!overlay) return Promise.resolve();

  // Only play the full sequence right after a fresh login; on a plain page
  // refresh, skip straight to a much shorter flash so navigating around the
  // app doesn't feel like it's "booting up" every time.
  const justLoggedIn = sessionStorage.getItem('sf_just_logged_in') === '1';
  sessionStorage.removeItem('sf_just_logged_in');

  const steps = justLoggedIn ? [
    [15, 'Waking up the floor…'],
    [45, `Loading today's shift, ${user.name.split(' ')[0]}…`],
    [75, 'Syncing tasks, stock, and deliveries…'],
    [100, 'Ready.']
  ] : [
    [60, 'Reconnecting…'],
    [100, 'Ready.']
  ];

  const stepDelay = justLoggedIn ? 380 : 160;

  return new Promise((resolve) => {
    let i = 0;
    function next() {
      if (i >= steps.length) {
        overlay.classList.add('fade-out');
        setTimeout(() => { overlay.remove(); resolve(); }, 500);
        return;
      }
      const [pct, label] = steps[i];
      fill.style.width = pct + '%';
      statusEl.textContent = label;
      i++;
      setTimeout(next, stepDelay);
    }
    next();
  });
}

function wireLangToggle() {
  const island = document.getElementById('dynamic-island');
  const langBtn = document.getElementById('lang-toggle-btn');
  const topbarLangBtn = document.getElementById('topbar-lang-btn');

  island?.addEventListener('click', () => island.classList.toggle('expanded'));
  island?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); island.classList.toggle('expanded'); }
  });
  document.addEventListener('click', (e) => {
    if (island && !island.contains(e.target)) island.classList.remove('expanded');
  });

  langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    I18n.toggle();
  });
  topbarLangBtn?.addEventListener('click', () => I18n.toggle());

  document.addEventListener('sf-lang-change', () => {
    if (currentView) navigateTo(currentView);
  });
}

function updateDateTime() {
  const el = document.getElementById('topbar-datetime');
  if (!el) return;
  el.textContent = new Date().toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function wireProfileMenu() {
  const btn = document.getElementById('profile-btn');
  const panel = document.getElementById('profile-panel');
  const user = Auth.getUser();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('hidden')) {
      closeOtherPanels('profile-panel');
      panel.classList.remove('hidden');
      panel.innerHTML = `
        <div style="padding:0.8rem;">
          <div style="font-weight:700; font-size:0.85rem;">${escapeHtml(user.name)}</div>
          <div class="text-muted mono" style="font-size:0.75rem;">${user.employeeId}</div>
        </div>
        <div class="divider" style="margin:0;"></div>
        <button class="nav-item" style="width:100%; border-radius:0;" id="pm-view-profile">🪪 ${I18n.t('view_profile_menu')}</button>
        <button class="nav-item" style="width:100%; border-radius:0;" id="pm-logout">↩ ${I18n.t('logout')}</button>
      `;
      panel.querySelector('#pm-view-profile').onclick = () => { panel.classList.add('hidden'); Views.employees.openProfile(user.id); };
      panel.querySelector('#pm-logout').onclick = () => Auth.logout();
    } else {
      panel.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.add('hidden');
  });

  document.getElementById('sidebar-logout').addEventListener('click', () => Auth.logout());
}

function wireMobileMore() {
  document.getElementById('mobile-more-btn').addEventListener('click', () => {
    const items = [
      ['team', `👥 ${I18n.t('nav_team')}`], ['employees', `🪪 ${I18n.t('nav_employees')}`], ['restocking', `🔁 ${I18n.t('nav_restocking')}`],
      ['cleaning', `🧽 ${I18n.t('nav_cleaning')}`], ['deliveries', `🚚 ${I18n.t('nav_deliveries')}`], ['customer-service', `🎧 ${I18n.t('nav_customerService')}`]
    ];
    if (Auth.isManager()) items.push(['reports', `📊 ${I18n.t('nav_reports')}`]);

    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('more_label')}</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body" style="padding:0.6rem;">
        ${items.map(([view, label]) => `<button class="nav-item" style="width:100%; margin-bottom:0.2rem;" data-goto="${view}">${label}</button>`).join('')}
      </div>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
      location.hash = `#${b.dataset.goto}`;
      closeModal();
    }));
  });
}
