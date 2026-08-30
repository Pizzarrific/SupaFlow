// ================= Notification center =================

const NotifCenter = {
  panel: null,
  btn: null,
  dot: null,

  init() {
    this.panel = document.getElementById('notif-panel');
    this.btn = document.getElementById('notif-btn');
    this.dot = document.getElementById('notif-dot');

    this.btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    document.addEventListener('click', (e) => {
      if (!this.panel.contains(e.target) && e.target !== this.btn) this.close();
    });

    this.refreshCount();
    setInterval(() => this.refreshCount(), 30000);
  },

  toggle() {
    if (this.panel.classList.contains('hidden')) this.open(); else this.close();
  },

  close() {
    this.panel.classList.add('hidden');
  },

  async open() {
    closeOtherPanels('notif-panel');
    this.panel.classList.remove('hidden');
    this.panel.innerHTML = `<div class="state-block"><div class="icon">⏳</div><p>${I18n.t('loading')}</p></div>`;
    try {
      const list = await api.get('/notifications');
      this.render(list);
    } catch (err) {
      this.panel.innerHTML = `<div class="state-block"><p>${escapeHtml(err.message)}</p></div>`;
    }
  },

  render(list) {
    const header = `
      <div class="dropdown-panel-header">
        <strong>${I18n.t('notifications')}</strong>
        <button class="btn btn-ghost btn-sm" id="notif-mark-all">${I18n.t('mark_all_read')}</button>
      </div>`;
    if (!list.length) {
      this.panel.innerHTML = header + `<div class="state-block"><div class="icon">🔔</div><p>${I18n.t('all_caught_up')}</p></div>`;
    } else {
      const items = list.map(n => `
        <div class="notif-item ${n.isRead ? 'read' : 'unread'}" data-id="${n.id}" data-link-type="${n.linkType || ''}" data-link-id="${n.linkId || ''}">
          <div class="dot-col"></div>
          <div class="content">
            <div class="title">${escapeHtml(n.title)}</div>
            <div class="msg">${escapeHtml(n.message)}</div>
            <div class="time">${timeAgo(n.createdAt)}</div>
          </div>
          <button class="del" data-del="${n.id}" title="${I18n.t('delete_notification')}" aria-label="${I18n.t('delete_notification')}">✕</button>
        </div>
      `).join('');
      this.panel.innerHTML = header + `<div>${items}</div>`;
    }

    this.panel.querySelector('#notif-mark-all')?.addEventListener('click', async () => {
      await api.patch('/notifications/read-all');
      this.refreshCount();
      this.open();
    });

    this.panel.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.del')) return;
        const id = item.dataset.id;
        await api.patch(`/notifications/${id}/read`);
        this.refreshCount();
        const linkType = item.dataset.linkType;
        if (linkType) openRecord(linkType, item.dataset.linkId);
        this.close();
      });
    });

    this.panel.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await api.delete(`/notifications/${btn.dataset.del}`);
        this.open();
        this.refreshCount();
      });
    });
  },

  async refreshCount() {
    try {
      const list = await api.get('/notifications');
      const unread = list.filter(n => !n.isRead).length;
      this.dot.classList.toggle('hidden', unread === 0);
    } catch { /* silent - non-critical */ }
  }
};

function closeOtherPanels(exceptId) {
  document.querySelectorAll('.dropdown-panel').forEach(p => { if (p.id !== exceptId) p.classList.add('hidden'); });
}
