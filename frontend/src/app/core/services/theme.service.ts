import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'rebeca-theme';

  readonly isDark = signal<boolean>(this.load());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem(this.KEY, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }

  private load(): boolean {
    const stored = localStorage.getItem(this.KEY);
    if (stored !== null) return stored === 'dark';
    return typeof window !== 'undefined'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
