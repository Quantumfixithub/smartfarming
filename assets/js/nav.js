// ============================================================
// nav.js — Shared sidebar + topbar injected into every page
// ============================================================

function buildNav(pageTitle, activePage) {
  const s = SF.session();
  if (!s) return;

  const mods = SF.getModules();
  const isActive = slug => mods.find(m => m.slug === slug)?.active !== false;

  const navItems = [
    { href:'dashboard.html', icon:'⊞', label:'Dashboard', key:'dashboard' },
    isActive('livestock') ? { href:'livestock.html', icon:'🐄', label:'Livestock', key:'livestock' } : null,
    isActive('crops')     ? { href:'crops.html',     icon:'🌾', label:'Crops',     key:'crops'     } : null,
    isActive('executive') ? { href:'executive.html', icon:'📊', label:'Executive', key:'executive' } : null,
    s.role === 'admin' ? { href:'admin.html', icon:'⚙', label:'Modules', key:'admin' } : null,
  ].filter(Boolean);

  const navHTML = navItems.map(n => `
    <a href="${n.href}" class="nav-link ${activePage === n.key ? 'active' : ''}">
      <span class="nav-icon">${n.icon}</span>
      <span>${n.label}</span>
    </a>`).join('');

  document.getElementById('app-shell').innerHTML = `
  <!-- Overlay -->
  <div id="overlay" onclick="closeSidebar()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:40"></div>

  <!-- Sidebar -->
  <aside id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">🌾</div>
      <div>
        <div class="logo-title">SmartFarm</div>
        <div class="logo-sub">Smart Farming</div>
      </div>
    </div>
    <div class="sidebar-user">
      <div class="user-avatar">${s.name[0].toUpperCase()}</div>
      <div>
        <div class="user-name">${s.name}</div>
        <div class="user-role">${s.role}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group-label">Menu</div>
      ${navHTML}
    </nav>
    <div class="sidebar-footer">
      <button onclick="SF.logout()" class="logout-btn">↩ Logout</button>
    </div>
  </aside>

  <!-- Main -->
  <div class="main-wrap">
    <header class="topbar">
      <button onclick="toggleSidebar()" class="menu-btn">☰</button>
      <h1 class="topbar-title">${pageTitle}</h1>
      <div class="topbar-date">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
    </header>
    <main class="page-content" id="page-content">
  `;
}

function closeShell() {
  document.getElementById('page-content').insertAdjacentHTML('afterend','</main></div>');
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  const open = sb.classList.toggle('open');
  ov.style.display = open ? 'block' : 'none';
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').style.display = 'none';
}
