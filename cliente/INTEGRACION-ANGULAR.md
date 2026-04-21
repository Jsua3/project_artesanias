# Integración del prototipo cliente con Angular 21 + backend reactivo

Este documento explica cómo pasar del prototipo HTML (`cliente/index.html`) a
una implementación productiva dentro del monorepo `almacen-arle` sin perder
la dirección estética (ancestral cafetero + glassmorphism + 3D inmersivo).

## 1. Ubicación propuesta dentro de `frontend/`

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── api/          # HttpClient services (auth, catalog, inventory)
│   │   │   ├── auth/         # guards, interceptors, session signal
│   │   │   └── three/        # servicio Three.js compartido
│   │   ├── public/           # ← nuevo módulo público (cliente)
│   │   │   ├── public-shell.component.ts
│   │   │   ├── pages/
│   │   │   │   ├── home.page.ts
│   │   │   │   ├── municipios.page.ts
│   │   │   │   ├── catalogo.page.ts
│   │   │   │   └── artesano.page.ts
│   │   │   ├── components/
│   │   │   │   ├── hero-scene.component.ts      # Three.js (inmersivo)
│   │   │   │   ├── municipio-card.component.ts
│   │   │   │   ├── product-card.component.ts
│   │   │   │   ├── product-modal.component.ts
│   │   │   │   ├── artisan-modal.component.ts
│   │   │   │   └── auth-modal.component.ts
│   │   │   └── public.routes.ts
│   │   └── admin/            # (Rebecca — ya existe)
│   └── styles/
│       ├── _tokens.scss      # variables de color + tipografía
│       ├── _glass.scss       # mixin de glassmorphism reutilizable
│       └── _motion.scss      # keyframes + prefers-reduced-motion
```

El prototipo se sirve como "boceto vivo" mientras se hace la migración; no
compite con la app Angular porque vive en una ruta aparte (`/cliente/`) y
puede publicarse detrás del mismo `nginx` que ya sirve Rebecca.

## 2. Estructura de componentes (Angular 21 standalone + signals)

### `PublicShellComponent`

```ts
@Component({
  selector: 'aa-public-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, AuthModalComponent],
  template: `
    <aa-header [user]="session.user()" (openAuth)="authOpen.set(true)" />
    <router-outlet />
    <aa-footer />
    <aa-auth-modal *ngIf="authOpen()" (close)="authOpen.set(false)" />
  `,
})
export class PublicShellComponent {
  protected readonly session = inject(SessionStore);
  protected readonly authOpen = signal(false);
}
```

### `HeroSceneComponent` — Three.js inmersivo

```ts
@Component({
  selector: 'aa-hero-scene',
  standalone: true,
  template: `<canvas #canvas class="hero-canvas" aria-hidden="true"></canvas>`,
  styles: [`.hero-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }`],
})
export class HeroSceneComponent {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly three = inject(ThreeService);

  constructor() {
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      this.three.mountImmersiveScene(this.canvas().nativeElement);
    });

    inject(DestroyRef).onDestroy(() => this.three.dispose());
  }
}
```

> `ThreeService` encapsula la escena del prototipo (vasijas LatheGeometry,
> guaduas CylinderGeometry, palmeras, partículas doradas, niebla) dentro
> de `NgZone.runOutsideAngular` para no disparar detección de cambios.

### Página de catálogo con signals + RxResource

```ts
@Component({
  selector: 'aa-catalogo-page',
  standalone: true,
  imports: [ProductCardComponent, FilterBarComponent],
  template: `
    <aa-filter-bar [value]="filter()" (change)="filter.set($event)" />
    <div class="grid">
      @for (p of filtered(); track p.id) {
        <aa-product-card [product]="p" (open)="open.emit(p)" />
      }
    </div>
  `,
})
export class CatalogoPageComponent {
  private readonly api = inject(CatalogApi);
  protected readonly filter = signal<ProductFilter>('all');
  protected readonly products = toSignal(this.api.list(), { initialValue: [] });
  protected readonly filtered = computed(() =>
    this.products().filter(p => this.filter() === 'all' || p.category === this.filter())
  );

  readonly open = output<Product>();
}
```

## 3. Mapeo del prototipo a endpoints reales

| Prototipo (mock)                       | Endpoint productivo                                   | Servicio          |
| -------------------------------------- | ----------------------------------------------------- | ----------------- |
| `MUNICIPALITIES` (array)               | `GET /api/catalog/municipios`                         | catalog-service   |
| `ARTISANS` (array)                     | `GET /api/catalog/artesanos`                          | catalog-service   |
| `CATEGORIES` (array)                   | `GET /api/catalog/categorias`                         | catalog-service   |
| `PRODUCTS` (array + stock)             | `GET /api/catalog/productos` / `GET /…/:id`           | catalog-service   |
| `handleLogin()`                        | `POST /api/auth/login` (BCrypt, JWT)                  | auth-service      |
| `handleRegister()`                     | `POST /api/auth/register`                             | auth-service      |
| `handlePurchase()` (mutación local)    | `POST /api/inventory/compras` (reduce stock + evento) | inventory-service |
| `console.info('[evento Kafka…]')`      | Topic `purchases.registered` → report-service         | Kafka             |

### Contrato de compra sugerido

```json
POST /api/inventory/compras
{
  "productoId": 42,
  "cantidad": 1,
  "compradorId": 7
}

