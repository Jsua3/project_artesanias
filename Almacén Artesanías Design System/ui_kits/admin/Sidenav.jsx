// Sidenav — recreates the Angular shell navigation with ancestral admin tokens.
const Sidenav = ({ current, onNavigate, user }) => {
  const items = [
    { section: null, items: [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    ]},
    { section: 'Catálogo', items: [
      { id: 'artesanos', icon: 'person_pin', label: 'Artesanos' },
      { id: 'categorias', icon: 'category', label: 'Categorías' },
      { id: 'productos', icon: 'palette', label: 'Artesanías' },
    ]},
    { section: 'Ventas', items: [
      { id: 'clientes', icon: 'people_outline', label: 'Clientes' },
      { id: 'ventas', icon: 'point_of_sale', label: 'Ventas' },
    ]},
    { section: 'Inventario', items: [
      { id: 'stock', icon: 'warehouse', label: 'Stock' },
      { id: 'entradas', icon: 'add_circle_outline', label: 'Entradas' },
      { id: 'salidas', icon: 'remove_circle_outline', label: 'Salidas' },
    ]},
    { section: 'Admin', items: [
      { id: 'reportes', icon: 'assessment', label: 'Reportes' },
    ]},
  ];

  return (
    <aside className="sidenav">
      <div className="sidenav__brand" onClick={() => onNavigate('dashboard')}>
        <div className="sidenav__brand-icon">
          <svg viewBox="0 0 40 40" width="24" height="24" fill="none">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.35"/>
            <path d="M20 8C20 8 14 14 14 20C14 26 20 32 20 32C20 32 26 26 26 20C26 14 20 8 20 8Z" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <div className="sidenav__brand-name">Artesanías</div>
          <span className="sidenav__brand-sub">Sistema de inventario</span>
        </div>
      </div>

      <div className="sidenav__scroll">
        {items.map((group, gi) => (
          <React.Fragment key={gi}>
            {group.section && <p className="nav-section">{group.section}</p>}
            {group.items.map(it => (
              <a key={it.id}
                 className={`nav-link ${current === it.id ? 'active' : ''}`}
                 onClick={(e) => { e.preventDefault(); onNavigate(it.id); }}>
              <Icon name={it.icon} />
                <span>{it.label}</span>
              </a>
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="sidenav__footer">
        <div className="user-card">
          <div className="user-avatar">{user.initial}</div>
          <div className="user-info">
            <p className="username">{user.name}</p>
            <p className="role">{user.role}</p>
          </div>
          <Icon name="edit" size={16} className="edit-icon" />
        </div>
        <button className="logout-btn">
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

window.AdminSidenav = Sidenav;
