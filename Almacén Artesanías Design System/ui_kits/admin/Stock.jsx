// Stock — current inventory table + low-stock summary.
const Stock = () => {
  const stockRows = PIEZAS_ADMIN.map(p => ({
    ...p, status: stockStatus(p.stock, p.min)
  }));
  const low = stockRows.filter(r => r.status.cls !== 'disponible');
  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div className="page-title__wrap">
          <span className="eyebrow">Inventario · tiempo real</span>
          <h1 className="page-title">Stock actual</h1>
          <p className="page-subtitle">
            {low.length > 0
              ? `${low.length} pieza${low.length !== 1 ? 's' : ''} requieren atención.`
              : 'Todo en orden.'}
          </p>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          <button className="btn-ghost">
            <Icon name="file_download" />
            Exportar
          </button>
          <button className="btn-primary">
            <Icon name="add_circle_outline" />
            Registrar entrada
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Pieza</th>
              <th>SKU</th>
              <th>Maestro</th>
              <th style={{textAlign: 'right'}}>Cantidad</th>
              <th style={{textAlign: 'right'}}>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.map(r => {
              const m = getMaestro(r.artesanoId);
              return (
                <tr key={r.id} className={r.status.cls !== 'disponible' ? 'low-stock-row' : ''}>
                  <td>
                    <div style={{fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 15}}>{r.name}</div>
                    <div style={{fontSize: 12, color: 'var(--text-muted)', marginTop: 2}}>{r.category}</div>
                  </td>
                  <td className="mono" style={{color: 'var(--text-muted)', fontSize: 12}}>{r.sku}</td>
                  <td>
                    <em style={{fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--clay-deep)'}}>
                      {m?.name}
                    </em>
                  </td>
                  <td className="emphasized" style={{textAlign: 'right', fontSize: 16}}>{r.stock}</td>
                  <td className="mono" style={{textAlign: 'right', color: 'var(--text-subtle)'}}>{r.min}</td>
                  <td>
                    <span className={`status-badge ${r.status.cls}`}>{r.status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.AdminStock = Stock;
