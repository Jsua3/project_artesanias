export interface MunicipalityEvent {
  title: string;
  dateText: string;
  place: string;
  detail: string;
}

export interface MunicipalityProfile {
  slug: string;
  name: string;
  region: string;
  shortLine: string;
  headline: string;
  summary: string;
  craftFocus: string[];
  culture: string[];
  crafts: {
    name: string;
    material: string;
    detail: string;
  }[];
  upcomingEvents: MunicipalityEvent[];
  artisans: {
    name: string;
    craft: string;
    workshop: string;
  }[];
  gallery: {
    src: string;
    alt: string;
  }[];
  stats: {
    label: string;
    value: string;
  }[];
  mapPoint: {
    x: number;
    y: number;
  };
}

const TERRITORY_IMAGES = {
  filandia: [
    '/assets/territorio/filandia/filandia3.jpg',
    '/assets/territorio/filandia/filandia4.jpg',
    '/assets/territorio/filandia/filandia5.jpeg'
  ],
  salento: [
    '/assets/territorio/salento/salento1.jpg',
    '/assets/territorio/salento/salento2.jpg',
    '/assets/photo-cocora.jpg'
  ],
  paisaje: [
    '/assets/imagenes/paisaje1.jpeg',
    '/assets/imagenes/paisaje2.jpeg',
    '/assets/imagenes/paisaje3.jpeg'
  ],
  cafe: [
    '/assets/imagenes/cafe1.jpeg',
    '/assets/photo-pueblo.jpg',
    '/assets/photo-arriero.jpg'
  ],
  taller: [
    '/assets/imagenes/artesanias.jpeg',
    '/assets/imagenes/artesanias3.jpeg',
    '/assets/imagenes/artesanias5.jpeg'
  ]
};

function galleryFor(images: string[], name: string): MunicipalityProfile['gallery'] {
  return images.map((src, index) => ({
    src,
    alt: `${name} - territorio artesanal ${index + 1}`
  }));
}

