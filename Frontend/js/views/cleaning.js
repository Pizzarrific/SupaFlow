Views.cleaning = {
  async render(root) {
    const isManager = Auth.isManager();
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="cl_title">Cleaning</h1><p class="subtitle" data-i18n="cl_subtitle">Track cleanliness across every area of the store.</p></div>
        ${isManager ? `<button class="btn btn-primary" id="add-clean-btn">➕ ${I18n.t('schedule_cleaning')}</button>` : ''}
      </div>
      <div class="filter-bar">
        <select id="cl-filter-status"><option value="">${I18n.t('filter_all_statuses')}</option><option value="Clean">${humanizeEnum('Clean')}</option><option value="Due">${humanizeEnum('Due')}</option><option value="InProgress">${humanizeEnum('InProgress')}</option><option value="Overdue">${humanizeEnum('Overdue')}</option></select>
      </div>
      <div class="card-grid" id="cl-grid">${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;
    if (isManager) document.getElementById('add-clean-btn').onclick = () => this.openCreateModal();
    document.getElementById('cl-filter-status').addEventListener('change', () => this.load());
    await this.load();
  },

  async load() {
    const status = document.getElementById('cl-filter-status')?.value;
    const list = await api.get(`/cleaning${status ? '?status=' + status : ''}`);
    const grid = document.getElementById('cl-grid');
    if (!list.length) { grid.innerHTML = `<div class="state-block" style="grid-column:1/-1;"><div class="icon">🧽</div><h3>${I18n.t('nothing_scheduled')}</h3></div>`; return; }
    grid.innerHTML = list.map(c => this.card(c)).join('');
    grid.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => this.updateStatus(b.dataset.start, 'InProgress')));
    grid.querySelectorAll('[data-complete]').forEach(b => b.addEventListener('click', () => this.updateStatus(b.dataset.complete, 'Clean')));
    grid.querySelectorAll('[data-report]').forEach(b => b.addEventListener('click', () => this.reportIssue(list.find(c => c.id == b.dataset.report))));
  },

  card(c) {
    return `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:700;">${escapeHtml(c.area)}</div>
            <div class="text-muted" style="font-size:0.78rem;">${c.assignedTo ? `${c.assignedTo.employeeId} · ${escapeHtml(c.assignedTo.name)}` : I18n.t('unassigned')}</div>
          </div>
          <span class="badge ${statusBadgeClass(c.status)}">${humanizeEnum(c.status)}</span>
        </div>
        <div class="divider"></div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">
          ${I18n.t('last_cleaned_label')} ${c.lastCleaned ? timeAgo(c.lastCleaned) : '—'}<br>
          ${I18n.t('next_due_label')} ${formatDateTime(c.nextDue)}<br>
          ${I18n.t('priority_label')} <span class="badge ${priorityBadgeClass(c.priority)}" style="margin-left:0.2rem;">${humanizeEnum(c.priority)}</span>
        </div>
        <div style="display:flex; gap:0.4rem; margin-top:0.8rem;">
          ${c.status === 'Due' || c.status === 'Overdue' ? `<button class="btn btn-primary btn-sm" data-start="${c.id}">${I18n.t('start_cleaning')}</button>` : ''}
          ${c.status === 'InProgress' ? `<button class="btn btn-primary btn-sm" data-complete="${c.id}">${I18n.t('complete_btn')}</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-report="${c.id}">${I18n.t('report_issue_btn')}</button>
        </div>
      </div>`;
  },

  async updateStatus(id, status) {
    try { await api.patch(`/cleaning/${id}`, { status }); showToast(status === 'Clean' ? I18n.t('marked_clean_toast') : I18n.t('cleaning_started_toast'), 'success'); this.load(); }
    catch (err) { showToast(err.message, 'error'); }
  },

  async reportIssue(record) {
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('report_cleaning_issue')}</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <p class="text-secondary">${I18n.t('report_cleaning_note')} ${escapeHtml(record.area)}.</p>
        <div class="form-row" style="margin-top:1rem;"><label>${I18n.t('notes_label')}</label><textarea id="ci-notes" rows="3" placeholder="${I18n.t('notes_ph')}"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
        <button class="btn btn-primary" id="ci-submit">${I18n.t('report_issue_btn')}</button>
      </div>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#ci-submit').onclick = async () => {
      try {
        await api.post('/tasks', {
          title: `Cleaning issue reported — ${record.area}`,
          description: document.getElementById('ci-notes').value,
          category: 'Maintenance', priority: 'High'
        });
        closeModal(); showToast(I18n.t('issue_reported_toast'), 'success');
      } catch (err) { showToast(err.message, 'error'); }
    };
  },

  async openCreateModal() {
    const employees = await Store.getEmployees();
    const areas = ['Entrance', 'Produce', 'Dairy', 'Bakery', 'Meat', 'Frozen', 'Checkout', 'Restrooms', 'Warehouse'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('schedule_cleaning')}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="cl-form">
        <div class="modal-body">
          <div class="form-row"><label>${I18n.t('area_label')}</label><select id="c-area">${areas.map(a => `<option>${a}</option>`).join('')}</select></div>
          <div class="form-grid">
            <div class="form-row"><label>${I18n.t('assign_to_label')}</label><select id="c-assignee"><option value="">${I18n.t('unassigned')}</option>${employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('')}</select></div>
            <div class="form-row"><label>${I18n.t('priority_label').replace(':','')}</label><select id="c-priority">${priorities.map(p => `<option value="${p}" ${p === 'Medium' ? 'selected' : ''}>${humanizeEnum(p)}</option>`).join('')}</select></div>
          </div>
          <div class="form-row"><label>${I18n.t('next_due_field')}</label><input type="datetime-local" id="c-due" required></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${I18n.t('schedule_btn')}</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#cl-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.post('/cleaning', {
          area: document.getElementById('c-area').value,
          assignedToUserId: document.getElementById('c-assignee').value || null,
          priority: document.getElementById('c-priority').value,
          nextDue: document.getElementById('c-due').value
        });
        closeModal(); showToast(I18n.t('cleaning_scheduled_toast'), 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
};
