// Header — glassmorphism on scroll. Transparent by default.
const ClienteHeader = ({ cartCount = 2, onCart }) => {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const links = ['Colecciones', 'Maestros', 'Territorio', 'Oficio'];
  return (
    <header className={`cliente-header ${scrolled ? 'is-glass' : ''}`}>
      <div className="cliente-header__inner">
        <a href="#" className="cliente-header__brand">
          <svg width="32" height="32" viewBox="0 0 50 50" fill="none">
            <path d="M25 7C25 7 17 15 17 25C17 35 25 43 25 43C25 43 33 35 33 25C33 15 25 7 25 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <circle cx="25" cy="25" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          <span>ALMACÉN<br/>ARTESANÍAS</span>
        </a>
        <nav className="cliente-header__nav">
          {links.map(l => <a key={l} href="#">{l}</a>)}
        </nav>
        <div className="cliente-header__actions">
          <button className="icon-btn" aria-label="buscar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </button>
          <button className="icon-btn" aria-label="cuenta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
          </button>
          <button className="icon-btn icon-btn--cart" aria-label="bolsa" onClick={onCart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
            {cartCount > 0 && <span className="icon-btn__badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
window.ClienteHeader = ClienteHeader;
