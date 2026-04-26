import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { LiquidPointerDirective } from '../../../core/directives/liquid-pointer.directive';
import { Artesano, Category, Product } from '../../../core/models/catalog.model';

export interface Pieza {
  id: string;                 // productId UUID cuando viene de backend; string numérico para mocks
  name: string;
  maestro: string;
  town: string;
  price: number;
  category: string;
  img: string;
  status: 'available' | 'lowstock' | 'sold';
  description?: string;
}

export interface Maestro {
  name: string;
  town: string;
  vereda: string;
  craft: string;
  years: number;
  quote: string;
  image?: string;
}

interface HeroCaption {
  place: string;
  sub: string;
}

interface HeroSlide {
  src: string;
  position: string;
  caption: HeroCaption;
}

interface OficioHighlight {
  material: string;
  title: string;
  text: string;
  meta: string;
}

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule, LiquidPointerDirective],
  templateUrl: './public-landing.component.html',
  styleUrl: './public-landing.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'public-landing' }
})
export class PublicLandingComponent implements OnInit, AfterViewInit, OnDestroy {
  auth = inject(AuthService);
  cart = inject(CartService);
  private router = inject(Router);
  private catalog = inject(CatalogService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly scrolled = signal(false);
  readonly heroSlide = signal(0);
  readonly selectedCategory = signal<string>('Todas');
  readonly openPiece = signal<Pieza | null>(null);
  readonly toast = signal<string | null>(null);

  /** Producto crudo del API guardado para pasarlo a CartService al agregar. */
  private readonly productsById = new Map<string, Product>();

  readonly heroSlides: HeroSlide[] = [
    {
      src: '/assets/territorio/filandia/filandia3.jpg',
      position: 'center 48%',
      caption: { place: 'Filandia artesanal', sub: 'color, calle y memoria' }
    },
    {
      src: '/assets/territorio/filandia/filandia4.jpg',
      position: 'center 50%',
      caption: { place: 'Mirador de Filandia', sub: 'montana, viento y camino' }
    },
    {
      src: '/assets/territorio/filandia/filandia5.jpeg',
      position: 'center center',
      caption: { place: 'Cultura cafetera', sub: 'plaza, madera y taller' }
    },
    {
      src: '/assets/territorio/filandia/photo2jpg.jpg',
      position: 'center 55%',
      caption: { place: 'Rincones con historia', sub: 'detalle, sombra y vereda' }
    },
    {
      src: '/assets/territorio/salento/salento1.jpg',
      position: 'center 48%',
      caption: { place: 'Salento, Quindio', sub: 'neblina, cafe y palma' }
    },
    {
      src: '/assets/territorio/salento/salento2.jpg',
      position: 'center 45%',
      caption: { place: 'Camino a Salento', sub: 'territorio vivo' }
    }
  ];

  readonly photos: string[] = this.heroSlides.map(slide => slide.src);

  readonly captions: HeroCaption[] = this.heroSlides.map(slide => slide.caption);

  readonly navLinks: { label: string; anchor: string }[] = [
    { label: 'Colecciones', anchor: '#coleccion' },
    { label: 'Maestros', anchor: '#maestros' },
    { label: 'Territorio', anchor: '#territorio' },
    { label: 'Oficio', anchor: '#oficio' }
  ];

  /** Piezas finalmente mostradas: empiezan como mock y se sustituyen por las del API si existen. */
  readonly piezas = signal<Pieza[]>([
    { id: 'mock-1', name: 'Vasija de barro quemado', maestro: 'Doña Rosa Elvira', town: 'Pijao',    price: 180000, category: 'Alfarería', img: '/assets/placeholder-vasija.svg', status: 'available', description: 'Barro local trabajado a torno y terminado con fuego lento.' },
    { id: 'mock-2', name: 'Ruana de lana virgen',    maestro: 'Dña Carmen Tulia',  town: 'Salento',  price: 320000, category: 'Tejido',    img: '/assets/placeholder-tejido.svg', status: 'lowstock', description: 'Lana tejida en telar familiar, pensada para clima de montana.' },
    { id: 'mock-3', name: 'Cesto en fique y guadua', maestro: 'Don Hernán Ospina', town: 'Filandia', price: 145000, category: 'Guadua',    img: '/assets/placeholder-vasija.svg', status: 'available', description: 'Fibras firmes de uso diario con ensambles hechos a mano.' },
    { id: 'mock-4', name: 'Camino de mesa tejido',   maestro: 'Doña Ana Lucía',    town: 'Circasia', price:  95000, category: 'Textil',    img: '/assets/placeholder-tejido.svg', status: 'available', description: 'Trama textil para vestir la mesa con color cafetero.' },
    { id: 'mock-5', name: 'Cuenco torneado',         maestro: 'Don Javier Correa', town: 'Calarcá',  price:  72000, category: 'Madera',    img: '/assets/placeholder-vasija.svg', status: 'available', description: 'Madera pulida y sellada para conservar su veta natural.' },
    { id: 'mock-6', name: 'Tapete urdido a mano',    maestro: 'Doña Gloria Mejía', town: 'Armenia',  price: 420000, category: 'Textil',    img: '/assets/placeholder-tejido.svg', status: 'sold', description: 'Pieza de telar con urdimbre densa y patron unico.' }
  ]);

  readonly maestros = signal<Maestro[]>([
    { name: 'Doña Rosa Elvira Gómez', town: 'Pijao',    vereda: 'El Crucero',     craft: 'Alfarería · torno a pedal', years: 42, quote: 'El barro se deja enseñar si uno lo escucha despacio.', image: '/assets/placeholder-maestro.svg' },
    { name: 'Don Hernán Ospina',      town: 'Filandia', vereda: 'La Cristalina', craft: 'Guadua y fique',             years: 35, quote: 'La guadua nace recta porque busca la luz. Nosotros le ayudamos.', image: '/assets/placeholder-maestro.svg' },
    { name: 'Doña Carmen Tulia',      town: 'Salento',  vereda: 'Boquía',        craft: 'Tejido en lana virgen',      years: 28, quote: 'Mi telar lo heredé de mi mamá, el mismo que me quiere ver en el hilo.', image: '/assets/placeholder-maestro.svg' }
  ]);

  readonly categories = signal<string[]>(['Todas', 'Alfarería', 'Tejido', 'Guadua', 'Textil', 'Madera']);

  readonly territorioPlaces = ['Filandia', 'Salento', 'Pijao', 'Circasia', 'Calarcá', 'Armenia'];

  readonly territorioMapPoints: { x: number; y: number; name: string }[] = [
    { x: 110, y:  90, name: 'Filandia' },
    { x: 180, y: 120, name: 'Salento'  },
    { x:  90, y: 170, name: 'Circasia' },
    { x: 170, y: 200, name: 'Calarcá'  },
    { x: 220, y: 160, name: 'Pijao'    },
    { x: 140, y: 230, name: 'Armenia'  }
  ];

  readonly oficioHighlights: OficioHighlight[] = [
    {
      material: 'Barro',
      title: 'Pulso y fuego',
      text: 'Arcilla modelada despacio, secada al aire y terminada con quemas que dejan marcas irrepetibles.',
      meta: 'Alfareria'
    },
    {
      material: 'Fique',
      title: 'Fibra que sostiene',
      text: 'Tramas firmes para canastos, bolsos y piezas utilitarias nacidas de manos campesinas.',
      meta: 'Cesteria'
    },
    {
      material: 'Guadua',
      title: 'Arquitectura pequena',
      text: 'Cortes, ensambles y curvaturas que convierten una planta del paisaje en objeto de casa.',
      meta: 'Talla y estructura'
    },
    {
      material: 'Lana',
      title: 'Hilo con memoria',
      text: 'Telares, nudos y urdimbres que guardan el ritmo de quien trabaja sin prisa.',
      meta: 'Textil'
    }
  ];

  readonly categoryClass: Record<string, string> = {
    'Alfarería': 'cat-clay',
    'Guadua':    'cat-clay',
    'Tejido':    'cat-sage',
    'Textil':    'cat-mauve',
    'Madera':    'cat-ember'
  };

  readonly filteredPiezas = computed(() => {
    const cat = this.selectedCategory();
    const list = this.piezas();
    return cat === 'Todas' ? list : list.filter(p => p.category === cat);
  });

  readonly cartCount = computed(() => this.cart.count());

  readonly currentUsername = computed(() => this.auth.currentUser()?.username ?? null);

  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private revealObserver: IntersectionObserver | null = null;
  private reducedMotion = false;

  ngOnInit(): void {
    this.reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.reducedMotion && typeof window !== 'undefined') {
      this.slideInterval = setInterval(() => {
        this.heroSlide.update(s => (s + 1) % this.photos.length);
      }, 6000);
    }

    this.loadCatalog();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
    this.revealObserver?.disconnect();
    this.revealObserver = null;
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.story-reveal'));
    if (!('IntersectionObserver' in window) || this.reducedMotion) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    this.revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        this.revealObserver?.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el, index) => {
      el.style.setProperty('--reveal-delay', `${Math.min(index * 55, 330)}ms`);
      this.revealObserver?.observe(el);
    });
  }

  /**
   * Carga productos, categorías y artesanos desde el API público. Si el API
   * responde vacío o falla (p.ej. dev local sin backend), mantiene los mocks
   * para no perder la experiencia de Fase 1.
   */
  private loadCatalog(): void {
    forkJoin({
      products: this.catalog.getProducts().pipe(catchError(() => of([] as Product[]))),
      categories: this.catalog.getCategories().pipe(catchError(() => of([] as Category[]))),
      artesanos: this.catalog.getArtesanos().pipe(catchError(() => of([] as Artesano[])))
    }).subscribe(({ products, categories, artesanos }) => {
      if (!products.length) {
        // Sin datos reales: conservamos mocks. Nothing to do.
        return;
      }

      const catName = new Map(categories.map(c => [c.id, c.name]));
      const artName = new Map(artesanos.map(a => [a.id, a.nombre]));
      const artTown = new Map(artesanos.map(a => [a.id, a.ubicacion ?? '']));

      const mapped: Pieza[] = products
        .filter(p => p.active)
        .map(p => {
          const category = (p.categoryId && catName.get(p.categoryId)) || 'Otras';
          const maestro  = (p.artesanoId && artName.get(p.artesanoId)) || '—';
          const town     = (p.artesanoId && artTown.get(p.artesanoId)) || '';
          return {
            id: p.id,
            name: p.name,
            maestro,
            town,
            price: p.price ?? 0,
            category,
            img: p.imageUrl || '/assets/placeholder-vasija.svg',
            status: 'available' as const,
            description: p.description ?? undefined
          };
        });

      if (mapped.length) {
        this.piezas.set(mapped);
        this.productsById.clear();
        products.forEach(p => this.productsById.set(p.id, p));

        // Categorías a partir de los valores reales (más 'Todas')
        const cats = ['Todas', ...Array.from(new Set(mapped.map(m => m.category)))];
        this.categories.set(cats);
      }

      if (artesanos.length) {
        this.maestros.set(
          artesanos.slice(0, 3).map(a => ({
            name: a.nombre,
            town: a.ubicacion ?? '',
            vereda: a.ubicacion ?? '',
            craft: a.especialidad ?? '',
            years: 0,
            quote: '',
            image: a.imageUrl || '/assets/placeholder-maestro.svg'
          }))
        );
      }
    });
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 30);
    const progress = Math.min(1, window.scrollY / 1200);
    this.host.nativeElement.style.setProperty('--scroll-progress', progress.toFixed(3));
  }

  formatPrice(n: number): string {
    return '$ ' + n.toLocaleString('es-CO');
  }

  setCategory(c: string): void {
    this.selectedCategory.set(c);
  }

  setSlide(i: number): void {
    this.heroSlide.set(i);
  }

  currentCaption(): HeroCaption {
    return this.captions[this.heroSlide()];
  }

  pieceDescription(p: Pieza): string {
    return p.description
      || 'Pieza artesanal seleccionada por su oficio, material y trazos propios del taller.';
  }

  piezasForMaestro(m: Maestro): string[] {
    const normalizedName = this.normalizeText(m.name);
    const lastNames = normalizedName.split(' ').slice(-2).join(' ');
    return this.piezas()
      .filter(p => {
        const maestro = this.normalizeText(p.maestro);
        return maestro.includes(lastNames) || normalizedName.includes(maestro);
      })
      .map(p => p.name)
      .slice(0, 3);
  }

  heroPosition(index: number): string {
    return this.heroSlides[index]?.position ?? 'center center';
  }

  onOpenPiece(p: Pieza): void {
    this.openPiece.set(p);
  }

  onClosePiece(): void {
    this.openPiece.set(null);
  }

  onAddToCart(p: Pieza): void {
    // Permitimos agregar al carrito incluso sin login — el login se pide en /checkout.
    if (p.status === 'sold') {
      this.showToast('Esta pieza ya fue vendida.');
      return;
    }
    // Mocks no son agregables al carrito real
    if (p.id.startsWith('mock-')) {
      this.onClosePiece();
      this.showToast('Demo: esta pieza aún no está disponible para compra.');
      return;
    }
    const product = this.productsById.get(p.id);
    if (!product) {
      this.showToast('No se encontró el producto.');
      return;
    }
    this.cart.add(product, 1);
    this.onClosePiece();
    this.showToast(`Agregado: ${p.name}`);
  }

  goToCart(): void {
    this.router.navigate(['/carrito']);
  }

  goToMisPedidos(): void {
    this.router.navigate(['/mis-pedidos']);
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { next: '/' } });
  }

  goToRegister(): void {
    this.router.navigate(['/registro-cliente']);
  }

  goToPanel(): void {
    this.router.navigateByUrl(this.auth.homeRouteForCurrentUser());
  }

  logout(): void {
    this.auth.logout();
  }

  onHeroMouseMove(event: MouseEvent, heroEl: HTMLElement): void {
    if (this.reducedMotion) return;
    const rect = heroEl.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    heroEl.style.setProperty('--px', String(px));
    heroEl.style.setProperty('--py', String(py));
  }

  onPieceMouseMove(event: MouseEvent, card: HTMLElement): void {
    if (this.reducedMotion) return;
    const r = card.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width;
    const py = (event.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -6;
    const ry = (px - 0.5) *  6;
    card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  onPieceMouseLeave(card: HTMLElement): void {
    card.style.transform = '';
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
