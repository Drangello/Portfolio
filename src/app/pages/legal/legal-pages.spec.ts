import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';
import { Contact } from '../landing/contact/contact';
import { Footer } from '../../shared/footer/footer';
import { Datenschutz } from './datenschutz/datenschutz';
import { Impressum } from './impressum/impressum';

const germanTranslations = {
  contact: {
    form: {
      labels: { name: 'Name', email: 'E-Mail-Adresse', message: 'Nachricht' },
      placeholders: { name: 'Dein Name', email: 'Deine E-Mail-Adresse', message: 'Deine Nachricht' },
      errors: { name: '', email: '', message: '', privacy: '' },
      privacy: { prefix: 'Ich habe die', link: 'Datenschutzerklärung', suffix: 'gelesen.' },
      submit: 'Nachricht senden',
    },
  },
  footer: {
    logo_alt: 'Logo von Florian Weimann',
    legal_navigation_label: 'Rechtliche Informationen',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    navigation_label: 'Soziale Profile und Kontakt',
    github_aria: 'GitHub-Profil',
    linkedin_aria: 'LinkedIn-Profil',
    email_aria: 'E-Mail senden',
  },
  legal: {
    review: { title: 'Vor Veröffentlichung prüfen' },
    imprint: {
      eyebrow: 'Rechtliche Informationen',
      title: 'Impressum',
      intro: 'Anbieterkennzeichnung',
      provider: { title: 'Angaben gemäß § 5 DDG', address_todo: 'Adresse ergänzen' },
      contact: { title: 'Kontakt', email_label: 'E-Mail:' },
      responsible: { title: 'Verantwortlich für den Inhalt', condition: 'Soweit anwendbar:' },
      review_text: 'Rechtlich prüfen.',
    },
    privacy: {
      eyebrow: 'Rechtliche Informationen',
      title: 'Datenschutzerklärung',
    },
  },
};

const englishTranslations = {
  ...germanTranslations,
  legal: {
    ...germanTranslations.legal,
    privacy: {
      eyebrow: 'Legal information',
      title: 'Privacy policy',
    },
  },
};

describe('Legal pages and links', () => {
  let translate: TranslateService;

  beforeEach(async () => {
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

  it('renders /impressum in German by default', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/impressum', Impressum);

    expect(translate.getCurrentLang()).toBe('de');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Impressum');
  });

  it('renders /datenschutz and reacts to an English language change', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/datenschutz', Datenschutz);

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Datenschutzerklärung');

    await firstValueFrom(translate.use('en'));
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent?.trim()).toBe('Privacy policy');
  });

  it('uses real internal routes for the footer legal links', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const links = element.querySelectorAll<HTMLAnchorElement>('.footer-legal a');

    expect(links[0].getAttribute('href')).toBe('/impressum');
    expect(links[1].getAttribute('href')).toBe('/datenschutz');
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
