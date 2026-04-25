import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[appLiquidPointer]',
  standalone: true
})
export class LiquidPointerDirective implements OnInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private enabled = true;

  @Input() liquidTiltStrength = 6;

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      this.enabled = false;
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.enabled = !reducedMotion && finePointer;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.enabled) return;

    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * -this.liquidTiltStrength;
    const ry = (x - 0.5) * this.liquidTiltStrength;

    this.renderer.setStyle(host, '--mx', `${Math.round(x * 100)}%`);
    this.renderer.setStyle(host, '--my', `${Math.round(y * 100)}%`);
    this.renderer.setStyle(host, '--rx', `${rx.toFixed(2)}deg`);
    this.renderer.setStyle(host, '--ry', `${ry.toFixed(2)}deg`);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    const host = this.el.nativeElement;
    this.renderer.removeStyle(host, '--rx');
    this.renderer.removeStyle(host, '--ry');
    this.renderer.removeStyle(host, '--mx');
    this.renderer.removeStyle(host, '--my');
  }
}
