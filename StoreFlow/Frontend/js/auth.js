// ================= Auth helpers =================
// There's no separate login page — the app signs itself in automatically
// with a demo account on first load ("ensureSession"), since this build is
// meant to be pushed straight to Vercel and opened without a manual sign-in
// step. The real backend auth (JWT, password hashing, roles) is unchanged;
// only the visible login *screen* was removed. See README for how to bring
// a login screen back if you need real per-user sign-in later.

const DEMO_ACCOUNT = { email: 'manager@storeflow.local', password: 'Password123!' };

const Auth = {
  getUser() {
    const raw = localStorage.getItem('sf_user');
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn() {
    return !!getToken() && !!this.getUser();
  },
  isManager() {
    const u = this.getUser();
    return u && u.role === 'Manager';
  },
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('sf_token', data.token);
    localStorage.setItem('sf_user', JSON.stringify(data.user));
    return data.user;
  },
  logout() {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    location.reload();
  },
  // Ensures there's a valid session before the app renders. If a token is
  // already cached (a normal page refresh), it's reused instantly. If not,
  // it signs in silently with the demo manager account and flags the
  // startup sequence to play its full animation, since this is effectively
  // a "fresh login" from the user's point of view.
  async ensureSession() {
    if (this.isLoggedIn()) return true;
    try {
      await this.login(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password);
      sessionStorage.setItem('sf_just_logged_in', '1');
      return true;
    } catch (err) {
      return false;
    }
  },
  initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  }
};
