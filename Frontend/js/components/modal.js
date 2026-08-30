// ================= Modal + confirm dialog helpers =================

function openModal(innerHtml, { wide = false } = {}) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal-overlay';
  overlay.innerHTML = `<div class="modal ${wide ? 'modal-wide' : ''}" role="dialog" aria-modal="true">${innerHtml}</div>`;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  document.addEventListener('keydown', escCloseHandler);
  const firstInput = overlay.querySelector('input, select, textarea, button');
  if (firstInput) firstInput.focus();
  return overlay;
}

function escCloseHandler(e) {
  if (e.key === 'Escape') closeModal();
}

function closeModal() {
  const existing = document.getElementById('active-modal-overlay');
  if (existing) existing.remove();
  document.removeEventListener('keydown', escCloseHandler);
}

function confirmDialog(message, { title = 'Are you sure?', confirmLabel = 'Confirm', danger = true } = {}) {
  return new Promise((resolve) => {
    const overlay = openModal(`
      <div class="confirm-body">
        <div class="icon">${danger ? '⚠️' : '❓'}</div>
        <h3>${escapeHtml(title)}</h3>
        <p class="text-muted" style="margin-top:0.5rem;">${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${escapeHtml(confirmLabel)}</button>
      </div>
    `);
    overlay.querySelector('#confirm-cancel').onclick = () => { closeModal(); resolve(false); };
    overlay.querySelector('#confirm-ok').onclick = () => { closeModal(); resolve(true); };
  });
}
