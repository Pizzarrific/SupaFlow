Views.team = {
  async render(root) {
    root.innerHTML = `
      <div class="page-header"><div><h1 data-i18n="team_title">Team Board</h1><p class="subtitle" data-i18n="team_subtitle">Who's on the floor right now.</p></div></div>
      <div class="card-grid" id="team-grid">${Array(6).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
    `;

    const employees = await api.get('/employees');
    const grid = document.getElementById('team-grid');
    grid.innerHTML = employees.map(e => this.card(e)).join('');

    grid.querySelectorAll('[data-emp]').forEach(el => {
      el.addEventListener('click', () => Views.employees.openProfile(el.dataset.emp));
    });
  },

  card(e) {
    const statusClass = { OnFloor: 'on-floor', OnBreak: 'on-break', OffShift: 'off-shift', Busy: 'busy' }[e.currentStatus] || 'off-shift';
    const statusLabel = humanizeEnum(e.currentStatus);
    return `
      <div class="emp-card card-hover" data-emp="${e.id}">
        <div class="emp-card-top">
          <div class="avatar">${Auth.initials(e.name)}</div>
          <div>
            <div class="emp-id-tag">${e.employeeId}</div>
            <div class="emp-name">${escapeHtml(e.name)}</div>
            <div class="emp-dept">${escapeHtml(e.department)}</div>
          </div>
        </div>
        <div class="emp-status-row"><span class="status-dot ${statusClass} ${statusClass === 'on-floor' ? 'pulse' : ''}"></span> ${statusLabel}</div>
        <div class="emp-stats-row">
          <div class="emp-stat"><div class="num">${e.activeTaskCount}</div><div class="lbl">Active tasks</div></div>
          <div class="emp-stat"><div class="num">${e.todayHours}</div><div class="lbl">Today</div></div>
        </div>
        <button class="btn btn-secondary btn-sm btn-block">View Profile</button>
      </div>`;
  }
};
