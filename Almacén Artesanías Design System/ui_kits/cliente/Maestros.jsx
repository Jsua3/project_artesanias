// Maestros — editorial profiles grid.
const MAESTROS = [
  { name:'Doña Rosa Elvira Gómez', town:'Pijao', vereda:'El Crucero', craft:'Alfarería · torno a pedal', years:42, quote:'El barro se deja enseñar si uno lo escucha despacio.' },
  { name:'Don Hernán Ospina',      town:'Filandia', vereda:'La Cristalina', craft:'Guadua y fique', years:35, quote:'La guadua nace recta porque busca la luz. Nosotros le ayudamos.' },
  { name:'Doña Carmen Tulia',      town:'Salento', vereda:'Boquía',     craft:'Tejido en lana virgen', years:28, quote:'Mi telar lo heredé de mi mamá, el mismo que me quiere ver en el hilo.' },
];

const MaestroCard = ({ m }) => (
  <article className="maestro">
    <div className="maestro__portrait">
      <img src="../../assets/placeholder-maestro.svg" alt={m.name}/>
      <div className="maestro__overlay"></div>
      <div className="maestro__years">
        <div className="display" style={{fontSize:44, color:'var(--warm-white)', fontWeight:700}}>{m.years}</div>
        <div className="eyebrow" style={{color:'var(--bone)'}}>años de oficio</div>
      </div>
    </div>
    <div className="maestro__body">
      <div className="eyebrow" style={{color:'var(--clay-deep)'}}>{m.town} · vereda {m.vereda}</div>
      <h3 className="maestro__name">{m.name}</h3>
      <div className="maestro__craft">{m.craft}</div>
      <blockquote className="maestro__quote">{m.quote}</blockquote>
      <a href="#" className="btn btn--text">Visita el taller →</a>
    </div>
  </article>
);

const Maestros = () => (
  <section id="maestros" className="section section--bone">
    <div className="section__head section__head--centered">
      <div className="eyebrow">Los maestros</div>
      <h2 className="section__title">Detrás de cada pieza, <em>un oficio.</em></h2>
      <p className="lead" style={{maxWidth:620, margin:'20px auto 0'}}>
        Conoce a quienes sostienen la tradición cafetera. Pasa a su taller — virtual por ahora, algún día en persona.
      </p>
    </div>
    <div className="maestros__grid">
      {MAESTROS.map(m => <MaestroCard key={m.name} m={m}/>)}
    </div>
  </section>
);
window.Maestros = Maestros;
