// ============================================================
// nav.js — Shared shell (topbar + sidebar)
// ============================================================

function buildShell(pageTitle, activeKey) {
  const s = SF.session();
  if (!s) return;

  const mods  = SF.getModules();
  const isOn  = slug => mods.find(m => m.slug === slug)?.active !== false;
  const sick  = SF.getAnimals().filter(a => a.healthStatus === 'sick').length;
  const total = SF.getAnimals().filter(a => a.isActive !== false).length;

  const nav = [
    { href:'dashboard.html', icon:'⊞', label:'Dashboard',  key:'dashboard' },
    isOn('livestock') ? { href:'livestock.html', icon:'🐄', label:'Herd',   key:'livestock', badge: sick > 0 ? sick : null, badgeClass: sick > 0 ? '' : 'g' } : null,
    isOn('livestock') ? { href:'health.html',    icon:'❤', label:'Health', key:'health',     badge: sick > 0 ? sick : null } : null,
    isOn('crops')     ? { href:'crops.html',     icon:'🌱', label:'Crops',  key:'crops' } : null,
    isOn('executive') ? { href:'executive.html', icon:'📊', label:'Analytics', key:'executive' } : null,
    { href:'transactions.html', icon:'₦', label:'Financials', key:'transactions' },
    s.role === 'admin' ? { href:'admin.html',    icon:'⚙', label:'Settings', key:'admin' } : null,
  ].filter(Boolean);

  const navHTML = nav.map(n => `
    <a href="${n.href}" class="nav-link ${activeKey === n.key ? 'active' : ''}">
      <span class="nav-icon">${n.icon}</span>
      ${n.label}
      ${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}
    </a>
  `).join('');

  document.getElementById('app-shell').innerHTML = `
  <div id="overlay" onclick="closeSidebar()"></div>

  <header class="topbar">
    <div class="tb-brand">
      <button class="menu-btn" onclick="toggleSidebar()">☰</button>
      <div class="tb-logo">🌾</div>
      <div class="tb-name">Smart<em>Farm</em></div>
    </div>
    <div class="tb-right">
      <div class="live-pill"><div class="live-dot"></div>LIVE</div>
      <div class="tb-time" id="sf-clock">--:--</div>
      <div class="tb-avatar" title="${s.name}">${s.name[0].toUpperCase()}</div>
    </div>
  </header>

  <aside class="sidebar" id="sf-sidebar">
    <div class="sb-farm">
      <div class="sb-farm-tag">Active farm</div>
      <div class="sb-farm-name">${s.farm || 'My Farm'}</div>
      <div class="sb-farm-loc">${s.name} · ${s.role}</div>
    </div>

    <div class="sb-section">Overview</div>
    ${navHTML}

    <div class="sb-footer">
      <div class="sb-user">
        <div class="sb-av">${s.name[0].toUpperCase()}</div>
        <div>
          <div class="sb-uname">${s.name}</div>
          <div class="sb-role">${s.role}</div>
        </div>
      </div>
      <button class="sb-logout" onclick="SF.logout()">↩ Sign out</button>
    </div>
  </aside>

  <div class="content" id="sf-content">
    <div class="page active" id="page-content">
  `;

  // Start clock
  function tick() {
    const el = document.getElementById('sf-clock');
    if (el) el.textContent = new Date().toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

function toggleSidebar() {
  document.getElementById('sf-sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sf-sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}
