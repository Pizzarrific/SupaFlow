Views.attendance = {
  timerInterval: null,
  clockInTime: null,

  async render(root) {
    const isManager = Auth.isManager();
    root.innerHTML = `
      <div class="page-header"><div><h1 data-i18n="att_title">Attendance</h1><p class="subtitle" data-i18n="att_subtitle">Clock in, take breaks, and track your hours.</p></div></div>
      <div class="two-col">
        <div class="card">
          <div class="clock-hero" id="clock-hero"><div class="skeleton skeleton-card"></div></div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:0.8rem;">${I18n.t('this_week')}</h3>
          <div class="emp-stats-row" id="week-stats">
            <div class="emp-stat"><div class="num" id="week-hours">—</div><div class="lbl">${I18n.t('hours_this_week')}</div></div>
            <div class="emp-stat"><div class="num" id="today-hours">—</div><div class="lbl">${I18n.t('hours_today')}</div></div>
          </div>
          <div class="divider"></div>
          <h3 style="margin-bottom:0.6rem;">${I18n.t('recent_shifts')}</h3>
          <div id="my-history"><div class="skeleton skeleton-line"></div></div>
        </div>
      </div>
      ${isManager ? `
      <div class="divider"></div>
      <div class="page-header"><div><h2>${I18n.t('team_attendance')}</h2><p class="subtitle">${I18n.t('team_attendance_sub')}</p></div></div>
      <div id="team-attendance"><div class="skeleton skeleton-card"></div></div>
      ` : ''}
    `;

    await this.refreshStatus();
    this.loadHistory();
    if (isManager) this.loadTeamAttendance();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.tickClock(), 1000);
  },

  async refreshStatus() {
    const status = await api.get('/attendance/me/status');
    this.status = status;
    this.clockInTime = status.clockIn ? new Date(status.clockIn) : null;
    this.renderHero();
    document.getElementById('week-hours').textContent = status.weeklyHours;
    document.getElementById('today-hours').textContent = status.todayHours;
  },

  renderHero() {
    const hero = document.getElementById('clock-hero');
    const s = this.status;
    if (!s.isClockedIn) {
      hero.innerHTML = `
        <div class="clock-status-label">${I18n.t('currently_off_shift_msg')}</div>
        <div class="clock-time" id="live-clock">00:00:00</div>
        <button class="btn btn-primary clock-btn" id="clock-in-btn">${I18n.t('clock_in')}</button>
      `;
      document.getElementById('clock-in-btn').onclick = () => this.clockIn();
    } else {
      hero.innerHTML = `
        <div class="clock-status-label">${s.isOnBreak ? I18n.t('on_break_label') : I18n.t('shift_active')}</div>
        <div class="clock-time" id="live-clock">00:00:00</div>
        <div class="clock-meta-row">
          <div class="clock-meta-item"><div class="num">${formatTime(s.clockIn)}</div><div class="lbl">${I18n.t('started_label')}</div></div>
        </div>
        <div style="display:flex; gap:0.6rem;">
          ${s.isOnBreak
            ? `<button class="btn btn-secondary clock-btn" id="break-end-btn">${I18n.t('end_break')}</button>`
            : `<button class="btn btn-secondary clock-btn" id="break-start-btn">${I18n.t('start_break')}</button>`}
          <button class="btn btn-danger clock-btn" id="clock-out-btn">${I18n.t('clock_out')}</button>
        </div>
      `;
      document.getElementById('clock-out-btn').onclick = () => this.clockOut();
      const breakStart = document.getElementById('break-start-btn');
      const breakEnd = document.getElementById('break-end-btn');
      if (breakStart) breakStart.onclick = () => this.startBreak();
      if (breakEnd) breakEnd.onclick = () => this.endBreak();
    }
    this.tickClock();
  },

  tickClock() {
    const el = document.getElementById('live-clock');
    if (!el) return;
    const diff = this.clockInTime ? Date.now() - this.clockInTime.getTime() : 0;
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    el.textContent = this.clockInTime ? `${h}:${m}:${s}` : new Date().toLocaleTimeString();
  },

  async clockIn() {
    try {
      await api.post('/attendance/clock-in');
      showToast(I18n.t('clocked_in_toast'), 'success');
      this.refreshStatus(); this.loadHistory();
    } catch (err) { showToast(err.message, 'error'); }
  },
  async clockOut() {
    const ok = await confirmDialog(I18n.t('clock_out_confirm_body'), { title: I18n.t('clock_out_confirm_title'), confirmLabel: I18n.t('clock_out'), danger: false });
    if (!ok) return;
    try {
      const res = await api.post('/attendance/clock-out');
      showToast(`${I18n.t('clocked_out_toast')} ${res.duration}.`, 'success');
      this.refreshStatus(); this.loadHistory();
    } catch (err) { showToast(err.message, 'error'); }
  },
  async startBreak() {
    try { await api.post('/attendance/break/start'); showToast(I18n.t('break_started_toast'), 'success'); this.refreshStatus(); }
    catch (err) { showToast(err.message, 'error'); }
  },
  async endBreak() {
    try { await api.post('/attendance/break/end'); showToast(I18n.t('break_ended_toast'), 'success'); this.refreshStatus(); }
    catch (err) { showToast(err.message, 'error'); }
  },

  async loadHistory() {
    const uid = Auth.getUser().id;
    const records = await api.get(`/employees/${uid}/attendance`);
    const el = document.getElementById('my-history');
    if (!records.length) { el.innerHTML = `<p class="text-muted" style="font-size:0.85rem;">${I18n.t('no_shifts_yet')}</p>`; return; }
    el.innerHTML = records.slice(0, 8).map(r => `
      <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid var(--border); font-size:0.82rem;">
        <span>${new Date(r.clockIn).toLocaleDateString()}</span>
        <span class="text-muted">${formatTime(r.clockIn)} – ${r.clockOut ? formatTime(r.clockOut) : I18n.t('active_badge')}</span>
      </div>`).join('');
  },

  async loadTeamAttendance() {
    const records = await api.get('/attendance');
    const el = document.getElementById('team-attendance');
    if (!records.length) { el.innerHTML = `<div class="state-block"><p>${I18n.t('no_attendance_yet')}</p></div>`; return; }
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>${I18n.t('col_employee_id')}</th><th>${I18n.t('col_name')}</th><th>${I18n.t('col_clock_in')}</th><th>${I18n.t('col_clock_out')}</th><th>${I18n.t('col_duration')}</th></tr></thead>
        <tbody>
          ${records.slice(0, 40).map(r => `
            <tr>
              <td class="mono">${r.employeeId}</td>
              <td>${escapeHtml(r.employeeName)}</td>
              <td>${formatDateTime(r.clockIn)}</td>
              <td>${r.clockOut ? formatDateTime(r.clockOut) : `<span class="badge badge-ok">${I18n.t('active_badge')}</span>`}</td>
              <td>${r.duration}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }
};