→ 200 OK
{
  "compraId": "c4a…",
  "stockRestante": 34,
  "artesanoNotificado": true,
  "eventoId": "k-8821"
}
```

El `inventory-service` debe:

1. Validar stock con `SELECT ... FOR UPDATE` (R2DBC transaction) o
   actualización condicional `UPDATE productos SET stock = stock - :qty
   WHERE id = :id AND stock >= :qty`.
2. Publicar en Kafka `purchases.registered` (artesanoId, compradorUsername,
   productoId, cantidad, timestamp).
3. El `report-service` consume el tópico y persiste en
   `notificaciones_artesano` para que Rebecca muestre el feed "quién
   compró qué".

## 4. Estilos compartidos (`_tokens.scss` + `_glass.scss`)

```scss
// _tokens.scss
:root {
  --clay:       #a67c52;
  --clay-deep:  #704a2e;
  --cream:      #f5f0e8;
  --bone:       #ede4d3;
  --sage:       #8a9a7b;
  --moss:       #5a6b4a;
  --coffee:     #3e2723;
  --gold:       #c9a253;
  --mauve:      #a88696;
  --ember:      #c86a3a;

  --font-display: 'Cormorant Garamond', serif;
  --font-poster:  'Fraunces', serif;
  --font-body:    'Outfit', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}

// _glass.scss
@mixin glass($opacity: .55, $blur: 18px) {
  background: rgba(245, 240, 232, $opacity);
  backdrop-filter: blur($blur) saturate(140%);
  -webkit-backdrop-filter: blur($blur) saturate(140%);
  border: 1px solid rgba(201, 162, 83, .35);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .6) inset,
    0 20px 40px -18px rgba(62, 39, 35, .35);
}
```

## 5. Interceptor de auth + guard

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SessionStore).token();
  return token
    ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    : next(req);
};

export const buyerGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.user() ? true : (session.promptLogin(), false);
};
```

El botón "Comprar" usa `[disabled]="!session.user()"` y un tooltip
glassmorphism para invitar a iniciar sesión sin sacar al usuario del
modal del producto — igual que en el prototipo.

## 6. Accesibilidad + performance

- **Reduced motion**: Si `matchMedia('(prefers-reduced-motion: reduce)')`
  está activo, `HeroSceneComponent` no monta la escena Three.js y muestra
  un gradiente ancestral estático equivalente.
- **Bundle splitting**: cargar Three.js solo en la ruta `/` (home) con
  `loadComponent: () => import('./public/components/hero-scene.component')`.
  Mantener la app por debajo de 250 kB inicial para la t3.micro.
- **Imágenes**: cuando el admin suba íconos por municipio/categoría, usar
  `<img loading="lazy" decoding="async">` + `srcset` 1x/2x. Hasta que el
  backend esté listo, los SVG procedurales del prototipo siguen siendo
  el fallback.
- **WCAG**: contraste coffee (#3e2723) sobre cream (#f5f0e8) = 10.5 : 1
  (AAA). Focus rings con `outline: 2px solid var(--gold); outline-offset: 3px`.

## 7. Despliegue en EC2 t3.micro (recordatorio OOM)

Construcción local + rsync del `dist/`:

```bash
# Evita compilar Angular dentro de la t3.micro (se queda sin RAM).
cd frontend
npm ci
npm run build -- --configuration production --stats-json
rsync -avz --delete dist/frontend/ ubuntu@56.126.102.113:/var/www/cliente/
```

`nginx` ya está preparado; sólo añadir:

```nginx
location /cliente/ {
  alias /var/www/cliente/;
  try_files $uri $uri/ /cliente/index.html;
  expires 1h;
}
```

Los microservicios Spring Boot siguen el patrón documentado en
`AWS-DEPLOY-GUIDE.md` (`mvn package -DskipTests --no-deps`, `-Xmx256m`).

## 8. Orden de migración sugerido

1. Extraer tokens + mixins SCSS (1 día). Sin tocar Rebecca.
2. Crear `public-shell` con header/footer y ruta `/` (1 día).
3. Portar `HeroSceneComponent` con el `ThreeService` (1 día).
4. Listados (municipios, catálogo, artesanos) con datos reales del
   `catalog-service` (2 días).
5. Modales (producto, artesano, auth) + `SessionStore` con signals (2 días).
6. Flujo de compra real contra `inventory-service` + consumer Kafka en
   `report-service` (2 días).
7. Pruebas e2e (Playwright) reutilizando `verify.mjs` como base.

> Mientras se ejecutan los pasos 1-5, `cliente/index.html` sigue siendo
> la referencia visual canónica. Cualquier ajuste estético debe hacerse
> primero ahí y luego portarse a Angular.
