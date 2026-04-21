// Dashboard — KPIs, "Top 10 por Stock" bar chart, and recent activity feed.
const DASHBOARD_STATS = [
  { label: 'Artesanías', value: 128, icon: 'palette', color: 'terracotta', trend: '+12 este mes' },
  { label: 'Categorías', value: 9, icon: 'category', color: 'mauve', trend: null },
  { label: 'En Stock', value: 847, icon: 'warehouse', color: 'sage', trend: '+3.4% vs mes anterior' },
  { label: 'Stock Bajo', value: 6, icon: 'warning_amber', color: 'danger', trend: 'atención' },
];

const TOP_STOCK = [
  { name: 'Vasija barro quemado — mediana', qty: 42, maestro: 'Doña Rosa Elvira' },
  { name: 'Canasto guadua trenzado', qty: 38, maestro: 'Don Hernán' },
  { name: 'Taza torno — hoja de café', qty: 34, maestro: 'Taller La Tulia' },
  { name: 'Ruana tejida bambú', qty: 28, maestro: 'Doña Fabiola' },
  { name: 'Tabla picar guayacán', qty: 24, maestro: 'Don Arcángel' },
  { name: 'Centro mesa palma cera', qty: 21, maestro: 'Taller Cocora' },
  { name: 'Portavelas barro engobe', qty: 18, maestro: 'Doña Rosa Elvira' },
  { name: 'Cesto fique tinte natural', qty: 14, maestro: 'Doña Graciela' },
  { name: 'Bandeja guadua laminada', qty: 11, maestro: 'Don Hernán' },
  { name: 'Maceta colgante barro', qty: 8, maestro: 'Taller Pijao' },
];

const ACTIVITY = [
  { kind: 'sale', text: 'Venta #2041 · COP 420.000', sub: 'Mariana Restrepo — 2 piezas', time: 'hace 12 min' },
  { kind: 'in', text: 'Entrada +12 uds · Canasto guadua trenzado', sub: 'Don Hernán · Filandia', time: 'hace 48 min' },
  { kind: 'out', text: 'Salida −3 uds · Vasija barro quemado', sub: 'Ajuste por rotura durante empaque', time: 'hace 2 h' },
  { kind: 'sale', text: 'Venta #2040 · COP 185.000', sub: 'Cliente invitado — retiro en tienda', time: 'hace 3 h' },
  { kind: 'in', text: 'Entrada +8 uds · Taza torno hoja café', sub: 'Taller La Tulia · Pijao', time: 'hace 5 h' },
];

const Dashboard = () => {
  const [animated, setAnimated] = React.useState(false);
  const maxQty = Math.max(...TOP_STOCK.map(t => t.qty));
  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div className="page-title__wrap">
          <span className="eyebrow">Panel · 18 de abril, 2026</span>
          <h1 className="page-title">Buenos días, Lucía.</h1>
          <p className="page-subtitle">Resumen del taller. Lo esencial, en calma.</p>
        </div>
        <button className="btn-primary">
          <Icon name="add" />
          Registrar entrada
        </button>
      </div>

      <div className="stats-grid">
        {DASHBOARD_STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon-wrap ${s.color}`}>
              <Icon name={s.icon} />
            </div>
            <div className="stat-content">
              <p className="stat-value">{s.value}</p>
              <p className="stat-label">{s.label}</p>
              {s.trend && (
                <div className={`stat-trend ${s.label === 'Stock Bajo' ? 'down' : ''}`}>
                  {s.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top 10 artesanías por stock</h3>
            <span className="eyebrow">Abril 2026</span>
          </div>
          <div className="chart-body">
            <div className="bar-chart">
              {TOP_STOCK.map((t, i) => (
                <div key={i} className="bar-row">
                  <div className="bar-row__label">{t.name}</div>
                  <div className="bar-row__track">
                    <div className="bar-row__fill"
                         style={{ width: animated ? `${(t.qty / maxQty) * 100}%` : '0%',
                                  transitionDelay: `${i * 60}ms` }} />
                  </div>
                  <div className="bar-row__val">{t.qty}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="chart-header">
            <h3>Actividad reciente</h3>
          </div>
          <div className="activity-list">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-icon ${a.kind}`}>
                  <Icon name={a.kind === 'sale' ? 'point_of_sale' : a.kind === 'in' ? 'arrow_downward' : 'arrow_upward'} />
                </div>
                <div className="activity-body">
                  <p>{a.text}</p>
                  <em>{a.sub}</em>
                </div>
                <div className="activity-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.AdminDashboard = Dashboard;
