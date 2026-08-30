Views.reports = {
  async render(root) {
    root.innerHTML = `
      <div class="page-header"><div><h1 data-i18n="rep_title">Reports</h1><p class="subtitle" data-i18n="rep_subtitle">Real time statistics generated from live store data.</p></div></div>
      <div class="kpi-grid" id="rep-kpi">${Array(4).fill('<div class="skeleton skeleton-card"></div>').join('')}</div>
      <div class="two-col" style="margin-bottom:1.4rem;">
        <div class="chart-card">
          <h3 style="margin-bottom:0.8rem;">Employee Performance</h3>
          <div id="rep-perf-chart"><div class="skeleton skeleton-card"></div></div>
        </div>
        <div class="chart-card">
          <h3 style="margin-bottom:0.8rem;">Inventory Health</h3>
          <div id="rep-inv"><div class="skeleton skeleton-card"></div></div>
        </div>
      </div>
      <div class="chart-card">
        <h3 style="margin-bottom:0.8rem;">Customer Service</h3>
        <div id="rep-cs"><div class="skeleton skeleton-card"></div></div>
      </div>
    `;

    const data = await api.get('/reports');
    this.renderKpis(data.dailyOperations);
    this.renderPerf(data.employeePerformance);
    this.renderInventory(data.inventory);
    this.renderCustomerService(data.customerService);
  },

  renderKpis(d) {
    document.getElementById('rep-kpi').innerHTML = `
      <div class="kpi-card"><div class="kpi-figure">${d.completedTasks}</div><div class="kpi-label">Completed today</div></div>
      <div class="kpi-card"><div class="kpi-figure">${d.overdueTasks}</div><div class="kpi-label">Overdue tasks</div></div>
      <div class="kpi-card"><div class="kpi-figure">${d.averageCompletionHours}h</div><div class="kpi-label">Avg. completion time</div></div>
      <div class="kpi-card"><div class="kpi-figure">${d.employeesPresent}</div><div class="kpi-label">Employees present</div></div>
    `;
  },

  renderPerf(list) {
    const top = list.slice(0, 8);
    const max = Math.max(1, ...top.map(p => p.tasksCompleted));
    document.getElementById('rep-perf-chart').innerHTML = `
      <div class="bar-chart">
        ${top.map(p => `
          <div class="bar-col">
            <div class="bar-value">${p.tasksCompleted}</div>
            <div class="bar" style="height:${(p.tasksCompleted / max) * 100}%"></div>
            <div class="bar-label">${p.employeeId}</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:1rem; max-height:180px; overflow-y:auto;">
        <table class="data-table">
          <thead><tr><th>Employee</th><th>Completed</th><th>Overdue</th><th>Hours</th></tr></thead>
          <tbody>${top.map(p => `<tr><td>${p.employeeId} · ${escapeHtml(p.name)}</td><td>${p.tasksCompleted}</td><td>${p.tasksOverdue}</td><td>${p.hoursWorked}h</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  },

  renderInventory(inv) {
    document.getElementById('rep-inv').innerHTML = `
      <div class="emp-stats-row">
        <div class="emp-stat"><div class="num">${inv.lowStockCount}</div><div class="lbl">Low / critical stock</div></div>
        <div class="emp-stat"><div class="num">${inv.outOfStockCount}</div><div class="lbl">Out of stock</div></div>
        <div class="emp-stat"><div class="num">${inv.restocksCompletedToday}</div><div class="lbl">Restocks today</div></div>
      </div>`;
  },

  renderCustomerService(cs) {
    document.getElementById('rep-cs').innerHTML = `
      <div class="emp-stats-row">
        <div class="emp-stat"><div class="num">${cs.issuesOpened}</div><div class="lbl">Opened today</div></div>
        <div class="emp-stat"><div class="num">${cs.issuesResolved}</div><div class="lbl">Total resolved</div></div>
        <div class="emp-stat"><div class="num">${cs.averageResolutionHours}h</div><div class="lbl">Avg. resolution time</div></div>
      </div>`;
  }
};
