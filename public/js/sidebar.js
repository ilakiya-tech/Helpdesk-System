// sidebar.js – Shared sidebar navigation for all dashboards

const Sidebar = {
  adminLinks: [
    { href: 'admin.html', label: 'Dashboard', icon: '📊' },
    { href: 'admin-users.html', label: 'Users', icon: '👥' },
    { href: 'admin-staff.html', label: 'Staff', icon: '🛠️' },
    { href: 'admin.html#tickets', label: 'Tickets', icon: '🎫' },
    { href: 'admin-holidays.html', label: 'Holidays', icon: '📅' },
    { href: 'admin-report.html', label: 'Reports', icon: '📈' },
  ],
  staffLinks: [
    { href: 'staff.html', label: 'Dashboard', icon: '📊' },
    { href: 'staff.html#tickets', label: 'My Tickets', icon: '🎫' },
    { href: 'staff.html#availability', label: 'Leave Status', icon: '🏖️' },
  ],
  clientLinks: [
    { href: 'client.html', label: 'Dashboard', icon: '📊' },
    { href: 'client.html#tickets', label: 'My Tickets', icon: '🎫' },
    { href: 'create-ticket.html', label: 'Raise Ticket', icon: '➕' },
  ],

  render(role, activePage) {
    const links = role === 'admin' ? this.adminLinks
      : role === 'staff' ? this.staffLinks : this.clientLinks;
    const roleLabel = role === 'admin' ? 'Admin' : role === 'staff' ? 'Staff' : 'Consumer';
    const username = localStorage.getItem('username') || '';

    return `
      <div class="sidebar bg-primary text-white d-flex flex-column" id="app-sidebar">
        <div class="sidebar-header p-3 border-bottom border-light border-opacity-25">
          <div class="d-flex align-items-center gap-2">
            <div class="sidebar-logo bg-white text-primary rounded d-flex align-items-center justify-content-center fw-bold" style="width:40px;height:40px;">CC</div>
            <div>
              <div class="fw-bold">Carbochem</div>
              <small class="opacity-75">${roleLabel} Portal</small>
            </div>
          </div>
        </div>
        <nav class="sidebar-nav flex-grow-1 p-2">
          ${links.map(l => {
            const isActive = activePage === l.href || (activePage && l.href.startsWith(activePage.split('#')[0]) && activePage.includes(l.href.split('#')[1] || '___'));
            const active = (activePage === l.href || window.location.pathname.endsWith(l.href.split('#')[0].replace(/^\//,''))) ? 'active' : '';
            return `<a href="${l.href}" class="sidebar-link ${active} d-flex align-items-center gap-2 px-3 py-2 rounded text-white text-decoration-none mb-1">
              <span>${l.icon}</span><span>${l.label}</span>
            </a>`;
          }).join('')}
        </nav>
        <div class="sidebar-footer p-3 border-top border-light border-opacity-25">
          <small class="d-block opacity-75 mb-2">Logged in as <strong>${username}</strong></small>
          <button class="btn btn-outline-light btn-sm w-100" onclick="logout()">Logout</button>
        </div>
      </div>`;
  },

  inject(role, activePage, targetId = 'sidebar-container') {
    const el = document.getElementById(targetId);
    if (el) {
      el.innerHTML = this.render(role, activePage);
      // Highlight active link
      el.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href').split('#')[0];
        const current = window.location.pathname.split('/').pop() || 'admin.html';
        const page = (activePage || current).split('#')[0];
        if (href === page || href.endsWith(page)) link.classList.add('active');
      });
    }
  },

  styles: `
    .layout-with-sidebar { display: flex; min-height: calc(100vh - 0px); }
    .sidebar { width: 240px; min-width: 240px; flex-shrink: 0; }
    .sidebar-link:hover { background: rgba(255,255,255,0.15); }
    .sidebar-link.active { background: rgba(255,255,255,0.25); font-weight: 600; }
    .main-content { flex: 1; overflow-x: auto; }
    @media (max-width: 768px) {
      .layout-with-sidebar { flex-direction: column; }
      .sidebar { width: 100%; min-width: 100%; }
      .sidebar-nav { display: flex; flex-wrap: wrap; gap: 4px; }
      .sidebar-link { flex: 1 1 auto; font-size: 0.85rem; }
    }
  `
};

window.Sidebar = Sidebar;
