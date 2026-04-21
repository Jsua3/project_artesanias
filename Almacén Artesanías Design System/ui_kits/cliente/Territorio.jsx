// Territorio — editorial block evoking Filandia / Salento mood + footer.
const Territorio = () => (
  <section className="section section--dark">
    <div className="territorio">
      <div className="territorio__copy">
        <div className="eyebrow" style={{color:'var(--gold)'}}>El territorio</div>
        <h2 style={{fontFamily:'var(--font-display)', fontSize:'clamp(2.2rem, 4vw, 3.5rem)', color:'var(--cream)', fontWeight:600, lineHeight:1.05, margin:'16px 0 24px'}}>
          Quindío <em style={{color:'var(--clay-light)'}}>amanece en neblina.</em>
        </h2>
        <p style={{color:'rgba(245,240,232,0.7)', maxWidth:480, lineHeight:1.75}}>
          Filandia, Salento, Pijao, Circasia. Pueblos de bahareque sobre montañas cafeteras.
          Palma de cera, guadua, el murmullo del Cocora al amanecer. Este es el lugar
          donde nacen las piezas que llegan a tu casa.
        </p>
        <div className="territorio__places">
          {['Filandia','Salento','Pijao','Circasia','Calarcá','Armenia'].map(t => (
            <span key={t} className="territorio__place">{t}</span>
          ))}
        </div>
      </div>
      <div className="territorio__map" aria-hidden="true">
        <svg viewBox="0 0 300 300" width="100%" style={{maxWidth:360}}>
          <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(201,162,83,0.25)" strokeWidth="0.5"/>
          <circle cx="150" cy="150" r="90"  fill="none" stroke="rgba(201,162,83,0.2)" strokeWidth="0.5"/>
          <circle cx="150" cy="150" r="60"  fill="none" stroke="rgba(201,162,83,0.15)" strokeWidth="0.5"/>
          {[
            [110, 90, 'Filandia'], [180, 120, 'Salento'], [90, 170, 'Circasia'],
            [170, 200, 'Calarcá'], [220, 160, 'Pijao'], [140, 230, 'Armenia']
          ].map(([x,y,n]) => (
            <g key={n}>
              <circle cx={x} cy={y} r="3" fill="#C9A253"/>
              <circle cx={x} cy={y} r="10" fill="none" stroke="#C9A253" strokeWidth="0.5" opacity="0.4"/>
              <text x={x+10} y={y+4} fill="#F5F0E8" fontSize="10" fontFamily="Outfit" opacity="0.8">{n}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="footer">
    <div className="footer__inner">
      <div className="footer__brand">
        <div className="brand-wordmark" style={{fontSize:20}}>Almacén<br/>Artesanías</div>
        <div className="gold-rule" style={{display:'block', margin:'12px 0', width:40}}></div>
        <div className="caption" style={{color:'var(--fg-2)', fontStyle:'italic', fontFamily:'var(--font-serif)'}}>
          Donde la tradición encuentra su camino.
        </div>
      </div>
      <div className="footer__cols">
        <div>
          <div className="eyebrow">Explorar</div>
          <a href="#">Colecciones</a>
          <a href="#">Maestros</a>
          <a href="#">Territorio</a>
          <a href="#">Oficios</a>
        </div>
        <div>
          <div className="eyebrow">Almacén</div>
          <a href="#">Historia</a>
          <a href="#">Talleres REBBECA</a>
          <a href="#">Prensa</a>
        </div>
        <div>
          <div className="eyebrow">Ayuda</div>
          <a href="#">Envíos</a>
          <a href="#">Devoluciones</a>
          <a href="#">Contacto</a>
        </div>
      </div>
    </div>
    <div className="footer__base">
      <div className="caption">Armenia, Quindío · Colombia</div>
      <div className="caption">© 2026 Almacén Artesanías</div>
    </div>
  </footer>
);

window.Territorio = Territorio;
window.Footer = Footer;
