// ================= API client =================
// Central fetch wrapper: attaches JWT, unwraps ApiResponse<T>, throws readable errors.

const API_BASE = window.STOREFLOW_API_BASE || 'http://localhost:5080/api';

function getToken() {
  return localStorage.getItem('sf_token');
}

async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the StoreFlow server. Check that the backend is running.');
  }

  if (res.status === 401) {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    // No separate login page — reload so main.js's Auth.ensureSession()
    // silently signs back in with the demo account.
    location.reload();
    throw new Error('Your session expired. Signing back in…');
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || (payload && payload.success === false)) {
    const message = (payload && payload.message) || `Request failed (${res.status}).`;
    throw new Error(message);
  }

  return payload ? payload.data : null;
}

const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' })
};
