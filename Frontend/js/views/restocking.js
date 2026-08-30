Views.restocking = {
  async render(root) {
    root.innerHTML = `
      <div class="page-header"><div><h1 data-i18n="rs_title">Restocking Queue</h1><p class="subtitle" data-i18n="rs_subtitle">Work through low stock products, shelf by shelf.</p></div></div>
      <div class="filter-bar">
        <select id="rs-filter-status"><option value="">All</option><option>Queued</option><option>InProgress</option><option>Completed</option></select>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.8rem;" id="rs-list">${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;
    document.getElementById('rs-filter-status').addEventListener('change', () => this.load());
    await this.load();
  },

  async load() {
    const status = document.getElementById('rs-filter-status')?.value;
    const params = status ? `?status=${status}` : '';
    const list = await api.get(`/restocking${params}`);
    const el = document.getElementById('rs-list');
    if (!list.length) { el.innerHTML = '<div class="state-block"><div class="icon">✅</div><h3>Queue is clear</h3></div>'; return; }
    el.innerHTML = list.map(r => this.row(r)).join('');

    el.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => this.start(b.dataset.start)));
    el.querySelectorAll('[data-complete]').forEach(b => b.addEventListener('click', () => this.openCompleteModal(b.dataset.complete, list.find(r => r.id == b.dataset.complete))));
  },

  row(r) {
    return `
      <div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
        <div>
          <div style="font-weight:700;">${escapeHtml(r.productName)}</div>
          <div class="text-muted" style="font-size:0.8rem;">${escapeHtml(r.location)} · Current: ${r.currentStock} / Min: ${r.minimumStock}</div>
          <div class="chip-row" style="margin-top:0.4rem;">
            <span class="badge ${priorityBadgeClass(r.priority)}">${r.priority}</span>
            <span class="badge ${statusBadgeClass(r.status)}">${humanizeEnum(r.status)}</span>
            ${r.assignedTo ? `<span class="badge badge-neutral">${r.assignedTo.employeeId} · ${escapeHtml(r.assignedTo.name)}</span>` : ''}
          </div>
        </div>
        <div>
          ${r.status === 'Queued' ? `<button class="btn btn-primary btn-sm" data-start="${r.id}">Start Restock</button>` : ''}
          ${r.status === 'InProgress' ? `<button class="btn btn-primary btn-sm" data-complete="${r.id}">Mark Restocked</button>` : ''}
          ${r.status === 'Completed' ? `<span class="text-muted" style="font-size:0.78rem;">+${r.quantityAdded} units added</span>` : ''}
        </div>
      </div>`;
  },

  async start(id) {
    try { await api.patch(`/restocking/${id}/start`); showToast('Restocking started.', 'success'); this.load(); }
    catch (err) { showToast(err.message, 'error'); }
  },

  openCompleteModal(id, record) {
    const overlay = openModal(`
      <div class="modal-header"><h3>Mark Restocked</h3><button class="modal-close" data-close>✕</button></div>
      <form id="rc-form">
        <div class="modal-body">
          <p class="text-secondary" style="margin-bottom:1rem;">${escapeHtml(record.productName)} — how many units were added to the shelf?</p>
          <div class="form-row"><label>Quantity added</label><input type="number" id="rc-qty" min="1" value="${Math.max(10, record.minimumStock - record.currentStock)}" required></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Confirm Restocked</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#rc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.patch(`/restocking/${id}/complete`, { quantityAdded: parseInt(document.getElementById('rc-qty').value, 10) });
        closeModal(); showToast('Restocking complete. Inventory updated.', 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
};
