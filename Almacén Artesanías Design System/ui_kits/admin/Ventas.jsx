// Ventas — tabular sales register.
const Ventas = () => {
  const total = VENTAS_ADMIN.filter(v => v.estado === 'COMPLETADA').reduce((s, v) => s + v.total, 0);
  const count = VENTAS_ADMIN.filter(v => v.estado === 'COMPLETADA').length;
  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div className="page-title__wrap">
          <span className="eyebrow">Registro · abril 2026</span>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">Cada pieza adoptada. {count} ventas este mes · {fmtCOP(total)}.</p>
        </div>
        <button className="btn-primary">
          <Icon name="add_shopping_cart" />
          Nueva venta
        </button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width: 80}}>Ticket</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th style={{textAlign: 'right'}}>Piezas</th>
              <th style={{textAlign: 'right'}}>Total</th>
              <th>Estado</th>
              <th style={{width: 60}}></th>
            </tr>
          </thead>
          <tbody>
            {VENTAS_ADMIN.map(v => (
              <tr key={v.id}>
                <td className="mono" style={{color: 'var(--text-muted)'}}>#{v.id}</td>
                <td className="mono" style={{color: 'var(--text-muted)', fontSize: 13}}>{v.fecha}</td>
                <td>
                  <div style={{fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 15}}>{v.cliente}</div>
                </td>
                <td className="mono" style={{textAlign: 'right'}}>{v.items}</td>
                <td className="emphasized" style={{textAlign: 'right', color: 'var(--clay-deep)'}}>{fmtCOP(v.total)}</td>
                <td>
                  <span className={`status-badge ${v.estado.toLowerCase()}`}>{v.estado}</span>
                </td>
                <td>
                  {v.estado === 'COMPLETADA' && (
                    <button className="icon-btn danger" title="Anular">
                      <Icon name="cancel" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.AdminVentas = Ventas;
