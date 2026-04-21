// Hero — full-bleed real photography (Cocora / Filandia / arriero / iglesia) behind glass panels.
// Healthy responsive motion: gentle parallax (max ±8px), respects prefers-reduced-motion.
const ClienteHero = () => {
  const heroRef = React.useRef(null);
  const [slide, setSlide] = React.useState(0);
  const photos = [
    '../../assets/photo-cocora.jpg',
    '../../assets/photo-pueblo.jpg',
    '../../assets/photo-iglesia.jpg',
    '../../assets/photo-arriero.jpg',
  ];
  const captions = [
    { place: 'Valle del Cocora', sub: 'palma de cera · cuna' },
    { place: 'Filandia, Quindío', sub: 'bahareque al amanecer' },
    { place: 'Salento, Quindío', sub: 'iglesia de bahareque' },
    { place: 'Arrieros cafeteros', sub: 'oficio que camina' },
  ];

  // Auto-rotate backdrop, respecting reduced motion
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setSlide(s => (s + 1) % photos.length), 6000);
    return () => clearInterval(id);
  }, []);

  // Parallax mouse-move (subtle, healthy)
  React.useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = null;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', px);
        el.style.setProperty('--py', py);
        raf = null;
      });
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero__photos" aria-hidden="true">
        {photos.map((src, i) => (
          <div key={src}
               className={`hero__photo ${i === slide ? 'is-active' : ''}`}
               style={{ backgroundImage: `url(${src})` }}/>
        ))}
        <div className="hero__tint"></div>
        <div className="hero__grain"></div>
      </div>

      <div className="hero__grid">
        <div className="hero__copy">
          <div className="eyebrow hero__eyebrow">Eje Cafetero · Colombia</div>
          <h1 className="display-lg hero__title">
            Piezas con nombre,<br/>
            con vereda,<br/>
            <em>con neblina.</em>
          </h1>
          <div className="gold-rule" style={{width:'72px', margin:'0 0 24px', display:'block'}}></div>
          <p className="lead hero__lead">
            Compra directo del taller. Cada maestra, cada maestro, cuenta su historia —
            y llevas a casa algo con territorio.
          </p>
          <div className="hero__ctas">
            <a href="#coleccion" className="btn btn--primary">Pasa al taller</a>
            <a href="#maestros" className="btn btn--text btn--text-light">Conoce a los maestros →</a>
          </div>
        </div>

        <div className="hero__side">
          <div className="hero__caption">
            <div className="eyebrow" style={{color:'var(--gold)'}}>En el objetivo</div>
            <div className="hero__captionTitle">{captions[slide].place}</div>
            <div className="hero__captionSub"><em>{captions[slide].sub}</em></div>
            <div className="hero__dots">
              {photos.map((_, i) => (
                <button key={i} className={`hero__dot ${i===slide?'is-on':''}`} onClick={()=>setSlide(i)} aria-label={`foto ${i+1}`}/>
              ))}
            </div>
          </div>

          <div className="hero__meta">
            <div><div className="hero__metaNum">48</div><div className="eyebrow" style={{color:'var(--bone)'}}>maestros</div></div>
            <div className="hero__metaDiv"></div>
            <div><div className="hero__metaNum">7</div><div className="eyebrow" style={{color:'var(--bone)'}}>municipios</div></div>
            <div className="hero__metaDiv"></div>
            <div><div className="hero__metaNum">1.820</div><div className="eyebrow" style={{color:'var(--bone)'}}>piezas</div></div>
          </div>
        </div>
      </div>
    </section>
  );
};
window.ClienteHero = ClienteHero;
