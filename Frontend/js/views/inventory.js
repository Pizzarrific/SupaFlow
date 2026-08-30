Views.inventory = {
  async render(root) {
    const isManager = Auth.isManager();
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="inv_title">Inventory</h1><p class="subtitle" data-i18n="inv_subtitle">Live stock levels across the store.</p></div>
        ${isManager ? `<button class="btn btn-primary" id="add-product-btn">➕ ${I18n.t('add_product')}</button>` : ''}
      </div>
      <div class="filter-bar">
        <div class="search-input-wrap"><span class="icon">🔍</span><input type="search" id="inv-search" placeholder="${I18n.t('search_by_name_sku')}"></div>
        <select id="inv-filter-category"><option value="">${I18n.t('filter_all_categories')}</option></select>
        <select id="inv-filter-status"><option value="">${I18n.t('filter_all_statuses')}</option><option value="InStock">${humanizeEnum('InStock')}</option><option value="LowStock">${humanizeEnum('LowStock')}</option><option value="Critical">${humanizeEnum('Critical')}</option><option value="OutOfStock">${humanizeEnum('OutOfStock')}</option></select>
      </div>
      <div class="card-grid" id="inv-grid">${Array(8).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;

    if (isManager) document.getElementById('add-product-btn').onclick = () => this.openCreateModal();
    document.getElementById('inv-search').addEventListener('input', debounce(() => this.load(), 300));
    document.getElementById('inv-filter-category').addEventListener('change', () => this.load());
    document.getElementById('inv-filter-status').addEventListener('change', () => this.load());

    await this.load();
  },

  async load() {
    const params = new URLSearchParams();
    const search = document.getElementById('inv-search')?.value;
    const category = document.getElementById('inv-filter-category')?.value;
    const status = document.getElementById('inv-filter-status')?.value;
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (status) params.set('status', status);

    const items = await api.get(`/inventory?${params.toString()}`);
    this.populateCategoryFilter(items);
    const grid = document.getElementById('inv-grid');
    if (!items.length) {
      grid.innerHTML = `<div class="state-block" style="grid-column:1/-1;"><div class="icon">📦</div><h3>${I18n.t('no_products_found')}</h3></div>`;
      return;
    }
    grid.innerHTML = items.map(i => this.card(i)).join('');
    grid.querySelectorAll('[data-adjust]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.adjustQuantity(btn.dataset.id, parseInt(btn.dataset.adjust, 10)); });
    });
    if (Auth.isManager()) {
      grid.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); this.openEditModal(items.find(i => i.id == btn.dataset.edit)); }));
    }
  },

  populateCategoryFilter(items) {
    const select = document.getElementById('inv-filter-category');
    if (select.dataset.populated) return;
    const cats = [...new Set(items.map(i => i.category))].sort();
    select.innerHTML = `<option value="">${I18n.t('filter_all_categories')}</option>` + cats.map(c => `<option>${c}</option>`).join('');
    select.dataset.populated = '1';
  },

  card(i) {
    const pct = Math.min(100, Math.round((i.quantity / (i.minimumQuantity * 2 || 1)) * 100));
    const fillClass = i.status === 'InStock' ? 'ok' : i.status === 'LowStock' ? 'warn' : 'critical';
    return `
      <div class="inv-card">
        <div class="inv-card-top">
          <div><div class="inv-name">${escapeHtml(i.name)}</div><div class="inv-loc">${escapeHtml(i.location)}</div></div>
          <span class="badge ${statusBadgeClass(i.status)}">${humanizeEnum(i.status)}</span>
        </div>
        <div class="progress-track"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
        <div class="inv-qty-row">
          <span><strong>${i.quantity}</strong> ${I18n.t('units_label')}</span>
          <span>${I18n.t('min_label')} ${i.minimumQuantity}</span>
        </div>
        <div class="inv-qty-row"><span class="text-muted mono" style="font-size:0.72rem;">${i.sku}</span></div>
        <div style="display:flex; gap:0.4rem; margin-top:0.8rem;">
          <button class="btn btn-secondary btn-sm" data-adjust="-1" data-id="${i.id}">−1</button>
          <button class="btn btn-secondary btn-sm" data-adjust="1" data-id="${i.id}">+1</button>
          <button class="btn btn-secondary btn-sm" data-adjust="10" data-id="${i.id}">+10</button>
          ${Auth.isManager() ? `<button class="btn btn-ghost btn-sm" data-edit="${i.id}" style="margin-left:auto;">${I18n.t('edit')}</button>` : ''}
        </div>
      </div>`;
  },

  async adjustQuantity(id, delta) {
    try {
      await api.patch(`/inventory/${id}/quantity`, { delta });
      showToast(delta > 0 ? I18n.t('stock_increased') : I18n.t('stock_decreased'), 'success');
      this.load();
    } catch (err) { showToast(err.message, 'error'); }
  },

  openCreateModal() {
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('add_product')}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="inv-form">
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row"><label>${I18n.t('sku_label')}</label><input id="i-sku" required></div>
            <div class="form-row"><label>${I18n.t('product_name')}</label><input id="i-name" required></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label>${I18n.t('category_label')}</label><input id="i-category" required placeholder="e.g. Dairy"></div>
            <div class="form-row"><label>${I18n.t('shelf_location')}</label><input id="i-location" required placeholder="${I18n.t('shelf_location_ph')}"></div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label>${I18n.t('starting_qty')}</label><input type="number" id="i-qty" min="0" value="0" required></div>
            <div class="form-row"><label>${I18n.t('minimum_qty')}</label><input type="number" id="i-min" min="0" value="10" required></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${I18n.t('add_product')}</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#inv-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.post('/inventory', {
          sku: document.getElementById('i-sku').value,
          name: document.getElementById('i-name').value,
          category: document.getElementById('i-category').value,
          location: document.getElementById('i-location').value,
          quantity: parseInt(document.getElementById('i-qty').value, 10),
          minimumQuantity: parseInt(document.getElementById('i-min').value, 10)
        });
        closeModal(); showToast(I18n.t('product_added'), 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  },

  openEditModal(item) {
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('edit')} — ${escapeHtml(item.name)}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="inv-edit-form">
        <div class="modal-body">
          <div class="form-row"><label>${I18n.t('product_name')}</label><input id="ie-name" value="${escapeHtml(item.name)}" required></div>
          <div class="form-grid">
            <div class="form-row"><label>${I18n.t('category_label')}</label><input id="ie-category" value="${escapeHtml(item.category)}" required></div>
            <div class="form-row"><label>${I18n.t('shelf_location')}</label><input id="ie-location" value="${escapeHtml(item.location)}" required></div>
          </div>
          <div class="form-row"><label>${I18n.t('minimum_qty')}</label><input type="number" id="ie-min" value="${item.minimumQuantity}" min="0" required></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${I18n.t('save')}</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#inv-edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.put(`/inventory/${item.id}`, {
          name: document.getElementById('ie-name').value,
          category: document.getElementById('ie-category').value,
          location: document.getElementById('ie-location').value,
          minimumQuantity: parseInt(document.getElementById('ie-min').value, 10)
        });
        closeModal(); showToast(I18n.t('product_updated'), 'success'); this.load();
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
};
