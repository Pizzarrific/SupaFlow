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
        <div class="search-input-wrap"><span class="icon">🔍</span><input type="search" id="emp-search" placeholder="Search name, ID, email…"></div>
        <select id="emp-filter-dept"><option value="">All departments</option>${['Produce','Dairy','Bakery','Meat','Frozen','Grocery','Checkout','Customer Service','Warehouse','Management','Household','Beverages'].map(d => `<option>${d}</option>`).join('')}</select>
        <select id="emp-filter-status"><option value="">All statuses</option><option>Active</option><option>OnLeave</option><option>Suspended</option><option>Inactive</option></select>
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
        <div class="kpi-card" data-filter=""><div class="kpi-figure">${stats.total}</div><div class="kpi-label">Total employees</div></div>
        <div class="kpi-card" data-filter="OnFloor"><div class="kpi-figure">${stats.onFloor}</div><div class="kpi-label">On floor</div></div>
        <div class="kpi-card" data-filter="OnBreak"><div class="kpi-figure">${stats.onBreak}</div><div class="kpi-label">On break</div></div>
        <div class="kpi-card" data-filter="OffShift"><div class="kpi-figure">${stats.offShift}</div><div class="kpi-label">Off shift</div></div>
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
      grid.innerHTML = `<div class="state-block" style="grid-column:1/-1;"><div class="icon">🪪</div><h3>No employees match</h3><p>Try a different search or filter.</p></div>`;
      return;
    }

    grid.innerHTML = this.all.map(e => Views.team.card(e)).join('');
    grid.querySelectorAll('[data-emp]').forEach(el => el.addEventListener('click', () => this.openProfile(el.dataset.emp)));
  },

  async openCreateModal() {
    const employees = await Store.getEmployees();
    const overlay = openModal(`
      <div class="modal-header"><h3>Add Employee</h3><button class="modal-close" data-close>✕</button></div>
      <form id="emp-form">
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row"><label for="e-name">Full name</label><input id="e-name" required></div>
            <div class="form-row"><label for="e-email">Email</label><input type="email" id="e-email" required></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="e-phone">Phone</label><input id="e-phone"></div>
            <div class="form-row"><label for="e-joined">Date joined</label><input type="date" id="e-joined" value="${new Date().toISOString().slice(0,10)}"></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="e-dept">Department</label>
              <select id="e-dept">${['Produce','Dairy','Bakery','Meat','Frozen','Grocery','Checkout','Customer Service','Warehouse','Management','IT / Support'].map(d => `<option>${d}</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="e-title">Job role</label><input id="e-title" placeholder="e.g. Stock Associate" required></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="e-manager">Manager</label>
              <select id="e-manager"><option value="">None</option>${employees.filter(e => e.role === 'Manager').map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="e-status">Employment status</label>
              <select id="e-status"><option>Active</option><option>OnLeave</option><option>Suspended</option><option>Inactive</option></select>
            </div>
          </div>
          <p class="text-muted" style="font-size:0.8rem;">An Employee ID (e.g. STF00##) will be generated automatically. Temporary password: <strong>Password123!</strong></p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Create Employee</button>
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
        showToast(`Employee created: ${result.employeeId}`, 'success');
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
      <div class="modal-header"><h3>Employee Profile</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1.2rem;">
          <div class="avatar avatar-lg">${Auth.initials(p.name)}</div>
          <div>
            <div class="emp-id-tag">${p.employeeId}</div>
            <h2 style="margin:0.1rem 0;">${escapeHtml(p.name)}</h2>
            <span class="badge ${statusClass}">${humanizeEnum(p.employmentStatus)}</span>
          </div>
        </div>

        <h3 style="margin-bottom:0.4rem;">Personal Information</h3>
        <p class="text-secondary" style="font-size:0.86rem; margin-bottom:1rem;">
          Email: ${escapeHtml(p.email)}<br>Phone: ${escapeHtml(p.phone || '—')}
        </p>

        <h3 style="margin-bottom:0.4rem;">Work Information</h3>
        <p class="text-secondary" style="font-size:0.86rem; margin-bottom:1rem;">
          Department: ${escapeHtml(p.department)}<br>
          Role: ${escapeHtml(p.jobTitle)} (${p.role})<br>
          Manager: ${escapeHtml(p.managerName || '—')}<br>
          Date joined: ${new Date(p.dateJoined).toLocaleDateString()}
        </p>

        <h3 style="margin-bottom:0.4rem;">Operations</h3>
        <p class="text-secondary" style="font-size:0.86rem; margin-bottom:1rem;">
          Current status: ${humanizeEnum(p.currentStatus)}<br>
          Tasks assigned: ${p.tasksAssigned} · Completed: ${p.tasksCompleted}<br>
          ${p.currentShiftStart ? `On shift since ${formatTime(p.currentShiftStart)}` : 'Currently off shift'}
        </p>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
          <button class="btn btn-secondary btn-sm" id="prof-view-id">🪪 View ID Card</button>
          ${isManager ? `
            <button class="btn btn-secondary btn-sm" id="prof-edit">✏️ Edit Info</button>
            <button class="btn btn-secondary btn-sm" id="prof-reset-pw">🔑 Reset Password</button>
            ${p.employmentStatus === 'Inactive' ? '<button class="btn btn-secondary btn-sm" id="prof-reactivate">↺ Reactivate</button>' : '<button class="btn btn-danger btn-sm" id="prof-deactivate">⛔ Deactivate</button>'}
          ` : ''}
        </div>
        <div id="prof-extra"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" data-close>Close</button></div>
    `, { wide: true });

    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);

    overlay.querySelector('#prof-view-id').onclick = () => this.openIdCard(p);

    overlay.querySelector('#prof-edit')?.addEventListener('click', () => this.openEditModal(p));

    overlay.querySelector('#prof-reset-pw')?.addEventListener('click', async () => {
      const ok = await confirmDialog(`Generate a new temporary password for ${p.name}?`, { title: 'Reset password?', confirmLabel: 'Reset', danger: false });
      if (!ok) return;
      const result = await api.post(`/employees/${id}/reset-password`);
      document.getElementById('prof-extra').innerHTML = `<div class="badge badge-info" style="padding:0.5rem 0.8rem;">New temporary password: <strong class="mono">${result.temporaryPassword}</strong></div>`;
      showToast('Password reset.', 'success');
    });

    overlay.querySelector('#prof-deactivate')?.addEventListener('click', async () => {
      const ok = await confirmDialog(`${p.name}'s account will be deactivated. Historical records are preserved.`, { title: 'Deactivate employee?', confirmLabel: 'Deactivate' });
      if (!ok) return;
      await api.post(`/employees/${id}/deactivate`);
      showToast('Employee deactivated.', 'success');
      closeModal();
      this.load(); this.loadStats();
    });

    overlay.querySelector('#prof-reactivate')?.addEventListener('click', async () => {
      await api.post(`/employees/${id}/reactivate`);
      showToast('Employee reactivated.', 'success');
      closeModal();
      this.load(); this.loadStats();
    });
  },

  async openEditModal(p) {
    const employees = await Store.getEmployees();
    const overlay = openModal(`
      <div class="modal-header"><h3>Edit Employee Info</h3><button class="modal-close" data-close>✕</button></div>
      <form id="emp-edit-form">
        <div class="modal-body">
          <div class="form-row"><label>Full name</label><input id="ee-name" value="${escapeHtml(p.name)}" required></div>
          <div class="form-grid">
            <div class="form-row"><label>Phone</label><input id="ee-phone" value="${escapeHtml(p.phone || '')}"></div>
            <div class="form-row"><label>Job title</label><input id="ee-title" value="${escapeHtml(p.jobTitle)}" required></div>
          </div>
          <div class="form-row"><label>Manager</label>
            <select id="ee-manager"><option value="">None</option>${employees.filter(e => e.role === 'Manager' && e.id !== p.id).map(m => `<option value="${m.id}" ${p.managerName === m.name ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}</select>
          </div>
          <p class="text-muted" style="font-size:0.78rem;">Employee ID, role, department, and employment status can't be edited by the employee themselves and are managed separately.</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
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
        showToast('Employee info updated.', 'success');
        this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  openIdCard(p) {
    const overlay = openModal(`
      <div class="modal-header"><h3>Employee ID Card</h3><button class="modal-close" data-close>✕</button></div>
      <div class="modal-body">
        <div class="id-card-wrap">
          <div class="id-card" id="printable-id-card">
            <div class="brand">STOREFLOW</div>
            <div class="sub-brand">EMPLOYEE IDENTIFICATION</div>
            <div class="photo">${Auth.initials(p.name)}</div>
            <div class="id-name">${escapeHtml(p.name)}</div>
            <div class="id-role">${escapeHtml(p.jobTitle || p.department)}</div>
            <div class="id-number">${p.employeeId}</div>
            <div class="id-status">${p.employmentStatus === 'Active' ? 'ACTIVE EMPLOYEE' : humanizeEnum(p.employmentStatus).toUpperCase()}</div>
            <div class="store-footer">STOREFLOW SUPERMARKET</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-close>Close</button>
        <button class="btn btn-primary" id="print-id-btn">🖨 Print ID Card</button>
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
