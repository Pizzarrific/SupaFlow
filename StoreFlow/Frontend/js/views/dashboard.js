Views.dashboard = {
  async render(root) {
    const user = Auth.getUser();
    root.innerHTML = `
      <div class="greeting-block">
        <h1>Good ${greetingWord()}, ${escapeHtml(user.name.split(' ')[0])}</h1>
        <p>${I18n.t('dash_subtitle')}</p>
      </div>
      <div class="pulse-grid" id="pulse-grid">
        ${Array(4).fill('<div class="pulse-card"><div class="skeleton skeleton-line" style="width:60%"></div><div class="skeleton skeleton-line" style="width:40%;height:28px;"></div></div>').join('')}
      </div>
      <div class="two-col">
        <div class="card">
          <div class="section-title"><h2>${I18n.t('dash_attention')}</h2></div>
          <div class="feed-list" id="activity-feed"><div class="skeleton skeleton-card"></div></div>
        </div>
        <div class="card">
          <div class="section-title"><h2>${I18n.t('dash_quick_actions')}</h2></div>
          <div style="display:flex; flex-direction:column; gap:0.6rem;">
            <button class="btn btn-secondary btn-block" id="qa-add-task">➕ ${I18n.t('qa_add_task')}</button>
            <button class="btn btn-secondary btn-block" id="qa-clock">🕒 ${I18n.t('qa_clock')}</button>
            <button class="btn btn-secondary btn-block" id="qa-report-issue">🎧 ${I18n.t('qa_report_issue')}</button>
            <button class="btn btn-secondary btn-block" id="qa-restock">📦 ${I18n.t('qa_restock')}</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('qa-add-task').onclick = () => { location.hash = '#tasks'; setTimeout(() => Views.tasks.openCreateModal?.(), 60); };
    document.getElementById('qa-clock').onclick = () => location.hash = '#attendance';
    document.getElementById('qa-report-issue').onclick = () => { location.hash = '#customer-service'; setTimeout(() => Views.customerService.openCreateModal?.(), 60); };
    document.getElementById('qa-restock').onclick = () => location.hash = '#restocking';

    const data = await api.get('/dashboard');
    this.renderPulse(data);
    this.renderFeed(data.activityFeed);
  },

  renderPulse(d) {
    const grid = document.getElementById('pulse-grid');
    grid.innerHTML = `
      <div class="pulse-card tasks">
        <div class="label">📋 Tasks</div>
        <div class="figure" id="fig-tasks">0</div>
        <div class="sub ${d.tasksUrgent > 0 ? 'warn' : ''}">${d.tasksUrgent} urgent · active</div>
      </div>
      <div class="pulse-card stock">
        <div class="label">📦 Stock</div>
        <div class="figure" id="fig-stock">0</div>
        <div class="sub ${d.criticalStockProducts > 0 ? 'warn' : ''}">${d.criticalStockProducts} critical / out</div>
      </div>
      <div class="pulse-card deliveries">
        <div class="label">🚚 Deliveries</div>
        <div class="figure" id="fig-deliveries">0</div>
        <div class="sub ${d.deliveriesDelayed > 0 ? 'warn' : ''}">${d.deliveriesDelayed} delayed today</div>
      </div>
      <div class="pulse-card customers">
        <div class="label">🎧 Customers</div>
        <div class="figure" id="fig-customers">0</div>
        <div class="sub">open issues</div>
      </div>
    `;
    animateCount(document.getElementById('fig-tasks'), d.tasksActive);
    animateCount(document.getElementById('fig-stock'), d.lowStockProducts + d.criticalStockProducts);
    animateCount(document.getElementById('fig-deliveries'), d.deliveriesToday);
    animateCount(document.getElementById('fig-customers'), d.openCustomerIssues);
  },

  renderFeed(items) {
    const feed = document.getElementById('activity-feed');
    if (!items.length) {
      feed.innerHTML = `<div class="state-block"><div class="icon">🌤️</div><p>No recent activity yet.</p></div>`;
      return;
    }
    feed.innerHTML = items.map((item, i) => `
      <div class="feed-item" data-type="${item.entityType}" data-id="${item.entityId || ''}">
        <div class="feed-time">${item.time}</div>
        <div class="feed-dot-col"><div class="feed-dot"></div>${i < items.length - 1 ? '<div class="feed-line"></div>' : ''}</div>
        <div class="feed-content"><div class="feed-msg">${escapeHtml(item.message)}</div></div>
      </div>
    `).join('');
    feed.querySelectorAll('.feed-item').forEach(el => {
      el.addEventListener('click', () => {
        if (el.dataset.type && el.dataset.id) openRecord(el.dataset.type, el.dataset.id);
      });
    });
  }
};

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
