Views.tasks = {
  allTasks: [],
  employees: [],

  async render(root) {
    root.innerHTML = `
      <div class="page-header">
        <div><h1 data-i18n="tasks_title">My Tasks</h1><p class="subtitle" data-i18n="tasks_subtitle">Drag cards between columns to update status.</p></div>
        <button class="btn btn-primary" id="add-task-btn">➕ <span data-i18n="add_task">Add Task</span></button>
      </div>
      <div class="filter-bar">
        <div class="search-input-wrap"><span class="icon">🔍</span><input type="search" id="task-search" placeholder="Search tasks…"></div>
        <select id="filter-priority"><option value="">All priorities</option><option>Urgent</option><option>High</option><option>Medium</option><option>Low</option></select>
        <select id="filter-category"><option value="">All categories</option><option>Restocking</option><option>Cleaning</option><option>Inventory</option><option>Delivery</option><option>CustomerService</option><option>Maintenance</option><option>Other</option></select>
        <select id="filter-employee"><option value="">All employees</option></select>
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
    empSelect.innerHTML = '<option value="">All employees</option>' + this.employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.employeeId})</option>`).join('');

    await this.load();
  },

  columnSkeleton(status) {
    return `<div class="board-col"><div class="board-col-header"><span class="board-col-title">${this.colLabel(status)}</span></div><div class="skeleton skeleton-card"></div></div>`;
  },

  colLabel(status) {
    return { Todo: 'To Do', InProgress: 'In Progress', Blocked: 'Blocked', Completed: 'Done' }[status];
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
            ${tasks.length ? tasks.map(t => this.taskCard(t)).join('') : '<p class="text-muted" style="font-size:0.8rem; padding:0.5rem;">No tasks here.</p>'}
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
          <span class="badge ${priorityBadgeClass(t.priority)}">${t.priority}</span>
        </div>
        <div class="tc-title">${escapeHtml(t.title)}</div>
        <div class="tc-meta">
          <span class="tc-due">${t.dueDate ? '⏰ ' + formatDateTime(t.dueDate) : ''}</span>
          <span class="tc-comments">${t.commentCount > 0 ? '💬 ' + t.commentCount : ''}</span>
        </div>
        <div class="tc-meta">
          <div class="avatar avatar-sm" title="${t.assignedTo ? escapeHtml(t.assignedTo.name) : 'Unassigned'}">${initials}</div>
          <span class="text-muted" style="font-size:0.7rem;">${t.assignedTo ? t.assignedTo.employeeId : 'Unassigned'}</span>
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
          showToast(newStatus === 'Completed' ? 'Task marked complete.' : `Moved to ${this.colLabel(newStatus)}.`, 'success');
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
    const overlay = openModal(`
      <div class="modal-header"><h3>Add Task</h3><button class="modal-close" data-close>✕</button></div>
      <form id="task-form">
        <div class="modal-body">
          <div class="form-row"><label for="t-title">Title</label><input id="t-title" required placeholder="e.g. Restock dairy aisle"></div>
          <div class="form-row"><label for="t-desc">Description</label><textarea id="t-desc" rows="3" placeholder="Optional details…"></textarea></div>
          <div class="form-grid">
            <div class="form-row"><label for="t-category">Category</label>
              <select id="t-category"><option>Restocking</option><option>Cleaning</option><option>Inventory</option><option>Delivery</option><option>CustomerService</option><option>Maintenance</option><option>Other</option></select>
            </div>
            <div class="form-row"><label for="t-priority">Priority</label>
              <select id="t-priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-row"><label for="t-assignee">Assign to</label>
              <select id="t-assignee"><option value="">Unassigned</option>${employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.employeeId})</option>`).join('')}</select>
            </div>
            <div class="form-row"><label for="t-due">Due date</label><input type="datetime-local" id="t-due"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">Create Task</button>
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
        showToast('Task created.', 'success');
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
          <span class="badge ${priorityBadgeClass(task.priority)}">${task.priority}</span>
          <span class="badge ${statusBadgeClass(task.status)}">${humanizeEnum(task.status)}</span>
        </div>
        <p class="text-secondary" style="margin-bottom:1rem;">${escapeHtml(task.description || 'No description provided.')}</p>

        <div class="form-grid" style="margin-bottom:1rem;">
          <div class="form-row"><label>Assignee</label>
            <select id="td-assignee"><option value="">Unassigned</option>${employees.map(e => `<option value="${e.id}" ${task.assignedTo?.id === e.id ? 'selected' : ''}>${escapeHtml(e.name)} (${e.employeeId})</option>`).join('')}</select>
          </div>
          <div class="form-row"><label>Status</label>
            <select id="td-status">${['Todo', 'InProgress', 'Blocked', 'Completed'].map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${this.colLabel(s)}</option>`).join('')}</select>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" id="td-save">Save changes</button>

        <div class="divider"></div>
        <h3 style="margin-bottom:0.6rem;">Comments</h3>
        <div id="td-comments" style="max-height:200px; overflow-y:auto; margin-bottom:0.8rem;">
          ${comments.length ? comments.map(c => `
            <div style="margin-bottom:0.7rem;">
              <div style="font-size:0.8rem;"><strong>${escapeHtml(c.userName)}</strong> <span class="text-muted mono">${c.employeeId}</span> <span class="text-muted">· ${timeAgo(c.createdAt)}</span></div>
              <div style="font-size:0.85rem;">${escapeHtml(c.comment)}</div>
            </div>`).join('') : '<p class="text-muted" style="font-size:0.85rem;">No comments yet.</p>'}
        </div>
        <div style="display:flex; gap:0.5rem;">
          <input id="td-comment-input" placeholder="Add a comment… use @Name to mention">
          <button class="btn btn-primary btn-sm" id="td-comment-send">Send</button>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" id="td-delete">Delete task</button>
        <button class="btn btn-secondary" data-close>Close</button>
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
        showToast('Task updated.', 'success');
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
        showToast('Comment added.', 'success');
        closeModal();
        this.openDetailModal(taskId);
      } catch (err) { showToast(err.message, 'error'); }
    };

    overlay.querySelector('#td-delete').onclick = async () => {
      const ok = await confirmDialog('This will permanently delete the task.', { title: 'Delete this task?', confirmLabel: 'Delete' });
      if (!ok) return;
      try {
        await api.delete(`/tasks/${taskId}`);
        showToast('Task deleted.', 'success');
        closeModal();
        this.load();
      } catch (err) { showToast(err.message, 'error'); }
    };
  }
};
