Views.cleaning = {
  async render(root) {
    const isManager = Auth.isManager();
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="cl_title">Cleaning</h1><p class="subtitle" data-i18n="cl_subtitle">Track cleanliness across every area of the store.</p></div>
        ${isManager ? `<button class="btn btn-primary" id="add-clean-btn">➕ ${I18n.t('schedule_cleaning')}</button>` : ''}
      </div>
      <div class="filter-bar">
        <select id="cl-filter-status"><option value="">All statuses</option><option>Clean</option><option>Due</option><option>InProgress</option><option>Overdue</option></select>
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
    if (!list.length) { grid.innerHTML = '<div class="state-block" style="grid-column:1/-1;"><div class="icon">🧽</div><h3>Nothing scheduled</h3></div>'; return; }
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
            <div class="text-muted" style="font-size:0.78rem;">${c.assignedTo ? `${c.assignedTo.employeeId} · ${escapeHtml(c.assignedTo.name)}` : 'Unassigned'}</div>
          </div>
          <span class="badge ${statusBadgeClass(c.status)}">${humanizeEnum(c.status)}</span>
        </div>
        <div class="divider"></div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">
          Last cleaned: ${c.lastCleaned ? timeAgo(c.lastCleaned) : 'never'}<br>
          Next due: ${formatDateTime(c.nextDue)}<br>
          Priority: <span class="badge ${priorityBadgeClass(c.priority)}" style="margin-left:0.2rem;">${c.priority}</span>
        </div>
        <div style="display:flex; gap:0.4rem; margin-top:0.8rem;">
          ${c.status === 'Due' || c.status === 'Overdue' ? `<button class="btn btn-primary btn-sm" data-start="${c.id}">Start Cleaning</button>` : ''}
          ${c.status === 'InProgress' ? `<button class="btn btn-primary btn-sm" data-complete="${c.id}">Complete</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-report="${c.id}">Report Issue</button>
        </div>
      </div>`;
  },

  async updateStatus(id, status) {
    try { await api.patch(`/cleaning/${id}`, { status }); showToast(status === 'Clean' ? 'Marked clean.' : 'Cleaning started.', 'success'); this.load(); }
    catch (err) { showToast(err.message, 'error'); }
  },

  async reportIssue(record) {
    const overlay = openModal(`
      <div class="modal-header"><h3>Report Cleaning Issue</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <p class="text-secondary">This will log a maintenance task for ${escapeHtml(record.area)}.</p>
        <div class="form-row" style="margin-top:1rem;"><label>Notes</label><textarea id="ci-notes" rows="3" placeholder="Describe the issue…"></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>Cancel</button>
        <button class="btn btn-primary" id="ci-submit">Report Issue</button>
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
        closeModal(); showToast('Issue reported as a maintenance task.', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    };
  },

  async openCreateModal() {
    const employees = await Store.getEmployees();
    const areas = ['Entrance', 'Produce', 'Dairy', 'Bakery', 'Meat', 'Frozen', 'Checkout', 'Restrooms', 'Warehouse'];
    const overlay = openModal(`
      <div class="modal-header"><h3>Schedule Cleaning</h3><button class="modal-close" data-close>✕</button></div>
      <form id="cl-form">
        <div class="modal-body">
          <div class="form-row"><label>Area</label><select id="c-area">${areas.map(a => `<option>${a}</option>`).join('')}</select></div>
          <div class="form-grid">
            <div class="form-row"><label>Assign to</label><select id="c-assignee"><option value="">Unassigned</option>${employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('')}</select></div>
            <div class="form-row"><label>Priority</label><select id="c-priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div>
          </div>
          <div class="form-row"><label>Next due</label><input type="datetime-local" id="c-due" required></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Schedule</button>
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
        closeModal(); showToast('Cleaning scheduled.', 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
};
