import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  MUNICIPALITY_BY_SLUG,
  MunicipalityProfile,
  QUINDIO_MUNICIPALITIES
} from './quindio-municipalities.data';

@Component({
  selector: 'app-municipality-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './municipality-profile.component.html',
  styleUrl: './municipality-profile.component.scss',
  host: { class: 'municipality-profile-page' }
})
export class MunicipalityProfileComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private routeSub: Subscription | null = null;

  readonly slug = signal('');
  readonly municipalities = QUINDIO_MUNICIPALITIES;
  readonly profile = computed<MunicipalityProfile | null>(() => (
    MUNICIPALITY_BY_SLUG.get(this.slug()) ?? null
  ));
  readonly relatedMunicipalities = computed(() => {
    const current = this.slug();
    return this.municipalities.filter(item => item.slug !== current).slice(0, 5);
  });

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      this.slug.set(slug);

      if (!MUNICIPALITY_BY_SLUG.has(slug)) {
        this.router.navigateByUrl('/territorio/armenia');
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}
