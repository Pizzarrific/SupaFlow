// ================= Lightweight shared state / cache =================
// Avoids refetching the employee list on every view.

const Store = {
  _employees: null,
  _employeesFetchedAt: 0,

  async getEmployees(force = false) {
    const stale = Date.now() - this._employeesFetchedAt > 60000;
    if (!this._employees || force || stale) {
      this._employees = await api.get('/employees');
      this._employeesFetchedAt = Date.now();
    }
    return this._employees;
  },

  invalidateEmployees() {
    this._employees = null;
  }
};

const Views = {};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function priorityBadgeClass(priority) {
  return { Urgent: 'badge-urgent', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' }[priority] || 'badge-neutral';
}

function statusBadgeClass(status) {
  const map = {
    Todo: 'badge-neutral', InProgress: 'badge-info', Blocked: 'badge-urgent', Completed: 'badge-ok',
    InStock: 'badge-ok', LowStock: 'badge-warn', Critical: 'badge-critical', OutOfStock: 'badge-critical',
    Open: 'badge-urgent', Waiting: 'badge-warn', Resolved: 'badge-ok',
    Scheduled: 'badge-neutral', InTransit: 'badge-info', Arriving: 'badge-warn', Arrived: 'badge-ok',
    Checking: 'badge-info', Completed2: 'badge-ok', Delayed: 'badge-critical',
    Clean: 'badge-ok', Due: 'badge-warn', Overdue: 'badge-critical',
    Queued: 'badge-neutral',
    Active: 'badge-ok', OnLeave: 'badge-warn', Suspended: 'badge-critical', Inactive: 'badge-neutral'
  };
  return map[status] || 'badge-neutral';
}

function humanizeEnum(value) {
  // Delegates to I18n so every status/priority/category badge across every
  // view translates automatically when the language is switched, without
  // each view needing to know about translation.
  return I18n.enumLabel(value);
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function animateCount(el, target, duration = 600) {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
