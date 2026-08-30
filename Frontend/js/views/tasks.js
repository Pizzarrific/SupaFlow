Views.tasks = {
  allTasks: [],
  employees: [],

  async render(root) {
    const categories = ['Restocking', 'Cleaning', 'Inventory', 'Delivery', 'CustomerService', 'Maintenance', 'Other'];
    const priorities = ['Urgent', 'High', 'Medium', 'Low'];
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="tasks_title">My Tasks</h1><p class="subtitle" data-i18n="tasks_subtitle">Drag cards between columns to update status.</p></div>
        <button class="btn btn-primary" id="add-task-btn">➕ <span data-i18n="add_task">Add Task</span></button>
      </div>
      <div class="filter-bar">
        <div class="search-input-wrap"><span class="icon">🔍</span><input type="search" id="task-search" placeholder="${I18n.t('search_tasks')}"></div>
        <select id="filter-priority"><option value="">${I18n.t('filter_all_priorities')}</option>${priorities.map(p => `<option value="${p}">${humanizeEnum(p)}</option>`).join('')}</select>
        <select id="filter-category"><option value="">${I18n.t('filter_all_categories')}</option>${categories.map(c => `<option value="${c}">${humanizeEnum(c)}</option>`).join('')}</select>
        <select id="filter-employee"><option value="">${I18n.t('filter_all_employees')}</option></select>
      </div>
      <div class="board-columns" id="board-columns">
        ${['Todo', 'InProgress', 'Blocked', 'Completed'].map(s => this.columnSkeleton(s)).join('')}
      </div>
    `;

    document.getElementById('add-task-btn').onclick = () => this.openCreateModal();
    document.getElementById('task-search').addEventListener('input', debounce(() => this.load(), 300));
    document.getElementById('filter-priority').addEventListener('change', () => this.load());
    document.getElementById('filter-category').addEventListener('change', () => this.load());
    document.getElementById('filter-employee').addEventListener('change', () => this.load());

    this.employees = await Store.getEmployees();
    const empSelect = document.getElementById('filter-employee');
    empSelect.innerHTML = `<option value="">${I18n.t('filter_all_employees')}</option>` + this.employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.employeeId})</option>`).join('');

    await this.load();
  },

  columnSkeleton(status) {
    return `<div class="board-col"><div class="board-col-header"><span class="board-col-title">${this.colLabel(status)}</span></div><div class="skeleton skeleton-card"></div></div>`;
  },

  colLabel(status) {
    return { Todo: I18n.t('col_todo'), InProgress: I18n.t('col_inprogress'), Blocked: I18n.t('col_blocked'), Completed: I18n.t('col_done') }[status];
  },

  async load() {
    const params = new URLSearchParams();
    const search = document.getElementById('task-search')?.value;
    const priority = document.getElementById('filter-priority')?.value;
    const category = document.getElementById('filter-category')?.value;
    const employee = document.getElementById('filter-employee')?.value;
    if (search) params.set('search', search);
    if (priority) params.set('priority', priority);
    if (category) params.set('category', category);
    if (employee) params.set('assignedToUserId', employee);

    this.allTasks = await api.get(`/tasks?${params.toString()}`);
    this.renderBoard();
  },

  renderBoard() {
    const columns = ['Todo', 'InProgress', 'Blocked', 'Completed'];
    const container = document.getElementById('board-columns');
    container.innerHTML = columns.map(status => {
      const tasks = this.allTasks.filter(t => t.status === status);
      return `
        <div class="board-col">
          <div class="board-col-header">
            <span class="board-col-title">${this.colLabel(status)}</span>
            <span class="board-col-count">${tasks.length}</span>
          </div>
          <div class="board-col-body" data-status="${status}">
            ${tasks.length ? tasks.map(t => this.taskCard(t)).join('') : `<p class="text-muted" style="font-size:0.8rem; padding:0.5rem;">${I18n.t('no_tasks_here')}</p>`}
          </div>
        </div>`;
    }).join('');

    this.wireDragDrop();
    this.wireCardClicks();
  },

  taskCard(t) {
    const initials = t.assignedTo ? Auth.initials(t.assignedTo.name) : '?';
    return `
      <div class="task-card" draggable="true" data-id="${t.id}">
        <div class="tc-top">
          <span class="badge badge-cat" data-cat="${t.category}">${humanizeEnum(t.category)}</span>
          <span class="badge ${priorityBadgeClass(t.priority)}">${humanizeEnum(t.priority)}</span>
        </div>
        <div class="tc-title">${escapeHtml(t.title)}</div>
        <div class="tc-meta">
          <span class="tc-due">${t.dueDate ? '⏰ ' + formatDateTime(t.dueDate) : ''}</span>
          <span class="tc-comments">${t.commentCount > 0 ? '💬 ' + t.commentCount : ''}</span>
        </div>
        <div class="tc-meta">
          <div class="avatar avatar-sm" title="${t.assignedTo ? escapeHtml(t.assignedTo.name) : I18n.t('unassigned')}">${initials}</div>
          <span class="text-muted" style="font-size:0.7rem;">${t.assignedTo ? t.assignedTo.employeeId : I18n.t('unassigned')}</span>
        </div>
      </div>`;
  },

  wireCardClicks() {
    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (card.classList.contains('dragging')) return;
        this.openDetailModal(card.dataset.id);
      });
    });
  },

  wireDragDrop() {
    document.querySelectorAll('.task-card').forEach(card => {
      card.addEventListener('dragstart', () => { card.classList.add('dragging'); });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); });
    });

    document.querySelectorAll('.board-col-body').forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const dragging = document.querySelector('.task-card.dragging');
        if (!dragging) return;
        const taskId = dragging.dataset.id;
        const newStatus = col.dataset.status;
        const task = this.allTasks.find(t => String(t.id) === taskId);
        if (!task || task.status === newStatus) return;

        const prevStatus = task.status;
        task.status = newStatus; // optimistic update
        this.renderBoard();

        try {
          await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
          showToast(newStatus === 'Completed' ? I18n.t('task_completed_toast') : `${I18n.t('moved_to')} ${this.colLabel(newStatus)}.`, 'success');
        } catch (err) {
          task.status = prevStatus; // rollback
          this.renderBoard();
          showToast(err.message, 'error');
        }
      });
    });
  },

  async openCreateModal() {
    const employees = await Store.getEmployees();
    const categories = ['Restocking', 'Cleaning', 'Inventory', 'Delivery', 'CustomerService', 'Maintenance', 'Other'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const overlay = openModal(`
      <div class="modal-header"><h3>${I18n.t('add_task')}</h3><button class="modal-close" data-close>✕</button></div>
      <form id="task-form">
        <div class="modal-body">
          <div class="form-row"><label for="t-title">${I18n.t('task_title_label')}</label><input id="t-title" required placeholder="${I18n.t('task_title_ph')}"></div>
          <div class="form-row"><label for="t-desc">${I18n.t('task_desc_label')}</label><textarea id="t-desc" rows="3" placeholder="${I18n.t('task_desc_ph')}"></textarea></div>
          <div class="form-grid">
            <div class="form-row"><label for="t-category">${I18n.t('task_category_label')}</label>
              <select id="t-category">${categories.map(c => `<option value="${c}">${humanizeEnum(c)}</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="t-priority">${I18n.t('task_priority_label')}</label>
              <select id="t-priority">${priorities.map(p => `<option value="${p}" ${p === 'Medium' ? 'selected' : ''}>${humanizeEnum(p)}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="t-assignee">${I18n.t('task_assignee_label')}</label>
              <select id="t-assignee"><option value="">${I18n.t('unassigned')}</option>${employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.employeeId})</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="t-due">${I18n.t('task_due_label')}</label><input type="datetime-local" id="t-due"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>${I18n.t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${I18n.t('create_task')}</button>
        </div>
      </form>
    `);
    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
    overlay.querySelector('#task-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type=submit]');
      submitBtn.disabled = true;
      try {
        await api.post('/tasks', {
          title: document.getElementById('t-title').value,
          description: document.getElementById('t-desc').value,
          category: document.getElementById('t-category').value,
          priority: document.getElementById('t-priority').value,
          assignedToUserId: document.getElementById('t-assignee').value || null,
          dueDate: document.getElementById('t-due').value || null
        });
        closeModal();
        showToast(I18n.t('task_created'), 'success');
        this.load();
      } catch (err) {
        submitBtn.disabled = false;
        showToast(err.message, 'error');
      }
    });
  },

  async openDetailModal(taskId) {
    const { task, comments } = await api.get(`/tasks/${taskId}`);
    const employees = await Store.getEmployees();

    const overlay = openModal(`
      <div class="modal-header">
        <h3>${escapeHtml(task.title)}</h3>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">
        <div class="chip-row" style="margin-bottom:0.9rem;">
          <span class="badge badge-cat" data-cat="${task.category}">${humanizeEnum(task.category)}</span>
          <span class="badge ${priorityBadgeClass(task.priority)}">${humanizeEnum(task.priority)}</span>
          <span class="badge ${statusBadgeClass(task.status)}">${humanizeEnum(task.status)}</span>
        </div>
        <p class="text-secondary" style="margin-bottom:1rem;">${escapeHtml(task.description || '')}</p>

        <div class="form-grid" style="margin-bottom:1rem;">
          <div class="form-row"><label>${I18n.t('assignee_label')}</label>
            <select id="td-assignee"><option value="">${I18n.t('unassigned')}</option>${employees.map(e => `<option value="${e.id}" ${task.assignedTo?.id === e.id ? 'selected' : ''}>${escapeHtml(e.name)} (${e.employeeId})</option>`).join('')}</select>
          </div>
          <div class="form-row"><label>${I18n.t('status_label')}</label>
            <select id="td-status">${['Todo', 'InProgress', 'Blocked', 'Completed'].map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${this.colLabel(s)}</option>`).join('')}</select>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="td-save">${I18n.t('save_changes')}</button>

        <div class="divider"></div>
        <h3 style="margin-bottom:0.6rem;">${I18n.t('comments_heading')}</h3>
        <div id="td-comments" style="max-height:200px; overflow-y:auto; margin-bottom:0.8rem;">
          ${comments.length ? comments.map(c => `
            <div style="margin-bottom:0.7rem;">
              <div style="font-size:0.8rem;"><strong>${escapeHtml(c.userName)}</strong> <span class="text-muted mono">${c.employeeId}</span> <span class="text-muted">· ${timeAgo(c.createdAt)}</span></div>
              <div style="font-size:0.85rem;">${escapeHtml(c.comment)}</div>
            </div>`).join('') : `<p class="text-muted" style="font-size:0.85rem;">${I18n.t('no_comments')}</p>`}
        </div>
        <div style="display:flex; gap:0.5rem;">
          <input id="td-comment-input" placeholder="${I18n.t('comment_ph')}">
          <button class="btn btn-primary btn-sm" id="td-comment-send">${I18n.t('send')}</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" id="td-delete">${I18n.t('delete_task')}</button>
        <button class="btn btn-secondary" data-close>${I18n.t('close')}</button>
      </div>
    `, { wide: true });

    overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);

    overlay.querySelector('#td-save').onclick = async () => {
      try {
        const newAssignee = document.getElementById('td-assignee').value || null;
        const newStatus = document.getElementById('td-status').value;
        await api.put(`/tasks/${taskId}`, {
          title: task.title, description: task.description, category: task.category,
          priority: task.priority, assignedToUserId: newAssignee, dueDate: task.dueDate
        });
        if (newStatus !== task.status) await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
        showToast(I18n.t('task_updated'), 'success');
        closeModal();
        this.load();
      } catch (err) { showToast(err.message, 'error'); }
    };

    overlay.querySelector('#td-comment-send').onclick = async () => {
      const input = document.getElementById('td-comment-input');
      if (!input.value.trim()) return;
      try {
        await api.post(`/tasks/${taskId}/comments`, { comment: input.value.trim() });
        input.value = '';
        showToast(I18n.t('comment_added'), 'success');
        closeModal();
        this.openDetailModal(taskId);
      } catch (err) { showToast(err.message, 'error'); }
    };

    overlay.querySelector('#td-delete').onclick = async () => {
      const ok = await confirmDialog(I18n.t('delete_task_confirm_body'), { title: I18n.t('delete_task_confirm_title'), confirmLabel: I18n.t('delete') });
      if (!ok) return;
      try {
        await api.delete(`/tasks/${taskId}`);
        showToast(I18n.t('task_deleted'), 'success');
        closeModal();
        this.load();
      } catch (err) { showToast(err.message, 'error'); }
    };
  }
};
