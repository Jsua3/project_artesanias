// Collection grid — piezas organized by category.
const PIEZAS = [
  { id:1, name:'Vasija de barro quemado', maestro:'Doña Rosa Elvira', town:'Pijao', price:180000, category:'Alfarería', img:'../../assets/placeholder-vasija.svg', status:'available' },
  { id:2, name:'Ruana de lana virgen',    maestro:'Dña Carmen Tulia',  town:'Salento', price:320000, category:'Tejido', img:'../../assets/placeholder-tejido.svg', status:'lowstock' },
  { id:3, name:'Cesto en fique y guadua', maestro:'Don Hernán Ospina', town:'Filandia', price:145000, category:'Guadua', img:'../../assets/placeholder-vasija.svg', status:'available' },
  { id:4, name:'Camino de mesa tejido',   maestro:'Doña Ana Lucía',    town:'Circasia', price:95000,  category:'Textil', img:'../../assets/placeholder-tejido.svg', status:'available' },
  { id:5, name:'Cuenco torneado',         maestro:'Don Javier Correa', town:'Calarcá',  price:72000,  category:'Madera', img:'../../assets/placeholder-vasija.svg', status:'available' },
  { id:6, name:'Tapete urdido a mano',    maestro:'Doña Gloria Mejía', town:'Armenia',  price:420000, category:'Textil', img:'../../assets/placeholder-tejido.svg', status:'sold' },
];

const fmtPrice = (n) => '$ ' + n.toLocaleString('es-CO');

const CATEGORY_CLASS = {
  'Alfarería': 'cat-clay', 'Guadua': 'cat-clay',
  'Tejido': 'cat-sage', 'Textil': 'cat-mauve', 'Madera': 'cat-ember'
};

const PieceCard = ({ p, onClick }) => {
  const ref = React.useRef(null);
  const reduced = React.useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const onMove = (e) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -6;
    const ry = (px - 0.5) *  6;
    ref.current.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ''; };
  return (
    <article className="piece" ref={ref} onClick={() => onClick(p)} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="piece__imgWrap">
        <img src={p.img} alt={p.name}/>
        <span className={`piece__cat chip-cat ${CATEGORY_CLASS[p.category]||''}`}>{p.category}</span>
        {p.status === 'sold' && <span className="piece__sold">Adoptada</span>}
      </div>
      <div className="piece__body">
        <h3 className="piece__title">{p.name}</h3>
        <div className="piece__meta">
          <em>{p.maestro}</em> <span className="piece__dot">·</span> {p.town}
        </div>
        <div className="piece__foot">
          <div className="price-cop">{fmtPrice(p.price)}</div>
          {p.status === 'available' && <div className="piece__stock"><span className="dot"></span>Disponible</div>}
          {p.status === 'lowstock' && <div className="piece__stock piece__stock--warn"><span className="dot"></span>Última</div>}
        </div>
      </div>
    </article>
  );
};

const Collection = ({ onOpen }) => {
  const [filter, setFilter] = React.useState('Todas');
  const categories = ['Todas','Alfarería','Tejido','Guadua','Textil','Madera'];
  const shown = filter === 'Todas' ? PIEZAS : PIEZAS.filter(p => p.category === filter);
  return (
    <section id="coleccion" className="section">
      <div className="section__head">
        <div>
          <div className="eyebrow">La colección · abril 2026</div>
          <h2 className="section__title">Del <em>taller</em> a tu casa.</h2>
        </div>
        <div className="section__filters">
          {categories.map(c => (
            <button key={c} className={`tag ${filter===c?'is-active':''}`} onClick={()=>setFilter(c)}>{c}</button>
          ))}
        </div>
      </div>
      <div className="pieces">
        {shown.map(p => <PieceCard key={p.id} p={p} onClick={onOpen}/>)}
      </div>
    </section>
  );
};
window.Collection = Collection;
window.PIEZAS = PIEZAS;
window.fmtPrice = fmtPrice;
