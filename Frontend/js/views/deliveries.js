Views.deliveries = {
  async render(root) {
    const isManager = Auth.isManager();
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="dl_title">Deliveries</h1><p class="subtitle" data-i18n="dl_subtitle">Track incoming shipments and dock activity.</p></div>
        ${isManager ? `<button class="btn btn-primary" id="add-delivery-btn">➕ ${I18n.t('new_delivery')}</button>` : ''}
      </div>
      <div class="filter-bar">
        <select id="dl-filter-status"><option value="">All statuses</option><option>Scheduled</option><option>InTransit</option><option>Arriving</option><option>Arrived</option><option>Checking</option><option>Completed</option><option>Delayed</option></select>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.9rem;" id="dl-list">${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;
    if (isManager) document.getElementById('add-delivery-btn').onclick = () => this.openCreateModal();
    document.getElementById('dl-filter-status').addEventListener('change', () => this.load());
    await this.load();
  },

  async load() {
    const status = document.getElementById('dl-filter-status')?.value;
    const list = await api.get(`/deliveries${status ? '?status=' + status : ''}`);
    const el = document.getElementById('dl-list');
    if (!list.length) { el.innerHTML = '<div class="state-block"><div class="icon">🚚</div><h3>No deliveries found</h3></div>'; return; }
    el.innerHTML = list.map(d => this.card(d)).join('');
    if (Auth.isManager()) {
      el.querySelectorAll('[data-manage]').forEach(b => b.addEventListener('click', () => this.openManageModal(list.find(d => d.id == b.dataset.manage))));
    }
  },

  card(d) {
    const isDelayed = d.status === 'Delayed';
    return `
      <div class="card" style="${isDelayed ? 'border-color: var(--status-urgent);' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.6rem;">
          <div>
            <div style="font-weight:800; font-size:1rem;">${d.deliveryNumber}</div>
            <div class="text-muted" style="font-size:0.82rem;">${escapeHtml(d.supplier)} · Dock ${escapeHtml(d.dock)}</div>
          </div>
          <span class="badge ${statusBadgeClass(d.status)}">${isDelayed ? '⚠ ' : ''}${humanizeEnum(d.status)}</span>
        </div>
        <div style="font-size:0.82rem; color:var(--text-secondary); margin:0.6rem 0;">
          Expected: ${formatDateTime(d.expectedArrival)}${d.actualArrival ? ` · Arrived: ${formatDateTime(d.actualArrival)}` : ''}
        </div>
        ${d.notes ? `<p class="text-muted" style="font-size:0.8rem; margin-bottom:0.6rem;">📝 ${escapeHtml(d.notes)}</p>` : ''}
        <div class="divider"></div>
        <div style="display:flex; flex-direction:column; gap:0.4rem;">
          ${d.events.map(ev => `<div style="font-size:0.78rem; display:flex; gap:0.6rem;"><span class="mono text-muted">${formatTime(ev.occurredAt)}</span><span>${escapeHtml(ev.label)}</span></div>`).join('')}
        </div>
        ${Auth.isManager() ? `<button class="btn btn-secondary btn-sm" style="margin-top:0.8rem;" data-manage="${d.id}">Update Delivery</button>` : ''}
      </div>`;
  },

  openCreateModal() {
    const overlay = openModal(`
      <div class="modal-header"><h3>New Delivery</h3><button class="modal-close" data-close>✕</button></div>
      <form id="dl-form">
        <div class="modal-body">
          <div class="form-row"><label>Supplier</label><input id="d-supplier" required></div>
          <div class="form-grid">
            <div class="form-row"><label>Expected arrival</label><input type="datetime-local" id="d-expected" required></div>
            <div class="form-row"><label>Dock</label><input id="d-dock" placeholder="e.g. 2" required></div>
          </div>
          <div class="form-row"><label>Notes</label><textarea id="d-notes" rows="2"></textarea></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Create Delivery</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#dl-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.post('/deliveries', {
          supplier: document.getElementById('d-supplier').value,
          expectedArrival: document.getElementById('d-expected').value,
          dock: document.getElementById('d-dock').value,
          notes: document.getElementById('d-notes').value
        });
        closeModal(); showToast('Delivery created.', 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  openManageModal(d) {
    const statuses = ['Scheduled', 'InTransit', 'Arriving', 'Arrived', 'Checking', 'Completed', 'Delayed'];
    const overlay = openModal(`
      <div class="modal-header"><h3>Update ${d.deliveryNumber}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="dm-form">
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row"><label>Status</label><select id="dm-status">${statuses.map(s => `<option value="${s}" ${d.status === s ? 'selected' : ''}>${humanizeEnum(s)}</option>`).join('')}</select></div>
            <div class="form-row"><label>Dock</label><input id="dm-dock" value="${escapeHtml(d.dock)}"></div>
          </div>
          <div class="form-row"><label>Expected arrival</label><input type="datetime-local" id="dm-expected" value="${new Date(d.expectedArrival).toISOString().slice(0,16)}"></div>
          <div class="form-row"><label>Notes</label><textarea id="dm-notes" rows="2">${escapeHtml(d.notes || '')}</textarea></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#dm-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.put(`/deliveries/${d.id}`, {
          status: document.getElementById('dm-status').value,
          dock: document.getElementById('dm-dock').value,
          expectedArrival: document.getElementById('dm-expected').value,
          notes: document.getElementById('dm-notes').value
        });
        closeModal(); showToast('Delivery updated.', 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
};
