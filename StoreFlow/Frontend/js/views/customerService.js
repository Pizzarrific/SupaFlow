Views.customerService = {
  async render(root) {
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="cs_title">Customer Service</h1><p class="subtitle" data-i18n="cs_subtitle">Log and resolve customer issues quickly.</p></div>
        <button class="btn btn-primary" id="add-issue-btn">➕ <span data-i18n="report_issue">Report Issue</span></button>
      </div>
      <div class="filter-bar">
        <select id="ci-filter-status"><option value="">All statuses</option><option>Open</option><option>InProgress</option><option>Waiting</option><option>Resolved</option></select>
        <select id="ci-filter-priority"><option value="">All priorities</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.8rem;" id="ci-list">${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;
    document.getElementById('add-issue-btn').onclick = () => this.openCreateModal();
    document.getElementById('ci-filter-status').addEventListener('change', () => this.load());
    document.getElementById('ci-filter-priority').addEventListener('change', () => this.load());
    await this.load();
  },

  async load() {
    const params = new URLSearchParams();
    const status = document.getElementById('ci-filter-status')?.value;
    const priority = document.getElementById('ci-filter-priority')?.value;
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);

    const list = await api.get(`/customer-issues?${params.toString()}`);
    const el = document.getElementById('ci-list');
    if (!list.length) { el.innerHTML = '<div class="state-block"><div class="icon">🎧</div><h3>No issues logged</h3></div>'; return; }
    el.innerHTML = list.map(c => this.card(c)).join('');

    el.querySelectorAll('[data-manage]').forEach(b => b.addEventListener('click', () => this.openManageModal(list.find(c => c.id == b.dataset.manage))));
  },

  card(c) {
    const urgent = c.priority === 'Urgent' && c.status !== 'Resolved';
    return `
      <div class="card" style="${urgent ? 'border-color: var(--status-urgent); box-shadow: 0 0 0 1px var(--status-urgent-bg);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.6rem; flex-wrap:wrap;">
          <div>
            <div class="chip-row" style="margin-bottom:0.4rem;">
              <span class="badge badge-neutral">${humanizeEnum(c.type)}</span>
              <span class="badge ${priorityBadgeClass(c.priority)}">${urgent ? '⚠ ' : ''}${c.priority}</span>
              <span class="badge ${statusBadgeClass(c.status)}">${humanizeEnum(c.status)}</span>
            </div>
            <p style="font-size:0.88rem;">${escapeHtml(c.description)}</p>
            <div class="text-muted" style="font-size:0.76rem; margin-top:0.3rem;">
              ${escapeHtml(c.department)} · Reported by ${escapeHtml(c.createdByName)} · ${timeAgo(c.createdAt)}
              ${c.assignedTo ? ` · Assigned: ${c.assignedTo.employeeId} ${escapeHtml(c.assignedTo.name)}` : ''}
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" data-manage="${c.id}">Manage</button>
        </div>
      </div>`;
  },

  openCreateModal() {
    const overlay = openModal(`
      <div class="modal-header"><h3>Report Customer Issue</h3><button class="modal-close" data-close>✕</button></div>
      <form id="ci-form">
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row"><label>Issue type</label><select id="ci-type">${['ProductQuestion','Complaint','Refund','MissingProduct','PriceMismatch','AssistanceRequested','Other'].map(t => `<option value="${t}">${humanizeEnum(t)}</option>`).join('')}</select></div>
            <div class="form-row"><label>Department</label><input id="ci-dept" required placeholder="e.g. Electronics"></div>
          </div>
          <div class="form-row"><label>Description</label><textarea id="ci-desc" rows="3" required></textarea></div>
          <div class="form-row"><label>Priority</label><select id="ci-priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Report Issue</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#ci-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.post('/customer-issues', {
          type: document.getElementById('ci-type').value,
          department: document.getElementById('ci-dept').value,
          description: document.getElementById('ci-desc').value,
          priority: document.getElementById('ci-priority').value
        });
        closeModal(); showToast('Issue logged.', 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  async openManageModal(c) {
    const employees = await Store.getEmployees();
    const overlay = openModal(`
      <div class="modal-header"><h3>Manage Issue</h3><button class="modal-close" data-close>✕</button></div>
      <form id="cm-form">
        <div class="modal-body">
          <p class="text-secondary" style="margin-bottom:1rem;">${escapeHtml(c.description)}</p>
          <div class="form-grid">
            <div class="form-row"><label>Status</label><select id="cm-status">${['Open','InProgress','Waiting','Resolved'].map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${humanizeEnum(s)}</option>`).join('')}</select></div>
            <div class="form-row"><label>Priority</label><select id="cm-priority">${['Low','Medium','High','Urgent'].map(p => `<option ${c.priority === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
          </div>
          ${Auth.isManager() ? `<div class="form-row"><label>Assign to</label><select id="cm-assignee"><option value="">Unassigned</option>${employees.map(e => `<option value="${e.id}" ${c.assignedTo?.id === e.id ? 'selected' : ''}>${escapeHtml(e.name)} (${e.employeeId})</option>`).join('')}</select></div>` : ''}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#cm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.put(`/customer-issues/${c.id}`, {
          status: document.getElementById('cm-status').value,
          priority: document.getElementById('cm-priority').value,
          assignedToUserId: document.getElementById('cm-assignee')?.value || null
        });
        closeModal(); showToast('Issue updated.', 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
};
