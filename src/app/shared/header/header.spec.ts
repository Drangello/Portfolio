import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { Header } from './header';

const translations = {
  header: {
    logo_alt: 'Florian Weimann Logo',
    burger: {
      open: 'Menü öffnen',
      close: 'Menü schließen',
    },
    navigation: {
      label: 'Hauptnavigation',
      about: 'Über mich',
      skills: 'Skills',
      portfolio: 'Werke',
      contact: 'Kontakt',
    },
    mobile_menu: {
      dialog_label: 'Navigationsmenü',
      navigation_label: 'Mobile Navigation',
    },
    language: {
      group_label: 'Sprachauswahl',
      switch_to_english: 'Auf Englisch wechseln',
      switch_to_german: 'Auf Deutsch wechseln',
    },
  },
};

describe('Header language switching', () => {
  let translate: TranslateService;

  beforeEach(async () => {
    localStorage.removeItem('portfolio-language');
    document.documentElement.lang = 'de';

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        provideTranslateService({
          lang: 'de',
          fallbackLang: 'de',
        }),
      ],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);
    translate.setTranslation('de', translations);
    translate.setTranslation('en', translations);
  });

  it('uses German by default and exposes the correct pressed state', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const languageButtons = fixture.nativeElement.querySelectorAll('.lang-buttons .lang-btn');

    expect(translate.getCurrentLang()).toBe('de');
    expect(document.documentElement.lang).toBe('de');
    expect(languageButtons[0].getAttribute('aria-pressed')).toBe('false');
    expect(languageButtons[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('switches to English without closing the mobile menu and persists the choice', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.burger-btn').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.mobile-lang .lang-btn').click();
    fixture.detectChanges();

    const languageButtons = fixture.nativeElement.querySelectorAll('.lang-buttons .lang-btn');
    expect(fixture.componentInstance.menuOpen).toBeTrue();
    expect(translate.getCurrentLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('portfolio-language')).toBe('en');
    expect(languageButtons[0].getAttribute('aria-pressed')).toBe('true');
    expect(languageButtons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('restores English and switches back to German', () => {
    localStorage.setItem('portfolio-language', 'en');
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const languageButtons = fixture.nativeElement.querySelectorAll('.lang-buttons .lang-btn');

    expect(translate.getCurrentLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(languageButtons[0].getAttribute('aria-pressed')).toBe('true');

    languageButtons[1].click();
    fixture.detectChanges();

    expect(translate.getCurrentLang()).toBe('de');
    expect(document.documentElement.lang).toBe('de');
    expect(localStorage.getItem('portfolio-language')).toBe('de');
    expect(languageButtons[0].getAttribute('aria-pressed')).toBe('false');
    expect(languageButtons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
