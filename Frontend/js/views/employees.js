Views.employees = {
  all: [],

  async render(root) {
    const isManager = Auth.isManager();
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="emp_title">Employee Directory</h1><p class="subtitle" data-i18n="emp_subtitle">Every StoreFlow employee ID, department, and status.</p></div>
        ${isManager ? `<button class="btn btn-primary" id="add-emp-btn">➕ ${I18n.t('add_employee')}</button>` : ''}
      </div>
      ${isManager ? `<div class="kpi-grid" id="emp-stats">${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>` : ''}
      <div class="filter-bar">
        <div class="search-input-wrap"><span class="icon">🔍</span><input type="search" id="emp-search" placeholder="${I18n.t('search_employees')}"></div>
        <select id="emp-filter-dept"><option value="">${I18n.t('filter_all_departments')}</option>${['Produce','Dairy','Bakery','Meat','Frozen','Grocery','Checkout','Customer Service','Warehouse','Management','Household','Beverages'].map(d => `<option>${d}</option>`).join('')}</select>
        <select id="emp-filter-status"><option value="">${I18n.t('filter_all_statuses')}</option><option value="Active">${humanizeEnum('Active')}</option><option value="OnLeave">${humanizeEnum('OnLeave')}</option><option value="Suspended">${humanizeEnum('Suspended')}</option><option value="Inactive">${humanizeEnum('Inactive')}</option></select>
      </div>
      <div class="card-grid" id="emp-grid">${Array(8).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;

    if (isManager) {
      document.getElementById('add-emp-btn').onclick = () => this.openCreateModal();
      this.loadStats();
    }

    document.getElementById('emp-search').addEventListener('input', debounce(() => this.load(), 300));
    document.getElementById('emp-filter-dept').addEventListener('change', () => this.load());
    document.getElementById('emp-filter-status').addEventListener('change', () => this.load());

    await this.load();
  },

  async loadStats() {
    try {
      const stats = await api.get('/employees/stats');
      document.getElementById('emp-stats').innerHTML = `
        <div class="kpi-card" data-filter=""><div class="kpi-figure">${stats.total}</div><div class="kpi-label">${I18n.t('kpi_total_employees')}</div></div>
        <div class="kpi-card" data-filter="OnFloor"><div class="kpi-figure">${stats.onFloor}</div><div class="kpi-label">${I18n.t('kpi_on_floor')}</div></div>
        <div class="kpi-card" data-filter="OnBreak"><div class="kpi-figure">${stats.onBreak}</div><div class="kpi-label">${I18n.t('kpi_on_break')}</div></div>
        <div class="kpi-card" data-filter="OffShift"><div class="kpi-figure">${stats.offShift}</div><div class="kpi-label">${I18n.t('kpi_off_shift')}</div></div>
      `;
    } catch { /* stats are non-critical */ }
  },

  async load() {
    const params = new URLSearchParams();
    const search = document.getElementById('emp-search')?.value;
    const dept = document.getElementById('emp-filter-dept')?.value;
    const status = document.getElementById('emp-filter-status')?.value;
    if (search) params.set('search', search);
    if (dept) params.set('department', dept);
    if (status) params.set('status', status);

    this.all = await api.get(`/employees?${params.toString()}`);
    Store.invalidateEmployees();
    const grid = document.getElementById('emp-grid');

    if (!this.all.length) {
      grid.innerHTML = `<div class="state-block" style="grid-column:1/-1;"><div class="icon">🪪</div><h3>${I18n.t('no_employees_match')}</h3><p>${I18n.t('try_different_search')}</p></div>`;
      return;
    }

    grid.innerHTML = this.all.map(e => Views.team.card(e)).join('');
    grid.querySelectorAll('[data-emp]').forEach(el => el.addEventListener('click', () => this.openProfile(el.dataset.emp)));
  },

  async openCreateModal() {
    const employees = await Store.getEmployees();
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('add_employee')}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="emp-form">
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row"><label for="e-name">${I18n.t('full_name')}</label><input id="e-name" required></div>
            <div class="form-row"><label for="e-email">${I18n.t('email_label')}</label><input type="email" id="e-email" required></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="e-phone">${I18n.t('phone_label')}</label><input id="e-phone"></div>
            <div class="form-row"><label for="e-joined">${I18n.t('date_joined')}</label><input type="date" id="e-joined" value="${new Date().toISOString().slice(0,10)}"></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="e-dept">${I18n.t('department_label')}</label>
              <select id="e-dept">${['Produce','Dairy','Bakery','Meat','Frozen','Grocery','Checkout','Customer Service','Warehouse','Management','IT / Support'].map(d => `<option>${d}</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="e-title">${I18n.t('job_role')}</label><input id="e-title" placeholder="${I18n.t('job_role_ph')}" required></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="e-manager">${I18n.t('manager_label')}</label>
              <select id="e-manager"><option value="">${I18n.t('none')}</option>${employees.filter(e => e.role === 'Manager').map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="e-status">${I18n.t('employment_status')}</label>
              <select id="e-status"><option value="Active">${humanizeEnum('Active')}</option><option value="OnLeave">${humanizeEnum('OnLeave')}</option><option value="Suspended">${humanizeEnum('Suspended')}</option><option value="Inactive">${humanizeEnum('Inactive')}</option></select>
            </div>
          </div>
          <p class="text-muted" style="font-size:0.8rem;">${I18n.t('id_note')} <strong>Password123!</strong></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${I18n.t('add_employee')}</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#emp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        const result = await api.post('/employees', {
          name: document.getElementById('e-name').value,
          email: document.getElementById('e-email').value,
          phone: document.getElementById('e-phone').value,
          department: document.getElementById('e-dept').value,
          jobTitle: document.getElementById('e-title').value,
          dateJoined: document.getElementById('e-joined').value,
          managerId: document.getElementById('e-manager').value || null,
          employmentStatus: document.getElementById('e-status').value,
          role: 'Employee'
        });
        closeModal();
        showToast(`${I18n.t('employee_created')} ${result.employeeId}`, 'success');
        this.load();
        this.loadStats();
      } catch (err) {
        btn.disabled = false;
        showToast(err.message, 'error');
      }
    });
  },

  async openProfile(id) {
    const p = await api.get(`/employees/${id}`);
    const isManager = Auth.isManager();
    const statusClass = { Active: 'badge-ok', OnLeave: 'badge-warn', Suspended: 'badge-critical', Inactive: 'badge-neutral' }[p.employmentStatus];

    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('emp_title')}</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1.2rem;">
          <div class="avatar avatar-lg">${Auth.initials(p.name)}</div>
          <div>
            <div class="emp-id-tag">${p.employeeId}</div>
            <h2 style="margin:0.1rem 0;">${escapeHtml(p.name)}</h2>
            <span class="badge ${statusClass}">${humanizeEnum(p.employmentStatus)}</span>
          </div>
        </div>

        <h3 style="margin-bottom:0.4rem;">${I18n.t('personal_info')}</h3>
        <p class="text-secondary" style="font-size:0.86rem; margin-bottom:1rem;">
          ${I18n.t('email_label')}: ${escapeHtml(p.email)}<br>${I18n.t('phone_label')}: ${escapeHtml(p.phone || '—')}
        </p>

        <h3 style="margin-bottom:0.4rem;">${I18n.t('work_info')}</h3>
        <p class="text-secondary" style="font-size:0.86rem; margin-bottom:1rem;">
          ${I18n.t('department_label')}: ${escapeHtml(p.department)}<br>
          ${I18n.t('job_role')}: ${escapeHtml(p.jobTitle)} (${p.role})<br>
          ${I18n.t('manager_colon')} ${escapeHtml(p.managerName || '—')}<br>
          ${I18n.t('date_joined_colon')} ${new Date(p.dateJoined).toLocaleDateString()}
        </p>

        <h3 style="margin-bottom:0.4rem;">${I18n.t('operations_heading')}</h3>
        <p class="text-secondary" style="font-size:0.86rem; margin-bottom:1rem;">
          ${I18n.t('current_status_colon')} ${humanizeEnum(p.currentStatus)}<br>
          ${I18n.t('tasks_assigned_colon')} ${p.tasksAssigned} · ${I18n.t('completed_colon')} ${p.tasksCompleted}<br>
          ${p.currentShiftStart ? `${I18n.t('on_shift_since')} ${formatTime(p.currentShiftStart)}` : I18n.t('currently_off_shift')}
        </p>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
          <button class="btn btn-secondary btn-sm" id="prof-view-id">🪪 ${I18n.t('view_id_card')}</button>
          ${isManager ? `
            <button class="btn btn-secondary btn-sm" id="prof-edit">✏️ ${I18n.t('edit_info')}</button>
            <button class="btn btn-secondary btn-sm" id="prof-reset-pw">🔑 ${I18n.t('reset_password')}</button>
            ${p.employmentStatus === 'Inactive' ? `<button class="btn btn-secondary btn-sm" id="prof-reactivate">↺ ${I18n.t('reactivate')}</button>` : `<button class="btn btn-danger btn-sm" id="prof-deactivate">⛔ ${I18n.t('deactivate')}</button>`}
          ` : ''}
        </div>
        <div id="prof-extra"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" data-close>${I18n.t('close')}</button></div>
    `, { wide: true });

    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);

    overlay.querySelector('#prof-view-id').onclick = () => this.openIdCard(p);

    overlay.querySelector('#prof-edit')?.addEventListener('click', () => this.openEditModal(p));

    overlay.querySelector('#prof-reset-pw')?.addEventListener('click', async () => {
      const ok = await confirmDialog(`${I18n.t('reset_password_confirm')} ${p.name}?`, { title: I18n.t('reset_password') + '?', confirmLabel: I18n.t('reset_password'), danger: false });
      if (!ok) return;
      const result = await api.post(`/employees/${id}/reset-password`);
      document.getElementById('prof-extra').innerHTML = `<div class="badge badge-info" style="padding:0.5rem 0.8rem;">${I18n.t('new_temp_password')} <strong class="mono">${result.temporaryPassword}</strong></div>`;
      showToast(I18n.t('password_reset_toast'), 'success');
    });

    overlay.querySelector('#prof-deactivate')?.addEventListener('click', async () => {
      const ok = await confirmDialog(`${p.name}${I18n.t('deactivate_confirm_body')}`, { title: I18n.t('deactivate_confirm_title'), confirmLabel: I18n.t('deactivate') });
      if (!ok) return;
      await api.post(`/employees/${id}/deactivate`);
      showToast(I18n.t('employee_deactivated'), 'success');
      closeModal();
      this.load(); this.loadStats();
    });

    overlay.querySelector('#prof-reactivate')?.addEventListener('click', async () => {
      await api.post(`/employees/${id}/reactivate`);
      showToast(I18n.t('employee_reactivated'), 'success');
      closeModal();
      this.load(); this.loadStats();
    });
  },

  async openEditModal(p) {
    const employees = await Store.getEmployees();
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('edit_info')}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="emp-edit-form">
        <div class="modal-body">
          <div class="form-row"><label>${I18n.t('full_name')}</label><input id="ee-name" value="${escapeHtml(p.name)}" required></div>
          <div class="form-grid">
            <div class="form-row"><label>${I18n.t('phone_label')}</label><input id="ee-phone" value="${escapeHtml(p.phone || '')}"></div>
            <div class="form-row"><label>${I18n.t('job_role')}</label><input id="ee-title" value="${escapeHtml(p.jobTitle)}" required></div>
          </div>
          <div class="form-row"><label>${I18n.t('manager_label')}</label>
            <select id="ee-manager"><option value="">${I18n.t('none')}</option>${employees.filter(e => e.role === 'Manager' && e.id !== p.id).map(m => `<option value="${m.id}" ${p.managerName === m.name ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}</select>
          </div>
          <p class="text-muted" style="font-size:0.78rem;">${I18n.t('manager_edit_note')}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${I18n.t('save_changes')}</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#emp-edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.put(`/employees/${p.id}`, {
          name: document.getElementById('ee-name').value,
          phone: document.getElementById('ee-phone').value,
          jobTitle: document.getElementById('ee-title').value,
          managerId: document.getElementById('ee-manager').value || null
        });
        closeModal();
        showToast(I18n.t('employee_updated'), 'success');
        this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  openIdCard(p) {
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('employee_id_card')}</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <div class="id-card-wrap">
          <div class="id-card" id="printable-id-card">
            <div class="brand">STOREFLOW</div>
            <div class="sub-brand">EMPLOYEE IDENTIFICATION</div>
            <div class="photo">${Auth.initials(p.name)}</div>
            <div class="id-name">${escapeHtml(p.name)}</div>
            <div class="id-role">${escapeHtml(p.jobTitle || p.department)}</div>
            <div class="id-number">${p.employeeId}</div>
            <div class="id-status">${p.employmentStatus === 'Active' ? I18n.t('active_employee') : humanizeEnum(p.employmentStatus)}</div>
            <div class="store-footer">STOREFLOW SUPERMARKET</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>${I18n.t('close')}</button>
        <button class="btn btn-primary" id="print-id-btn">🖨 ${I18n.t('print_id_card')}</button>
      </div>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#print-id-btn').onclick = () => {
      const w = window.open('', '_blank', 'width=420,height=640');
      w.document.write(`<html><head><title>${p.employeeId} — StoreFlow ID</title>
        <link rel="stylesheet" href="css/variables.css"><link rel="stylesheet" href="css/layout.css">
        <style>body{display:flex;align-items:center;justify-content:center;padding:2rem;background:#fff;}</style>
        </head><body>${document.getElementById('printable-id-card').outerHTML}</body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 300);
    };
  }
};
