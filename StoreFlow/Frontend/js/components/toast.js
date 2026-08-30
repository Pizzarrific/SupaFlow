// ================= Toast notifications =================

function ensureToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = 'info') {
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  el.innerHTML = `<span aria-hidden="true">${icon}</span><span class="toast-msg">${escapeHtml(message)}</span>`;
  stack.appendChild(el);

  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 200);
  }, 3800);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
