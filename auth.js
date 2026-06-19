/* ══════════════════════════════════════════
   RoadSafe India — Auth System (LocalStorage)
   ══════════════════════════════════════════ */

const RS = {
  USERS_KEY: 'rs_users',
  SESSION_KEY: 'rs_session',
  HISTORY_KEY: 'rs_history',

  // ── Seed default accounts ─────────────────
  init() {
    if (!localStorage.getItem(this.USERS_KEY)) {
      const defaults = [
        { id:1, name:'RoadSafe Admin', email:'admin@roadsafe.in', password:'Admin@123',
          role:'admin', joined:'2025-01-01', avatar:'A', analyses:0, blocked:false },
        { id:2, name:'Ajay Pathare', email:'demo@user.in', password:'Demo@123',
          role:'user', joined:'2025-02-10', avatar:'R', analyses:0, blocked:false },
        { id:3, name:'Swapnil Mirkhale', email:'priya@test.com', password:'Test@123',
          role:'user', joined:'2025-03-01', avatar:'P', analyses:0, blocked:false },
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaults));
    }
    if (!localStorage.getItem(this.HISTORY_KEY)) {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));
    }
  },

  // ── Get all users ──────────────────────────
  getUsers() { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; },
  saveUsers(u) { localStorage.setItem(this.USERS_KEY, JSON.stringify(u)); },

  // ── Login ──────────────────────────────────
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok:false, msg:'Invalid email or password.' };
    if (user.blocked) return { ok:false, msg:'Account suspended. Contact admin.' };
    const session = { userId:user.id, name:user.name, email:user.email, role:user.role, avatar:user.avatar, loginTime:Date.now() };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { ok:true, user:session };
  },

  // ── Register ───────────────────────────────
  register(name, email, password) {
    const users = this.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok:false, msg:'Email already registered.' };
    if (password.length < 6) return { ok:false, msg:'Password must be at least 6 characters.' };
    const id = users.length ? Math.max(...users.map(u=>u.id)) + 1 : 1;
    const newUser = { id, name, email, password, role:'user', joined:new Date().toISOString().slice(0,10),
      avatar:name[0].toUpperCase(), analyses:0, blocked:false };
    users.push(newUser);
    this.saveUsers(users);
    // Auto-login
    const session = { userId:id, name, email, role:'user', avatar:newUser.avatar, loginTime:Date.now() };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { ok:true, user:session };
  },

  // ── Logout ─────────────────────────────────
  logout() { localStorage.removeItem(this.SESSION_KEY); window.location.href='login.html'; },

  // ── Get current session ────────────────────
  getSession() { return JSON.parse(localStorage.getItem(this.SESSION_KEY)); },

  // ── Auth guard ─────────────────────────────
  guard(requiredRole) {
    const s = this.getSession();
    if (!s) { window.location.href='login.html'; return null; }
    if (requiredRole && s.role !== requiredRole) { window.location.href='index.html'; return null; }
    return s;
  },

  // ── Analysis History ───────────────────────
  saveAnalysis(data) {
    const s = this.getSession(); if (!s) return;
    const hist = JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || [];
    hist.unshift({ id:Date.now(), userId:s.userId, userName:s.name, ...data, time:new Date().toLocaleString() });
    if (hist.length > 200) hist.length = 200;
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(hist));
    // Increment user analysis count
    const users = this.getUsers();
    const u = users.find(x=>x.id===s.userId);
    if(u){ u.analyses=(u.analyses||0)+1; this.saveUsers(users); }
  },
  getHistory() {
    const s = this.getSession(); if(!s) return [];
    return (JSON.parse(localStorage.getItem(this.HISTORY_KEY))||[]).filter(h=>h.userId===s.userId);
  },
  getAllHistory() { return JSON.parse(localStorage.getItem(this.HISTORY_KEY)) || []; },

  // ── Admin: block/delete user ───────────────
  blockUser(id) {
    const users = this.getUsers();
    const u = users.find(x=>x.id===id);
    if(u && u.role!=='admin') { u.blocked=!u.blocked; this.saveUsers(users); return true; }
    return false;
  },
  deleteUser(id) {
    let users = this.getUsers();
    const u = users.find(x=>x.id===id);
    if(!u || u.role==='admin') return false;
    users = users.filter(x=>x.id!==id);
    this.saveUsers(users);
    return true;
  },
};

RS.init();
