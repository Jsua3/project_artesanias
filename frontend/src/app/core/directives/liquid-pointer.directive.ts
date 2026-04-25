import { Directive, ElementRef, HostListener, Input, OnDestroy, OnInit, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appLiquidPointer]',
  standalone: true
})
export class LiquidPointerDirective implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private enabled = true;
  private rafId = 0;
  private hoverTimer = 0;
  private lastPointer: PointerEvent | null = null;

  @Input() liquidTiltStrength = 6;

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      this.enabled = false;
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.enabled = !reducedMotion && finePointer;
    this.resetSurface();
  }

  ngOnDestroy(): void {
    this.cancelFrame();
    this.clearHoverTimer();
  }

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(event: PointerEvent): void {
    if (!this.enabled) return;

    this.lastPointer = event;
    this.scheduleFrame();
    this.clearHoverTimer();
    this.hoverTimer = window.setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, '--glow-intensity', '1');
    }, 90);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.enabled) return;

    this.lastPointer = event;
    this.scheduleFrame();
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    this.lastPointer = null;
    this.cancelFrame();
    this.clearHoverTimer();
    this.resetSurface();
  }

  private scheduleFrame(): void {
    if (this.rafId || typeof window === 'undefined') return;

    this.rafId = window.requestAnimationFrame(() => {
      this.rafId = 0;
      this.updateSurface();
    });
  }

  private updateSurface(): void {
    if (!this.lastPointer) return;

    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = Math.min(Math.max((this.lastPointer.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((this.lastPointer.clientY - rect.top) / rect.height, 0), 1);
    const strength = Math.min(Math.abs(this.liquidTiltStrength || 0), 6);
    const rx = (y - 0.5) * -strength;
    const ry = (x - 0.5) * strength;

    this.renderer.setStyle(host, '--mx', `${Math.round(x * 100)}%`);
    this.renderer.setStyle(host, '--my', `${Math.round(y * 100)}%`);
    this.renderer.setStyle(host, '--rx', `${rx.toFixed(2)}deg`);
    this.renderer.setStyle(host, '--ry', `${ry.toFixed(2)}deg`);
  }

  private resetSurface(): void {
    const host = this.el.nativeElement;
    this.renderer.setStyle(host, '--mx', '50%');
    this.renderer.setStyle(host, '--my', '50%');
    this.renderer.setStyle(host, '--rx', '0deg');
    this.renderer.setStyle(host, '--ry', '0deg');
    this.renderer.setStyle(host, '--glow-intensity', '0');
  }

  private cancelFrame(): void {
    if (!this.rafId || typeof window === 'undefined') return;

    window.cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private clearHoverTimer(): void {
    if (!this.hoverTimer || typeof window === 'undefined') return;

    window.clearTimeout(this.hoverTimer);
    this.hoverTimer = 0;
  }
}
