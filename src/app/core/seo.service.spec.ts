import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { routes } from '../app.routes';
import { Header } from '../shared/header/header';
import { SeoService } from './seo.service';

const germanSeo = {
  landing: {
    title: 'Florian Weimann | Fullstack Developer',
    description:
      'Portfolio von Florian Weimann – Fullstack Developer mit Fokus auf moderne, performante Webanwendungen mit Angular, TypeScript, Python und Flask.',
  },
  imprint: {
    title: 'Impressum | Florian Weimann',
    description: 'Impressum und Anbieterinformationen zum Portfolio von Florian Weimann.',
  },
  privacy: {
    title: 'Datenschutz | Florian Weimann',
    description:
      'Datenschutzerklärung für das Portfolio von Florian Weimann mit Informationen zur Verarbeitung personenbezogener Daten.',
  },
};

const englishSeo = {
  landing: {
    title: 'Florian Weimann | Fullstack Developer',
    description:
      'Portfolio of Florian Weimann, a full-stack developer building modern, high-performance web applications with Angular, TypeScript, Python, and Flask.',
  },
  imprint: {
    title: 'Legal Notice | Florian Weimann',
    description: "Legal notice and provider information for Florian Weimann's portfolio.",
  },
  privacy: {
    title: 'Privacy Policy | Florian Weimann',
    description:
      "Privacy policy for Florian Weimann's portfolio, including information about the processing of personal data.",
  },
};

const metadataSelectors = [
  'name="description"',
  'property="og:title"',
  'property="og:description"',
  'property="og:locale"',
  'name="twitter:title"',
  'name="twitter:description"',
];

describe('SeoService', () => {
  let router: Router;
  let translate: TranslateService;
  let title: Title;
  let meta: Meta;

  beforeEach(async () => {
    localStorage.removeItem('portfolio-language');
    document.documentElement.lang = 'de';

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter(routes),
        provideTranslateService({
          lang: 'de',
          fallbackLang: 'de',
        }),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    translate = TestBed.inject(TranslateService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);

    for (const selector of metadataSelectors) {
      for (const element of meta.getTags(selector)) {
        meta.removeTagElement(element);
      }
    }

    translate.setTranslation('de', { seo: germanSeo });
    translate.setTranslation('en', { seo: englishSeo });
    await firstValueFrom(translate.use('de'));
    TestBed.inject(SeoService).initialize();
  });

  async function navigate(url: string, language: 'de' | 'en'): Promise<void> {
    await router.navigateByUrl(url);
    await firstValueFrom(translate.use(language));
    await Promise.resolve();
  }

  it('sets the German landing-page title', async () => {
    await navigate('/', 'de');
    expect(title.getTitle()).toBe(germanSeo.landing.title);
  });

  it('sets the English landing-page title', async () => {
    await navigate('/', 'en');
    expect(title.getTitle()).toBe(englishSeo.landing.title);
  });

  it('sets the German imprint title', async () => {
    await navigate('/impressum', 'de');
    expect(title.getTitle()).toBe(germanSeo.imprint.title);
  });

  it('sets the English imprint title', async () => {
    await navigate('/impressum', 'en');
    expect(title.getTitle()).toBe(englishSeo.imprint.title);
  });

  it('sets the German privacy title', async () => {
    await navigate('/datenschutz', 'de');
    expect(title.getTitle()).toBe(germanSeo.privacy.title);
  });

  it('sets the English privacy title', async () => {
    await navigate('/datenschutz', 'en');
    expect(title.getTitle()).toBe(englishSeo.privacy.title);
  });

  it('updates the meta description for route and language changes', async () => {
    await navigate('/', 'de');
    expect(meta.getTag('name="description"')?.content).toBe(germanSeo.landing.description);

    await firstValueFrom(translate.use('en'));
    expect(meta.getTag('name="description"')?.content).toBe(englishSeo.landing.description);

    await router.navigateByUrl('/datenschutz');
    expect(meta.getTag('name="description"')?.content).toBe(englishSeo.privacy.description);
  });

  it('keeps Open Graph and Twitter metadata in sync', async () => {
    await navigate('/impressum', 'en');

    expect(meta.getTag('property="og:title"')?.content).toBe(englishSeo.imprint.title);
    expect(meta.getTag('property="og:description"')?.content).toBe(
      englishSeo.imprint.description,
    );
    expect(meta.getTag('property="og:locale"')?.content).toBe('en_US');
    expect(meta.getTag('name="twitter:title"')?.content).toBe(englishSeo.imprint.title);
    expect(meta.getTag('name="twitter:description"')?.content).toBe(
      englishSeo.imprint.description,
    );
  });

  it('keeps the html lang attribute synchronized by the existing language switch', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.componentInstance.setLanguage('en', false);

    expect(document.documentElement.lang).toBe('en');
  });
});
