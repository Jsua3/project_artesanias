// Shared admin data: piezas, maestros, clientes, ventas.
// Uses asset placeholders already copied into /assets.
const PIEZAS_ADMIN = [
  { id: 1, name: 'Vasija barro quemado — mediana', category: 'Barro', categoryClass: 'clay', artesanoId: 1, price: 185000, stock: 42, min: 8, sku: 'VAS-032', img: '../../assets/placeholder-vasija.svg' },
  { id: 2, name: 'Canasto guadua trenzado', category: 'Guadua', categoryClass: 'green', artesanoId: 2, price: 220000, stock: 38, min: 10, sku: 'GUA-108', img: '../../assets/placeholder-tejido.svg' },
  { id: 3, name: 'Taza torno — hoja de café', category: 'Barro', categoryClass: 'clay', artesanoId: 3, price: 68000, stock: 34, min: 12, sku: 'TZA-201', img: '../../assets/placeholder-vasija.svg' },
  { id: 4, name: 'Ruana tejida en bambú', category: 'Tejido', categoryClass: 'mauve', artesanoId: 4, price: 340000, stock: 28, min: 6, sku: 'RUA-045', img: '../../assets/placeholder-tejido.svg' },
  { id: 5, name: 'Tabla picar guayacán', category: 'Madera', categoryClass: 'ember', artesanoId: 5, price: 124000, stock: 24, min: 8, sku: 'MAD-017', img: '../../assets/placeholder-tejido.svg' },
  { id: 6, name: 'Centro mesa palma cera', category: 'Tejido', categoryClass: 'mauve', artesanoId: 6, price: 260000, stock: 21, min: 5, sku: 'PAL-009', img: '../../assets/placeholder-vasija.svg' },
  { id: 7, name: 'Portavelas barro engobe', category: 'Barro', categoryClass: 'clay', artesanoId: 1, price: 48000, stock: 4, min: 6, sku: 'VEL-112', img: '../../assets/placeholder-vasija.svg' },
  { id: 8, name: 'Cesto fique tinte natural', category: 'Tejido', categoryClass: 'mauve', artesanoId: 7, price: 156000, stock: 14, min: 4, sku: 'FIQ-088', img: '../../assets/placeholder-tejido.svg' },
  { id: 9, name: 'Maceta colgante barro', category: 'Barro', categoryClass: 'clay', artesanoId: 1, price: 92000, stock: 0, min: 6, sku: 'MAC-023', img: '../../assets/placeholder-vasija.svg' },
];

const MAESTROS_ADMIN = [
  { id: 1, name: 'Doña Rosa Elvira Cardona', oficio: 'Alfarería · barro quemado a leña', vereda: 'Vereda El Crucero', municipio: 'Pijao', anos: 42, piezas: 18, avatar: '../../assets/photo-pueblo.jpg' },
  { id: 2, name: 'Don Hernán Ospina', oficio: 'Guaduero · trenzado en fresco', vereda: 'Vereda La Cristalina', municipio: 'Filandia', anos: 38, piezas: 22, avatar: '../../assets/photo-arriero.jpg' },
  { id: 3, name: 'Taller La Tulia', oficio: 'Torno alfarero', vereda: 'Centro', municipio: 'Pijao', anos: 15, piezas: 9, avatar: '../../assets/photo-iglesia.jpg' },
  { id: 4, name: 'Doña Fabiola Herrera', oficio: 'Telar de pie · lana y bambú', vereda: 'Vereda La Julia', municipio: 'Salento', anos: 35, piezas: 14, avatar: '../../assets/photo-cocora.jpg' },
  { id: 5, name: 'Don Arcángel Zuluaga', oficio: 'Maderas locales · tallado', vereda: 'Vereda San Antonio', municipio: 'Calarcá', anos: 48, piezas: 11, avatar: '../../assets/photo-pueblo.jpg' },
  { id: 6, name: 'Taller Cocora', oficio: 'Palma de cera · trenzado', vereda: 'Valle del Cocora', municipio: 'Salento', anos: 12, piezas: 7, avatar: '../../assets/photo-cocora.jpg' },
];

const CLIENTES_ADMIN = [
  { id: 'C001', name: 'Mariana Restrepo', email: 'mariana.r@correo.co', tel: '+57 315 284 9921', compras: 4 },
  { id: 'C002', name: 'Andrés Valencia', email: 'a.valencia@estudio.co', tel: '+57 300 129 4482', compras: 2 },
  { id: 'C003', name: 'Interiores Alba', email: 'studio@alba.co', tel: '+57 604 885 1200', compras: 9 },
  { id: 'C004', name: 'Claudia Franco', email: 'claudia@correo.co', tel: '+57 311 722 6634', compras: 1 },
  { id: 'C005', name: 'Javier Toro', email: 'javi.toro@correo.co', tel: '+57 322 441 7788', compras: 3 },
];

const VENTAS_ADMIN = [
  { id: 2041, fecha: '18/04/2026 10:42', cliente: 'Mariana Restrepo', items: 2, total: 420000, estado: 'COMPLETADA' },
  { id: 2040, fecha: '18/04/2026 09:18', cliente: 'Cliente invitado', items: 1, total: 185000, estado: 'COMPLETADA' },
  { id: 2039, fecha: '17/04/2026 17:55', cliente: 'Interiores Alba', items: 6, total: 1820000, estado: 'COMPLETADA' },
  { id: 2038, fecha: '17/04/2026 14:10', cliente: 'Javier Toro', items: 1, total: 124000, estado: 'PENDIENTE' },
  { id: 2037, fecha: '17/04/2026 11:02', cliente: 'Claudia Franco', items: 2, total: 260000, estado: 'COMPLETADA' },
  { id: 2036, fecha: '16/04/2026 18:24', cliente: 'Andrés Valencia', items: 1, total: 340000, estado: 'ANULADA' },
  { id: 2035, fecha: '16/04/2026 12:09', cliente: 'Mariana Restrepo', items: 3, total: 548000, estado: 'COMPLETADA' },
];

const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const getMaestro = (id) => MAESTROS_ADMIN.find(m => m.id === id);
const stockStatus = (qty, min) => {
  if (qty === 0) return { label: 'Sin stock', cls: 'sin-stock' };
  if (qty <= min) return { label: 'Stock bajo', cls: 'stock-bajo' };
  return { label: 'Disponible', cls: 'disponible' };
};

Object.assign(window, {
  PIEZAS_ADMIN, MAESTROS_ADMIN, CLIENTES_ADMIN, VENTAS_ADMIN,
  fmtCOP, getMaestro, stockStatus
});
