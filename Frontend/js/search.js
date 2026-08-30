// ================= Global search =================

const GlobalSearch = {
  input: null,
  panel: null,

  init() {
    this.input = document.getElementById('global-search-input');
    this.panel = document.getElementById('search-panel');

    this.input.addEventListener('input', debounce((e) => this.run(e.target.value), 280));
    this.input.addEventListener('focus', () => { if (this.input.value.length >= 2) this.panel.classList.remove('hidden'); });
    document.addEventListener('click', (e) => {
      if (!this.panel.contains(e.target) && e.target !== this.input) this.panel.classList.add('hidden');
    });
  },

  async run(query) {
    if (!query || query.trim().length < 2) {
      this.panel.classList.add('hidden');
      return;
    }
    closeOtherPanels('search-panel');
    this.panel.classList.remove('hidden');
    this.panel.innerHTML = `<div class="state-block"><div class="icon">⏳</div><p>Searching…</p></div>`;

    try {
      const results = await api.get(`/search?q=${encodeURIComponent(query)}`);
      this.render(results);
    } catch (err) {
      this.panel.innerHTML = `<div class="state-block"><p>${escapeHtml(err.message)}</p></div>`;
    }
  },

  render(results) {
    const groups = [
      { key: 'employees', label: 'Employees', map: (e) => ({ primary: `${e.employeeId} · ${e.name}`, secondary: e.department, view: 'employees' }) },
      { key: 'tasks', label: 'Tasks', map: (t) => ({ primary: t.title, secondary: `${t.status} · ${t.priority}`, view: 'tasks' }) },
      { key: 'inventory', label: 'Inventory', map: (i) => ({ primary: i.name, secondary: `${i.sku} · ${i.status}`, view: 'inventory' }) },
      { key: 'deliveries', label: 'Deliveries', map: (d) => ({ primary: d.deliveryNumber, secondary: `${d.supplier} · ${d.status}`, view: 'deliveries' }) },
      { key: 'customerIssues', label: 'Customer Issues', map: (c) => ({ primary: c.description, secondary: `${c.department} · ${c.status}`, view: 'customer-service' }) }
    ];

    let html = '';
    let any = false;
    groups.forEach(g => {
      const items = results[g.key] || [];
      if (!items.length) return;
      any = true;
      html += `<div class="search-group-label">${g.label}</div>`;
      html += items.map(item => {
        const mapped = g.map(item);
        return `<div class="search-result-item" data-view="${mapped.view}">
          <div><div class="primary">${escapeHtml(mapped.primary)}</div><div class="secondary">${escapeHtml(mapped.secondary)}</div></div>
        </div>`;
      }).join('');
    });

    this.panel.innerHTML = any ? html : `<div class="state-block"><p>No matches found.</p></div>`;
    this.panel.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        location.hash = `#${el.dataset.view}`;
        this.panel.classList.add('hidden');
        this.input.value = '';
      });
    });
  }
};
