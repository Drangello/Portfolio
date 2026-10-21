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

  it('preserves native Space activation without synthesizing a second language change', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.burger-btn').click();
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.mobile-lang .lang-btn');
    const changeLanguage = spyOn(fixture.componentInstance, 'setLanguage').and.callThrough();
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBeFalse();
    expect(changeLanguage).not.toHaveBeenCalled();
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.overflow).toBe('hidden');
    button.click();
    expect(changeLanguage).toHaveBeenCalledOnceWith('en');
  });

  it('still prevents Space scrolling on menu links and closes on Escape', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const previousPosition = document.body.style.position;
    const previousOverflow = document.body.style.overflow;
    fixture.nativeElement.querySelector('.burger-btn').click();
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.mobile-nav a');
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    link.dispatchEvent(space);
    expect(space.defaultPrevented).toBeTrue();

    link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen).toBeFalse();
    expect(document.body.style.position).toBe(previousPosition);
    expect(document.body.style.overflow).toBe(previousOverflow);
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