export const QUINDIO_MUNICIPALITIES: MunicipalityProfile[] = [
  {
    slug: 'armenia',
    name: 'Armenia',
    region: 'Capital del Quindio',
    shortLine: 'Ciudad taller, comercio cafetero y encuentro regional.',
    headline: 'Armenia conecta el oficio rural con la vitrina urbana.',
    summary: 'La capital concentra mercados, talleres, rutas de venta y encuentros donde las piezas del Quindio llegan a visitantes y compradores locales.',
    craftFocus: ['Textil utilitario', 'Ceramica decorativa', 'Madera urbana'],
    culture: ['Memoria cafetera en barrios y plazas', 'Comercio de oficios regionales', 'Gastronomia y relatos de arrieria'],
    crafts: [
      { name: 'Camino de mesa cafetero', material: 'Algodon y lana', detail: 'Pieza textil para mesa con patrones inspirados en surcos de cafe.' },
      { name: 'Cuenco de madera pulida', material: 'Madera local', detail: 'Objeto de uso diario trabajado con veta visible y acabado natural.' },
      { name: 'Plato mural', material: 'Arcilla esmaltada', detail: 'Ceramica decorativa para interiores con paleta tierra y verde.' }
    ],
    upcomingEvents: [
      { title: 'Mercado artesanal urbano', dateText: 'Fecha por confirmar', place: 'Centro cultural', detail: 'Muestra de talleres locales y piezas invitadas del departamento.' },
      { title: 'Ruta de cafe y oficio', dateText: 'Proxima temporada cafetera', place: 'Corredor Armenia rural', detail: 'Recorrido por fincas, cocina tradicional y demostraciones manuales.' }
    ],
    artisans: [
      { name: 'Taller Casa Guadual', craft: 'Madera y guadua', workshop: 'Armenia norte' },
      { name: 'Colectivo Hilo Urbano', craft: 'Textiles para hogar', workshop: 'Centro' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.cafe, 'Armenia'),
    stats: [{ label: 'vocacion', value: 'Capital' }, { label: 'oficios', value: '3+' }, { label: 'ruta', value: 'Urbana' }],
    mapPoint: { x: 148, y: 194 }
  },
  {
    slug: 'buenavista',
    name: 'Buenavista',
    region: 'Cordillera y miradores',
    shortLine: 'Paisaje alto, cafe especial y piezas de contemplacion.',
    headline: 'Buenavista mira el Quindio desde la altura y lo vuelve detalle.',
    summary: 'Sus miradores y fincas cafeteras inspiran piezas pequenas, sobrias y precisas, pensadas para conservar la calma de la montana.',
    craftFocus: ['Madera tallada', 'Ceramica de paisaje', 'Bordado fino'],
    culture: ['Miradores cafeteros', 'Cafe de origen', 'Vida de ladera'],
    crafts: [
      { name: 'Tabla de cafe tallada', material: 'Madera', detail: 'Tabla de servicio con borde organico y acabado aceitado.' },
      { name: 'Taza de mirador', material: 'Ceramica', detail: 'Pieza esmaltada en tonos niebla para cafe de origen.' },
      { name: 'Postal bordada', material: 'Hilo sobre lino', detail: 'Pequeno textil inspirado en horizontes de cordillera.' }
    ],
    upcomingEvents: [
      { title: 'Encuentro de cafe especial', dateText: 'Fecha por confirmar', place: 'Mirador principal', detail: 'Catas, cocina local y exhibicion de objetos para ritual de cafe.' },
      { title: 'Taller abierto de paisaje', dateText: 'Agenda en preparacion', place: 'Casas taller rurales', detail: 'Demostraciones de talla, pintura y bordado de montana.' }
    ],
    artisans: [
      { name: 'Taller Alto del Cafe', craft: 'Objetos para cafe', workshop: 'Zona rural' },
      { name: 'Manos de Mirador', craft: 'Bordado y ceramica', workshop: 'Cabecera municipal' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.paisaje, 'Buenavista'),
    stats: [{ label: 'altura', value: 'Mirador' }, { label: 'material', value: 'Madera' }, { label: 'ritmo', value: 'Pausa' }],
    mapPoint: { x: 205, y: 232 }
  },
  {
    slug: 'calarca',
    name: 'Calarca',
    region: 'Puerta de cordillera',
    shortLine: 'Arrieria, madera y memoria de camino.',
    headline: 'Calarca guarda la energia del camino y la vuelve objeto.',
    summary: 'Entre relatos de arrieria y arquitectura cafetera, Calarca sostiene oficios de madera, cuero y piezas utilitarias de casa.',
    craftFocus: ['Madera torneada', 'Cuero artesanal', 'Ceramica rustica'],
    culture: ['Arrieria', 'Casas de bahareque', 'Rutas de montana'],
    crafts: [
      { name: 'Cuenco arriero', material: 'Madera torneada', detail: 'Cuenco robusto para mesa con veta profunda.' },
      { name: 'Bitacora en cuero', material: 'Cuero y papel', detail: 'Encuadernacion artesanal para viaje y taller.' },
      { name: 'Jarra rustica', material: 'Arcilla', detail: 'Pieza de cocina con textura de barro visto.' }
    ],
    upcomingEvents: [
      { title: 'Muestra de arrieria y oficio', dateText: 'Fecha por confirmar', place: 'Plaza principal', detail: 'Relatos, musica campesina y puestos artesanales.' },
      { title: 'Taller de madera para hogar', dateText: 'Agenda en preparacion', place: 'Talleres locales', detail: 'Sesion demostrativa de torneado y pulido.' }
    ],
    artisans: [
      { name: 'Taller Correa Madera Viva', craft: 'Torneado en madera', workshop: 'Calarca centro' },
      { name: 'Oficios del Camino', craft: 'Cuero y encuadernacion', workshop: 'Sector historico' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.cafe, 'Calarca'),
    stats: [{ label: 'oficio', value: 'Madera' }, { label: 'memoria', value: 'Arrieria' }, { label: 'pieza', value: 'Utilitaria' }],
    mapPoint: { x: 178, y: 205 }
  },
  {
    slug: 'circasia',
    name: 'Circasia',
    region: 'Cultura libre',
    shortLine: 'Bahareque, textiles y espiritu comunitario.',
    headline: 'Circasia teje comunidad alrededor de la casa cafetera.',
    summary: 'El municipio aporta una sensibilidad domestica: fibras, textiles y piezas para mesa que conversan con patios, corredores y encuentros.',
    craftFocus: ['Textil de hogar', 'Cesteria', 'Pintura popular'],
    culture: ['Arquitectura de bahareque', 'Encuentros comunitarios', 'Memoria civica'],
    crafts: [
      { name: 'Camino de mesa tejido', material: 'Algodon', detail: 'Textil de mesa con franjas tierra y verde.' },
      { name: 'Canasto de mercado', material: 'Fibra natural', detail: 'Cesteria liviana para uso cotidiano.' },
      { name: 'Retablo cafetero', material: 'Madera pintada', detail: 'Objeto mural de pequeno formato.' }
    ],
    upcomingEvents: [
      { title: 'Mercado de casa y fibra', dateText: 'Fecha por confirmar', place: 'Parque principal', detail: 'Encuentro de textiles, canastos y objetos de cocina.' },
      { title: 'Recorrido de bahareque', dateText: 'Agenda en preparacion', place: 'Centro tradicional', detail: 'Ruta cultural con demostraciones de pintura y relato local.' }
    ],
    artisans: [
      { name: 'Tejedoras de la Colina', craft: 'Textil domestico', workshop: 'Circasia centro' },
      { name: 'Cesteria El Roble', craft: 'Fibra natural', workshop: 'Zona rural' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.taller, 'Circasia'),
    stats: [{ label: 'casa', value: 'Bahareque' }, { label: 'fibra', value: 'Textil' }, { label: 'tono', value: 'Comunidad' }],
    mapPoint: { x: 122, y: 150 }
  },
  {
    slug: 'cordoba',
    name: 'Cordoba',
    region: 'Sur verde',
    shortLine: 'Guadua, agua y oficios de montaña.',
    headline: 'Cordoba trabaja con el verde profundo del Quindio.',
    summary: 'La guadua, los senderos y la vida de finca dan forma a piezas resistentes, sobrias y muy cercanas al paisaje.',
    craftFocus: ['Guadua estructural', 'Fibras naturales', 'Objetos de finca'],
    culture: ['Paisaje de montana', 'Cultura de finca', 'Caminos de agua'],
    crafts: [
      { name: 'Lampara de guadua', material: 'Guadua', detail: 'Cuerpo perforado para luz calida y sombra natural.' },
      { name: 'Portamaceta campesino', material: 'Fibra y madera', detail: 'Objeto colgante para patios y corredores.' },
      { name: 'Bandeja de finca', material: 'Madera', detail: 'Bandeja utilitaria de borde simple.' }
    ],
    upcomingEvents: [
      { title: 'Jornada de guadua y paisaje', dateText: 'Fecha por confirmar', place: 'Corredor rural', detail: 'Demostraciones de corte, secado y ensamble.' },
      { title: 'Mercado campesino artesanal', dateText: 'Agenda en preparacion', place: 'Cabecera municipal', detail: 'Productos de finca, objetos de guadua y cocina local.' }
    ],
    artisans: [
      { name: 'Guadual del Sur', craft: 'Guadua y madera', workshop: 'Vereda rural' },
      { name: 'Fibra de Agua', craft: 'Objetos colgantes', workshop: 'Cordoba centro' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.paisaje, 'Cordoba'),
    stats: [{ label: 'material', value: 'Guadua' }, { label: 'paisaje', value: 'Agua' }, { label: 'uso', value: 'Finca' }],
    mapPoint: { x: 194, y: 246 }
  },
  {
    slug: 'filandia',
    name: 'Filandia',
    region: 'Miradores y color',
    shortLine: 'Guadua, fique y calles que parecen tejidas.',
    headline: 'Filandia convierte la arquitectura cafetera en gesto artesanal.',
    summary: 'Sus balcones, miradores y talleres familiares hacen de Filandia un punto clave para piezas de guadua, fibra y memoria visual.',
    craftFocus: ['Guadua y fique', 'Cesteria', 'Objetos decorativos'],
    culture: ['Arquitectura colorida', 'Miradores de cordillera', 'Oficios familiares'],
    crafts: [
      { name: 'Cesto en fique y guadua', material: 'Fique y guadua', detail: 'Cesto firme para casa con tejido visible.' },
      { name: 'Lampara de balcon', material: 'Guadua', detail: 'Lampara de mesa inspirada en sombras de corredor.' },
      { name: 'Centro de mesa tejido', material: 'Fibra natural', detail: 'Pieza circular con tension manual.' }
    ],
    upcomingEvents: [
      { title: 'Ruta de talleres de Filandia', dateText: 'Fecha por confirmar', place: 'Centro y veredas', detail: 'Visita guiada a oficios de guadua, fique y tejido.' },
      { title: 'Mercado de mirador', dateText: 'Agenda en preparacion', place: 'Zona de miradores', detail: 'Muestra artesanal con piezas de pequenos talleres.' }
    ],
    artisans: [
      { name: 'Don Hernan Ospina', craft: 'Guadua y fique', workshop: 'La Cristalina' },
      { name: 'Taller Balcon Tejido', craft: 'Cesteria decorativa', workshop: 'Filandia centro' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.filandia, 'Filandia'),
    stats: [{ label: 'oficio', value: 'Guadua' }, { label: 'ruta', value: 'Mirador' }, { label: 'talleres', value: 'Familiares' }],
    mapPoint: { x: 104, y: 92 }
  },
  {
    slug: 'genova',
    name: 'Genova',
    region: 'Alta montaña',
    shortLine: 'Cafe, lana y madera de clima frio.',
    headline: 'Genova conserva el pulso lento de la cordillera.',
    summary: 'En el extremo sur del departamento, Genova inspira piezas calidas: textiles, objetos de madera y accesorios para ritual de cafe.',
    craftFocus: ['Tejido en lana', 'Madera rustica', 'Objetos cafeteros'],
    culture: ['Cafe de montana', 'Vida campesina', 'Clima frio y telar'],
    crafts: [
      { name: 'Manta de montana', material: 'Lana', detail: 'Textil abrigado con franjas discretas.' },
      { name: 'Set de cafe campesino', material: 'Madera y ceramica', detail: 'Piezas para servir cafe en mesa lenta.' },
      { name: 'Perchero de finca', material: 'Madera', detail: 'Objeto utilitario de pared.' }
    ],
    upcomingEvents: [
      { title: 'Encuentro de cafe de montana', dateText: 'Fecha por confirmar', place: 'Cabecera municipal', detail: 'Catas, relatos campesinos y muestra artesanal.' },
      { title: 'Taller de lana y abrigo', dateText: 'Agenda en preparacion', place: 'Talleres familiares', detail: 'Demostracion de tejido y acabados manuales.' }
    ],
    artisans: [
      { name: 'Lanas del Sur', craft: 'Tejido en lana', workshop: 'Genova rural' },
      { name: 'Madera Alta', craft: 'Objetos utilitarios', workshop: 'Centro' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.cafe, 'Genova'),
    stats: [{ label: 'clima', value: 'Frio' }, { label: 'fibra', value: 'Lana' }, { label: 'origen', value: 'Cafe' }],
    mapPoint: { x: 226, y: 268 }
  },
  {
    slug: 'la-tebaida',
    name: 'La Tebaida',
    region: 'Valle calido',
    shortLine: 'Color, comercio y objetos para viaje.',
    headline: 'La Tebaida lleva el Quindio hacia las rutas de llegada.',
    summary: 'Su vocacion de conexion inspira piezas ligeras, faciles de transportar, con color calido y memoria de viaje.',
    craftFocus: ['Souvenir artesanal', 'Bisuteria natural', 'Cuero liviano'],
    culture: ['Puerta de entrada al Quindio', 'Clima calido', 'Comercio viajero'],
    crafts: [
      { name: 'Pulsera de semillas', material: 'Semillas y fibras', detail: 'Accesorio ligero con paleta tropical.' },
      { name: 'Portapasaporte artesanal', material: 'Cuero', detail: 'Pieza de viaje con costura visible.' },
      { name: 'Mini bandeja cafetera', material: 'Madera', detail: 'Objeto pequeno para regalo o mesa.' }
    ],
    upcomingEvents: [
      { title: 'Mercado de viajeros', dateText: 'Fecha por confirmar', place: 'Zona comercial', detail: 'Artesanias pequenas y objetos faciles de llevar.' },
      { title: 'Muestra de accesorios naturales', dateText: 'Agenda en preparacion', place: 'Casa cultural', detail: 'Bisuteria, cuero y fibras de temporada.' }
    ],
    artisans: [
      { name: 'Taller Ruta Calida', craft: 'Accesorios y cuero', workshop: 'La Tebaida centro' },
      { name: 'Semilla Viva', craft: 'Bisuteria natural', workshop: 'Zona urbana' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.taller, 'La Tebaida'),
    stats: [{ label: 'clima', value: 'Calido' }, { label: 'pieza', value: 'Viaje' }, { label: 'color', value: 'Vivo' }],
    mapPoint: { x: 126, y: 226 }
  },
  {
    slug: 'montenegro',
    name: 'Montenegro',
    region: 'Parque cafetero',
    shortLine: 'Turismo, cafe y objetos de memoria familiar.',
    headline: 'Montenegro convierte la experiencia cafetera en recuerdo durable.',
    summary: 'Entre parques, fincas y rutas turisticas, el municipio impulsa piezas que hablan de cafe, familia y mesa compartida.',
    craftFocus: ['Objetos cafeteros', 'Madera decorativa', 'Ceramica souvenir'],
    culture: ['Turismo cafetero', 'Fincas tradicionales', 'Mesa familiar'],
    crafts: [
      { name: 'Portavasos de cafe', material: 'Madera', detail: 'Set grabado con motivos cafeteros.' },
      { name: 'Mug de finca', material: 'Ceramica', detail: 'Taza de uso diario con esmalte tierra.' },
      { name: 'Caja de aroma', material: 'Madera y fibra', detail: 'Caja para guardar cafe o dulces tradicionales.' }
    ],
    upcomingEvents: [
      { title: 'Feria de cafe y familia', dateText: 'Fecha por confirmar', place: 'Zona turistica', detail: 'Muestra de piezas para mesa, cafe y regalo.' },
      { title: 'Ruta de finca artesanal', dateText: 'Agenda en preparacion', place: 'Fincas cafeteras', detail: 'Recorrido con demostraciones de objeto utilitario.' }
    ],
    artisans: [
      { name: 'Objetos Parque Cafe', craft: 'Madera decorativa', workshop: 'Montenegro urbano' },
      { name: 'Ceramica La Finca', craft: 'Ceramica utilitaria', workshop: 'Zona rural' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.cafe, 'Montenegro'),
    stats: [{ label: 'vocacion', value: 'Turismo' }, { label: 'tema', value: 'Cafe' }, { label: 'uso', value: 'Mesa' }],
    mapPoint: { x: 92, y: 205 }
  },
  {
    slug: 'pijao',
    name: 'Pijao',
    region: 'Pueblo lento',
    shortLine: 'Barro, pausa y oficio de montaña.',
    headline: 'Pijao trabaja la materia con el tiempo de la calma.',
    summary: 'Su espiritu pausado encaja con piezas de barro, cocina y fibras que necesitan secado, espera y mano paciente.',
    craftFocus: ['Alfareria', 'Ceramica utilitaria', 'Fibra campesina'],
    culture: ['Vida lenta', 'Arquitectura tradicional', 'Montana cafetera'],
    crafts: [
      { name: 'Vasija de barro quemado', material: 'Arcilla', detail: 'Pieza torneada y secada con paciencia.' },
      { name: 'Plato de cocina lenta', material: 'Ceramica', detail: 'Objeto utilitario para mesa cotidiana.' },
      { name: 'Bolsa de fibra', material: 'Fibra natural', detail: 'Tejido manual para mercado o paseo.' }
    ],
    upcomingEvents: [
      { title: 'Encuentro de pueblo lento', dateText: 'Fecha por confirmar', place: 'Calles tradicionales', detail: 'Recorrido cultural con cocina y artesania local.' },
      { title: 'Taller de barro abierto', dateText: 'Agenda en preparacion', place: 'Casas taller', detail: 'Modelado, secado y relato del proceso ceramico.' }
    ],
    artisans: [
      { name: 'Dona Rosa Elvira Gomez', craft: 'Alfareria', workshop: 'El Crucero' },
      { name: 'Barro de Pijao', craft: 'Ceramica utilitaria', workshop: 'Cabecera municipal' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.paisaje, 'Pijao'),
    stats: [{ label: 'ritmo', value: 'Lento' }, { label: 'material', value: 'Barro' }, { label: 'pieza', value: 'Cocina' }],
    mapPoint: { x: 210, y: 224 }
  },
  {
    slug: 'quimbaya',
    name: 'Quimbaya',
    region: 'Memoria ancestral',
    shortLine: 'Orfebreria simbolica, luz y celebracion.',
    headline: 'Quimbaya honra la memoria precolombina desde el gesto contemporaneo.',
    summary: 'Su nombre evoca una tradicion ancestral que inspira piezas simbolicas, objetos luminosos y detalles decorativos.',
    craftFocus: ['Bisuteria simbolica', 'Ceramica decorativa', 'Objetos de luz'],
    culture: ['Memoria Quimbaya', 'Celebraciones de luz', 'Imaginario ancestral'],
    crafts: [
      { name: 'Dije Quimbaya', material: 'Metal y fibra', detail: 'Accesorio inspirado en formas precolombinas.' },
      { name: 'Farol artesanal', material: 'Papel, madera y luz', detail: 'Objeto decorativo para celebraciones.' },
      { name: 'Mascara mural', material: 'Ceramica', detail: 'Pieza simbolica de pequeno formato.' }
    ],
    upcomingEvents: [
      { title: 'Muestra de luz artesanal', dateText: 'Fecha por confirmar', place: 'Centro municipal', detail: 'Objetos luminosos, papel, madera y decoracion.' },
      { title: 'Laboratorio de simbolos Quimbaya', dateText: 'Agenda en preparacion', place: 'Casa cultural', detail: 'Diseno de accesorios y ceramica inspirada en memoria local.' }
    ],
    artisans: [
      { name: 'Luz Quimbaya Taller', craft: 'Faroles y objetos decorativos', workshop: 'Quimbaya centro' },
      { name: 'Simbolo y Fibra', craft: 'Bisuteria artesanal', workshop: 'Zona urbana' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.taller, 'Quimbaya'),
    stats: [{ label: 'memoria', value: 'Ancestral' }, { label: 'pieza', value: 'Luz' }, { label: 'detalle', value: 'Simbolo' }],
    mapPoint: { x: 76, y: 150 }
  },
  {
    slug: 'salento',
    name: 'Salento',
    region: 'Cocora y palma',
    shortLine: 'Lana, neblina y paisaje de altura.',
    headline: 'Salento abriga el oficio con lana, palma y neblina.',
    summary: 'El paisaje de Cocora, las calles de color y el clima de montana dan origen a textiles y piezas que se sienten de altura.',
    craftFocus: ['Tejido en lana', 'Objetos de palma', 'Ceramica de paisaje'],
    culture: ['Valle de Cocora', 'Palma de cera', 'Calle real y montaña'],
    crafts: [
      { name: 'Ruana de lana virgen', material: 'Lana', detail: 'Abrigo tejido para clima de montaña.' },
      { name: 'Mini palma decorativa', material: 'Fibra y madera', detail: 'Objeto de mesa inspirado en Cocora.' },
      { name: 'Taza de neblina', material: 'Ceramica', detail: 'Pieza esmaltada en tonos frios y crema.' }
    ],
    upcomingEvents: [
      { title: 'Ruta de lana y neblina', dateText: 'Fecha por confirmar', place: 'Calle Real y talleres', detail: 'Demostraciones de tejido y muestra de objetos de montaña.' },
      { title: 'Mercado de Cocora', dateText: 'Agenda en preparacion', place: 'Corredor turistico', detail: 'Piezas pequenas inspiradas en palma, sendero y cafe.' }
    ],
    artisans: [
      { name: 'Dona Carmen Tulia', craft: 'Tejido en lana virgen', workshop: 'Boquia' },
      { name: 'Taller Niebla y Lana', craft: 'Textiles de abrigo', workshop: 'Salento centro' }
    ],
    gallery: galleryFor(TERRITORY_IMAGES.salento, 'Salento'),
    stats: [{ label: 'paisaje', value: 'Cocora' }, { label: 'fibra', value: 'Lana' }, { label: 'clima', value: 'Niebla' }],
    mapPoint: { x: 178, y: 116 }
  }
];

export const MUNICIPALITY_BY_SLUG = new Map(
  QUINDIO_MUNICIPALITIES.map(municipality => [municipality.slug, municipality])
);
