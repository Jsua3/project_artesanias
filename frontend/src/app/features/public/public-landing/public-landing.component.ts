import {
  Component,
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
import { AuthService } from '../../../core/services/auth.service';

export interface Pieza {
  id: number;
  name: string;
  maestro: string;
  town: string;
  price: number;
  category: string;
  img: string;
  status: 'available' | 'lowstock' | 'sold';
}

export interface Maestro {
  name: string;
  town: string;
  vereda: string;
  craft: string;
  years: number;
  quote: string;
}

interface HeroCaption {
  place: string;
  sub: string;
}

@Component({
  selector: 'app-public-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-landing.component.html',
  styleUrl: './public-landing.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'public-landing' }
})
export class PublicLandingComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private router = inject(Router);

  readonly scrolled = signal(false);
  readonly heroSlide = signal(0);
  readonly selectedCategory = signal<string>('Todas');
  readonly openPiece = signal<Pieza | null>(null);
  readonly cart = signal<Pieza[]>([]);
  readonly toast = signal<string | null>(null);

  readonly photos: string[] = [
    '/assets/photo-cocora.jpg',
    '/assets/photo-pueblo.jpg',
    '/assets/photo-iglesia.jpg',
    '/assets/photo-arriero.jpg'
  ];

  readonly captions: HeroCaption[] = [
    { place: 'Valle del Cocora', sub: 'palma de cera · cuna' },
    { place: 'Filandia, Quindío', sub: 'bahareque al amanecer' },
    { place: 'Salento, Quindío', sub: 'iglesia de bahareque' },
    { place: 'Arrieros cafeteros', sub: 'oficio que camina' }
  ];

  readonly navLinks: { label: string; anchor: string }[] = [
    { label: 'Colecciones', anchor: '#coleccion' },
    { label: 'Maestros', anchor: '#maestros' },
    { label: 'Territorio', anchor: '#territorio' },
    { label: 'Oficio', anchor: '#oficio' }
  ];

  readonly piezas: Pieza[] = [
    { id: 1, name: 'Vasija de barro quemado', maestro: 'Doña Rosa Elvira', town: 'Pijao',    price: 180000, category: 'Alfarería', img: '/assets/placeholder-vasija.svg', status: 'available' },
    { id: 2, name: 'Ruana de lana virgen',    maestro: 'Dña Carmen Tulia',  town: 'Salento',  price: 320000, category: 'Tejido',    img: '/assets/placeholder-tejido.svg', status: 'lowstock'  },
    { id: 3, name: 'Cesto en fique y guadua', maestro: 'Don Hernán Ospina', town: 'Filandia', price: 145000, category: 'Guadua',    img: '/assets/placeholder-vasija.svg', status: 'available' },
    { id: 4, name: 'Camino de mesa tejido',   maestro: 'Doña Ana Lucía',    town: 'Circasia', price:  95000, category: 'Textil',    img: '/assets/placeholder-tejido.svg', status: 'available' },
    { id: 5, name: 'Cuenco torneado',         maestro: 'Don Javier Correa', town: 'Calarcá',  price:  72000, category: 'Madera',    img: '/assets/placeholder-vasija.svg', status: 'available' },
    { id: 6, name: 'Tapete urdido a mano',    maestro: 'Doña Gloria Mejía', town: 'Armenia',  price: 420000, category: 'Textil',    img: '/assets/placeholder-tejido.svg', status: 'sold'      }
  ];

  readonly maestros: Maestro[] = [
    { name: 'Doña Rosa Elvira Gómez', town: 'Pijao',    vereda: 'El Crucero',     craft: 'Alfarería · torno a pedal', years: 42, quote: 'El barro se deja enseñar si uno lo escucha despacio.' },
    { name: 'Don Hernán Ospina',      town: 'Filandia', vereda: 'La Cristalina', craft: 'Guadua y fique',             years: 35, quote: 'La guadua nace recta porque busca la luz. Nosotros le ayudamos.' },
    { name: 'Doña Carmen Tulia',      town: 'Salento',  vereda: 'Boquía',        craft: 'Tejido en lana virgen',      years: 28, quote: 'Mi telar lo heredé de mi mamá, el mismo que me quiere ver en el hilo.' }
  ];

  readonly categories = ['Todas', 'Alfarería', 'Tejido', 'Guadua', 'Textil', 'Madera'];

  readonly territorioPlaces = ['Filandia', 'Salento', 'Pijao', 'Circasia', 'Calarcá', 'Armenia'];

  readonly territorioMapPoints: { x: number; y: number; name: string }[] = [
    { x: 110, y:  90, name: 'Filandia' },
    { x: 180, y: 120, name: 'Salento'  },
    { x:  90, y: 170, name: 'Circasia' },
    { x: 170, y: 200, name: 'Calarcá'  },
    { x: 220, y: 160, name: 'Pijao'    },
    { x: 140, y: 230, name: 'Armenia'  }
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
    return cat === 'Todas' ? this.piezas : this.piezas.filter(p => p.category === cat);
  });

  readonly cartCount = computed(() => this.cart().length);

  readonly currentUsername = computed(() => this.auth.currentUser()?.username ?? null);

  private slideInterval: ReturnType<typeof setInterval> | null = null;
  private reducedMotion = false;

  ngOnInit(): void {
    this.reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.reducedMotion && typeof window !== 'undefined') {
      this.slideInterval = setInterval(() => {
        this.heroSlide.update(s => (s + 1) % this.photos.length);
      }, 6000);
    }
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
      this.slideInterval = null;
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 30);
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

  onOpenPiece(p: Pieza): void {
    this.openPiece.set(p);
  }

  onClosePiece(): void {
    this.openPiece.set(null);
  }

  onAddToCart(p: Pieza): void {
    // Fase 1: el flujo real de compra/carrito viene en fase 2 (Stripe).
    // Si el usuario no está autenticado como CLIENTE, lo mandamos a registro.
    const user = this.auth.currentUser();
    if (!user) {
      this.onClosePiece();
      this.router.navigate(['/registro-cliente'], {
        queryParams: { next: '/', reason: 'compra' }
      });
      return;
    }
    if (user.role !== 'CLIENTE') {
      this.showToast('Solo las cuentas cliente pueden comprar.');
      return;
    }
    this.cart.update(c => [...c, p]);
    this.onClosePiece();
    this.showToast(`Agregado: ${p.name}`);
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { next: '/' } });
  }

  goToRegister(): void {
    this.router.navigate(['/registro-cliente']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin/dashboard']);
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

  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 2800);
  }
}
