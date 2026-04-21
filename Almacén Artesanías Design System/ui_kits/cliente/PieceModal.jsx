// Product modal — glass-on-dark with immersive piece detail.
const PieceModal = ({ piece, onClose, onAdd }) => {
  if (!piece) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <div className="modal__grid">
          <div className="modal__img">
            <img src={piece.img} alt={piece.name}/>
          </div>
          <div className="modal__body">
            <div className="eyebrow" style={{color:'var(--moss)'}}>{piece.category} · {piece.town}</div>
            <h2 style={{fontFamily:'var(--font-display)', fontSize:38, fontWeight:600, color:'var(--coffee)', margin:'12px 0 8px', lineHeight:1.05}}>{piece.name}</h2>
            <div style={{fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--clay-deep)', fontSize:18}}>{piece.maestro}</div>
            <div className="gold-rule" style={{margin:'24px 0', width:60, display:'block'}}></div>
            <p style={{color:'var(--fg-2)', lineHeight:1.7}}>
              Torneada a mano con arcilla de la vereda. Quemada a leña dos noches.
              Cada pieza guarda las huellas del taller — las pequeñas variaciones son parte
              de su carácter, no defectos.
            </p>
            <div className="modal__specs">
              <div><div className="eyebrow">Medidas</div><div>32 × 24 cm</div></div>
              <div><div className="eyebrow">Técnica</div><div>Torno a pedal</div></div>
              <div><div className="eyebrow">Entrega</div><div>5–7 días</div></div>
            </div>
            <div className="modal__foot">
              <div>
                <div className="eyebrow">Llevar a casa</div>
                <div className="price-cop" style={{fontSize:28}}>{fmtPrice(piece.price)}</div>
              </div>
              <button className="btn btn--primary" onClick={() => onAdd(piece)}>Agregar a la bolsa</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.PieceModal = PieceModal;
