import { DestroyRef, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map, startWith, switchMap } from 'rxjs';

interface SeoRouteData {
  titleKey: string;
  descriptionKey: string;
}

const DEFAULT_SEO_DATA: SeoRouteData = {
  titleKey: 'seo.landing.title',
  descriptionKey: 'seo.landing.description',
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private initialized = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.getActiveSeoData()),
      distinctUntilChanged(
        (previous, current) =>
          previous.titleKey === current.titleKey &&
          previous.descriptionKey === current.descriptionKey,
      ),
      switchMap(({ titleKey, descriptionKey }) =>
        this.translate.stream([titleKey, descriptionKey]).pipe(
          map((translations) => ({
            title: translations[titleKey],
            description: translations[descriptionKey],
          })),
        ),
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ title, description }) => {
      this.title.setTitle(title);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ name: 'twitter:title', content: title });
      this.meta.updateTag({ name: 'twitter:description', content: description });
      this.meta.updateTag({
        property: 'og:locale',
        content: this.translate.getCurrentLang() === 'en' ? 'en_US' : 'de_DE',
      });
    });
  }

  private getActiveSeoData(): SeoRouteData {
    let route = this.activatedRoute.firstChild;

    while (route?.firstChild) {
      route = route.firstChild;
    }

    const data = route?.snapshot.data;
    const titleKey = data?.['seoTitleKey'];
    const descriptionKey = data?.['seoDescriptionKey'];

    return {
      titleKey: typeof titleKey === 'string' ? titleKey : DEFAULT_SEO_DATA.titleKey,
      descriptionKey:
        typeof descriptionKey === 'string'
          ? descriptionKey
          : DEFAULT_SEO_DATA.descriptionKey,
    };
  }
}
