// ================= Hash router =================

const routeMap = {
  dashboard: () => Views.dashboard,
  tasks: () => Views.tasks,
  team: () => Views.team,
  employees: () => Views.employees,
  attendance: () => Views.attendance,
  inventory: () => Views.inventory,
  restocking: () => Views.restocking,
  cleaning: () => Views.cleaning,
  deliveries: () => Views.deliveries,
  'customer-service': () => Views.customerService,
  reports: () => Views.reports
};

let currentView = null;

async function navigateTo(viewName, params = {}) {
  const view = routeMap[viewName] ? routeMap[viewName]() : null;
  const root = document.getElementById('view-root');

  if (viewName === 'reports' && !Auth.isManager()) {
    root.innerHTML = `<div class="state-block"><div class="icon">🔒</div><h3>Manager access only</h3><p>Reports are visible to store managers.</p></div>`;
    setActiveNav('reports');
    return;
  }

  if (!view) {
    root.innerHTML = `<div class="state-block"><div class="icon">🤔</div><h3>Page not found</h3></div>`;
    return;
  }

  currentView = viewName;
  setActiveNav(viewName);
  root.innerHTML = `<div class="state-block"><div class="icon">⏳</div><p>Loading…</p></div>`;

  try {
    await view.render(root, params);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="state-block"><div class="icon">⚠️</div><h3>Something went wrong</h3><p>${escapeHtml(err.message || 'Please try again.')}</p></div>`;
  }
}

function setActiveNav(viewName) {
  document.querySelectorAll('.nav-item, .bn-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === viewName);
  });
}

function parseHash() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const [viewName, query] = hash.split('?');
  const params = {};
  if (query) {
    new URLSearchParams(query).forEach((v, k) => { params[k] = v; });
  }
  return { viewName, params };
}

window.addEventListener('hashchange', () => {
  const { viewName, params } = parseHash();
  navigateTo(viewName, params);
});

function openRecord(entityType, entityId) {
  const map = {
    Task: 'tasks', InventoryItem: 'inventory', RestockingTask: 'restocking',
    Delivery: 'deliveries', CustomerIssue: 'customer-service', CleaningTask: 'cleaning',
    Employee: 'employees'
  };
  const view = map[entityType];
  if (view) location.hash = `#${view}`;
}
