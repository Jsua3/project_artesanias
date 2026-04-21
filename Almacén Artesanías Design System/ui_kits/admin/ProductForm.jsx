// ProductForm — modal for creating / editing a pieza.
const ProductForm = ({ piece, onClose, onSave }) => {
  const isNew = !piece;
  const [form, setForm] = React.useState(piece || {
    name: '', category: 'Barro', artesanoId: 1, price: 0, stock: 0, min: 5, sku: ''
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <span className="eyebrow">{isNew ? 'Nueva pieza' : 'Editar pieza'}</span>
            <h2 className="modal__title">{isNew ? 'Registrar artesanía' : form.name}</h2>
            <p className="modal__sub">Cada pieza con nombre. Cada maestro con vereda.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="modal__body">
          <div className="form-grid">
            <div className="form-field full">
              <label>Nombre de la pieza</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)}
                     placeholder="Ej: Vasija barro quemado — mediana" />
            </div>
            <div className="form-field">
              <label>Categoría</label>
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                <option>Barro</option><option>Guadua</option>
                <option>Tejido</option><option>Madera</option>
              </select>
            </div>
            <div className="form-field">
              <label>Maestro</label>
              <select value={form.artesanoId}
                      onChange={(e) => update('artesanoId', parseInt(e.target.value))}>
                {MAESTROS_ADMIN.map(m => (
                  <option key={m.id} value={m.id}>{m.name} · {m.municipio}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Precio (COP)</label>
              <input type="number" value={form.price}
                     onChange={(e) => update('price', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-field">
              <label>SKU</label>
              <input value={form.sku} onChange={(e) => update('sku', e.target.value)}
                     placeholder="VAS-032" />
            </div>
            <div className="form-field">
              <label>Stock inicial</label>
              <input type="number" value={form.stock}
                     onChange={(e) => update('stock', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-field">
              <label>Mínimo alerta</label>
              <input type="number" value={form.min}
                     onChange={(e) => update('min', parseInt(e.target.value) || 0)} />
            </div>
            <div className="form-field full">
              <label>Notas del oficio (opcional)</label>
              <textarea placeholder="Arcilla de la vereda El Crucero. Quemada a leña dos noches."></textarea>
            </div>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(form)}>
            {isNew ? 'Crear pieza' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

window.AdminProductForm = ProductForm;
