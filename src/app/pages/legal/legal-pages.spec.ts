import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import type { TranslationObject } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';
import { Footer } from '../../shared/footer/footer';
import { Contact } from '../landing/contact/contact';
import { Datenschutz } from './datenschutz/datenschutz';
import { Impressum } from './impressum/impressum';

describe('Legal pages and links', () => {
  let translate: TranslateService;
  let germanTranslations: TranslationObject;
  let englishTranslations: TranslationObject;

  beforeEach(async () => {
    [germanTranslations, englishTranslations] = await Promise.all([
      fetch('/i18n/de.json').then((response) => response.json()),
      fetch('/i18n/en.json').then((response) => response.json()),
    ]);

    await TestBed.configureTestingModule({
      imports: [Contact, Footer],
      providers: [
        provideHttpClient(),
        provideRouter(routes),
        provideTranslateService({
          lang: 'de',
          fallbackLang: 'de',
        }),
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('de', germanTranslations);
    translate.setTranslation('en', englishTranslations);
    await firstValueFrom(translate.use('de'));
  });

  function expectCompleteLegalPage(element: HTMLElement, expectedTitle: string): void {
    const headings = element.querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe(expectedTitle);
    expect(element.textContent).not.toContain('legal.');
    expect(element.textContent).not.toContain('TODO');
  }

  function getLeafKeys(value: unknown, prefix = ''): string[] {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return [prefix];
    }

    return Object.entries(value).flatMap(([key, child]) =>
      getLeafKeys(child, prefix ? `${prefix}.${key}` : key),
    );
  }

  it('keeps all German and English translation keys in parity', () => {
    expect(getLeafKeys(englishTranslations).sort()).toEqual(
      getLeafKeys(germanTranslations).sort(),
    );
  });

  it('renders /impressum completely in German and English with one H1', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/impressum', Impressum);

    expect(translate.getCurrentLang()).toBe('de');
    expectCompleteLegalPage(harness.routeNativeElement!, 'Impressum');

    await firstValueFrom(translate.use('en'));
    harness.detectChanges();

    expectCompleteLegalPage(harness.routeNativeElement!, 'Legal notice');
  });

  it('renders /datenschutz completely in German and English with one H1', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/datenschutz', Datenschutz);

    expectCompleteLegalPage(harness.routeNativeElement!, 'Datenschutzerklärung');

    await firstValueFrom(translate.use('en'));
    harness.detectChanges();

    expectCompleteLegalPage(harness.routeNativeElement!, 'Privacy policy');
  });

  it('uses the confirmed email and telephone links on both legal pages', async () => {
    const harness = await RouterTestingHarness.create();

    for (const [url, component] of [
      ['/impressum', Impressum],
      ['/datenschutz', Datenschutz],
    ] as const) {
      await harness.navigateByUrl(url, component);
      const element = harness.routeNativeElement!;

      expect(
        element.querySelector('a[href="mailto:florianweimann9@gmail.com"]'),
      ).not.toBeNull();
      expect(element.querySelector('a[href="tel:+4915735649243"]')).not.toBeNull();
    }
  });

  it('keeps external privacy links explicit and safely isolated', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/datenschutz', Datenschutz);
    const links = harness.routeNativeElement!.querySelectorAll<HTMLAnchorElement>(
      'a[target="_blank"]',
    );

    expect(Array.from(links, (link) => link.href)).toEqual([
      'https://github.com/Drangello',
      'https://www.linkedin.com/in/florian-weimann-b0357a3a0/',
    ]);
    for (const link of links) {
      expect(link.rel).toContain('noopener');
      expect(link.rel).toContain('noreferrer');
    }
  });

  it('uses real internal routes for the footer legal links', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const links = element.querySelectorAll<HTMLAnchorElement>('.footer-legal a');

    expect(links[0].getAttribute('href')).toBe('/impressum');
    expect(links[1].getAttribute('href')).toBe('/datenschutz');
    expect(
      element.querySelector('.footer-right a[href="mailto:florianweimann9@gmail.com"]'),
    ).not.toBeNull();
  });

  it('links the contact privacy text to /datenschutz without toggling the checkbox', () => {
    const fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('.privacy-wrapper a')!;
    const checkbox = element.querySelector<HTMLInputElement>('#contact-privacy')!;

    link.click();

    expect(link.getAttribute('href')).toBe('/datenschutz');
    expect(checkbox.checked).toBeFalse();
  });
});
