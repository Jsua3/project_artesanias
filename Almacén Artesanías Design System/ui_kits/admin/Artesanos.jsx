// Artesanos — editorial cards for each maestro registered in the system.
const Artesanos = () => {
  return (
    <div className="page-container animate-in">
      <div className="page-header">
        <div className="page-title__wrap">
          <span className="eyebrow">Maestros · {MAESTROS_ADMIN.length} activos</span>
          <h1 className="page-title">Artesanos</h1>
          <p className="page-subtitle">Quienes hacen cada pieza. Nombre, vereda, oficio.</p>
        </div>
        <button className="btn-primary">
          <Icon name="add" />
          Nuevo artesano
        </button>
      </div>

      <div className="artesanos-grid">
        {MAESTROS_ADMIN.map(m => (
          <div key={m.id} className="artesano-card">
            <div className="artesano-card__avatar"
                 style={{ backgroundImage: `url(${m.avatar})` }} />
            <div className="artesano-card__body">
              <h3>{m.name}</h3>
              <div className="artesano-card__oficio">{m.oficio}</div>
              <div className="artesano-card__meta">
                <div className="row">
                  <Icon name="place" />
                  <span>{m.vereda}, {m.municipio}</span>
                </div>
                <div className="row">
                  <Icon name="schedule" />
                  <span>{m.anos} años de oficio</span>
                </div>
              </div>
              <div className="artesano-card__pieces">
                <div>
                  <span className="count">{m.piezas}</span>
                  <span className="label">piezas</span>
                </div>
                <button className="icon-btn">
                  <Icon name="arrow_forward" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.AdminArtesanos = Artesanos;
