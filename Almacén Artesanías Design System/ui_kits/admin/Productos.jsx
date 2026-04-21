// Productos (Artesanías) — grid of pieces with search + category filters.
const Productos = ({ onOpenForm }) => {
  const [search, setSearch] = React.useState('');
  const [cat, setCat] = React.useState('Todas');
  const cats = ['Todas', 'Barro', 'Guadua', 'Tejido', 'Madera'];

  const filtered = PIEZAS_ADMIN.filter(p => {
    const mCat = cat === 'Todas' || p.category === cat;
    const mSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
                           || p.sku.toLowerCase().includes(search.toLowerCase());
    return mCat && mSearch;
  });

  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div className="page-title__wrap">
          <span className="eyebrow">Catálogo · {PIEZAS_ADMIN.length} piezas</span>
          <h1 className="page-title">Artesanías</h1>
          <p className="page-subtitle">Piezas del taller. Cada una con nombre y vereda.</p>
        </div>
        <button className="btn-primary" onClick={() => onOpenForm(null)}>
          <Icon name="add" />
          Nueva artesanía
        </button>
      </div>

      <div className="toolbar-row">
        <div className="search-input">
          <Icon name="search" />
          <input placeholder="Buscar por nombre o SKU…" value={search}
                 onChange={(e) => setSearch(e.target.value)} />
        </div>
        {cats.map(c => (
          <button key={c} className={`filter-pill ${cat === c ? 'active' : ''}`}
                  onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {filtered.map(p => {
          const low = p.stock > 0 && p.stock <= p.min;
          const out = p.stock === 0;
          const m = getMaestro(p.artesanoId);
          return (
            <div key={p.id} className={`product-card ${low || out ? 'low-stock-card' : ''}`}>
              <div className="product-card__image" onClick={() => onOpenForm(p)}>
                <img src={p.img} alt={p.name}
                     style={{background: 'var(--bone)'}} />
                <span className="category-badge">{p.category}</span>
                {(low || out) && (
                  <span className="stock-alert-badge">
                    <Icon name="warning" />
                    {out ? 'Sin stock' : 'Stock bajo'}
                  </span>
                )}
                <div className="product-card__actions">
                  <button className="icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); onOpenForm(p); }}>
                    <Icon name="edit" />
                  </button>
                  <button className="icon-btn danger" title="Eliminar" onClick={(e) => e.stopPropagation()}>
                    <Icon name="delete" />
                  </button>
                </div>
              </div>
              <div className="product-card__body">
                <h3 className="product-card__title">{p.name}</h3>
                <div className="product-card__meta">
                  <Icon name="person" />
                  <em>{m?.name}</em>
                  <span>·</span>
                  <span>{m?.municipio}</span>
                </div>
                <div className="product-card__footer">
                  <div className="product-card__price">{fmtCOP(p.price)}</div>
                  <div className={`card-stock ${out ? 'danger' : low ? 'warning' : 'ok'}`}>
                    <Icon name="inventory_2" />
                    {p.stock} uds
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.AdminProductos = Productos;
