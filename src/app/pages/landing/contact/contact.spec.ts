import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Contact } from './contact';

const germanTranslations = {
  contact: {
    title: 'Kontakt',
    heading: 'Kontaktüberschrift',
    intro: 'Einleitung',
    invitation: 'Einladung',
    highlight: 'Kontakt aufnehmen',
    form: {
      labels: { name: 'Name', email: 'E-Mail-Adresse', message: 'Nachricht' },
      placeholders: { name: 'Dein Name', email: 'Deine E-Mail-Adresse', message: 'Deine Nachricht' },
      errors: {
        name: 'Name ungültig',
        email: 'E-Mail ungültig',
        message: 'Nachricht ungültig',
        privacy: 'Datenschutz erforderlich',
      },
      privacy: { prefix: 'Ich habe die', link: 'Datenschutzerklärung', suffix: 'gelesen.' },
      submit: 'Nachricht senden',
    },
    status: {
      sending: 'Nachricht wird gesendet …',
      validation_error: 'Bitte prüfe die markierten Felder.',
      success: 'Deine Nachricht wurde erfolgreich versendet.',
      rate_limit: 'Zu viele Sendeversuche.',
      network_error: 'Nachrichtenserver nicht erreichbar.',
      server_error: 'Nachricht konnte nicht versendet werden.',
    },
  },
};

const englishTranslations = {
  contact: {
    ...germanTranslations.contact,
    status: {
      sending: 'Sending message …',
      validation_error: 'Please check the highlighted fields.',
      success: 'Your message has been sent successfully.',
      rate_limit: 'Too many sending attempts.',
      network_error: 'The message server is unavailable.',
      server_error: 'Your message could not be sent.',
    },
  },
};

describe('Contact', () => {
  let fixture: ComponentFixture<Contact>;
  let element: HTMLElement;
  let httpTesting: HttpTestingController;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ lang: 'de', fallbackLang: 'de' }),
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('de', germanTranslations);
    translate.setTranslation('en', englishTranslations);
    await firstValueFrom(translate.use('de'));

    fixture = TestBed.createComponent(Contact);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  async function setInput(id: string, value: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function fillValidForm(): Promise<void> {
    await setInput('contact-name', 'Florian Weimann');
    await setInput('contact-email', 'florian@example.com');
    await setInput('contact-message', 'Das ist meine Nachricht.');
    const privacy = element.querySelector<HTMLInputElement>('#contact-privacy')!;
    privacy.checked = true;
    privacy.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function submitForm(): void {
    const form = element.querySelector<HTMLFormElement>('form')!;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('sends a valid form as a JSON POST request', async () => {
    await fillValidForm();
    submitForm();

    const request = httpTesting.expectOne(environment.contactApiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Florian Weimann',
      email: 'florian@example.com',
      message: 'Das ist meine Nachricht.',
      website: '',
    });

    request.flush({ status: 'sent' });
  });

  it('shows the loading state and disables the button while sending', async () => {
    await fillValidForm();
    submitForm();

    const request = httpTesting.expectOne(environment.contactApiUrl);
    const button = element.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    const form = element.querySelector<HTMLFormElement>('form')!;

    expect(fixture.componentInstance.isSubmitting()).toBeTrue();
    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(button.textContent).toContain('Nachricht wird gesendet');

    request.flush({ status: 'sent' });
  });

  it('resets the form only after a successful response', async () => {
    await fillValidForm();
    submitForm();

    httpTesting.expectOne(environment.contactApiUrl).flush({ status: 'sent' });
    fixture.detectChanges();

    expect(element.querySelector<HTMLInputElement>('#contact-name')!.value).toBe('');
    expect(element.querySelector<HTMLInputElement>('#contact-privacy')!.checked).toBeFalse();
    expect(element.querySelector('.form-status')?.textContent).toContain(
      'Deine Nachricht wurde erfolgreich versendet.',
    );
  });

  it('preserves entered values after a server error', async () => {
    await fillValidForm();
    submitForm();

    httpTesting.expectOne(environment.contactApiUrl).flush(
      { error: 'delivery_failed' },
      { status: 502, statusText: 'Bad Gateway' },
    );
    fixture.detectChanges();

    expect(element.querySelector<HTMLInputElement>('#contact-name')!.value).toBe(
      'Florian Weimann',
    );
    expect(element.querySelector('.form-status')?.textContent).toContain(
      'Nachricht konnte nicht versendet werden.',
    );
  });

  it('shows the translated rate-limit message for HTTP 429', async () => {
    await fillValidForm();
    submitForm();

    httpTesting.expectOne(environment.contactApiUrl).flush(
      { error: 'rate_limited' },
      { status: 429, statusText: 'Too Many Requests' },
    );
    fixture.detectChanges();

    expect(element.querySelector('.form-status')?.textContent).toContain(
      'Zu viele Sendeversuche.',
    );
  });

  it('distinguishes network failures from server failures', async () => {
    await fillValidForm();
    submitForm();

    httpTesting.expectOne(environment.contactApiUrl).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(element.querySelector('.form-status')?.textContent).toContain(
      'Nachrichtenserver nicht erreichbar.',
    );

    submitForm();
    httpTesting.expectOne(environment.contactApiUrl).flush(
      { error: 'delivery_failed' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();
    expect(element.querySelector('.form-status')?.textContent).toContain(
      'Nachricht konnte nicht versendet werden.',
    );
  });

  it('keeps privacy consent required before sending', async () => {
    await setInput('contact-name', 'Florian Weimann');
    await setInput('contact-email', 'florian@example.com');
    await setInput('contact-message', 'Das ist meine Nachricht.');

    const button = element.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBeTrue();
    httpTesting.expectNone(environment.contactApiUrl);
  });

  it('keeps form state and translates request status after a language change', async () => {
    await fillValidForm();
    await firstValueFrom(translate.use('en'));
    fixture.detectChanges();
    submitForm();

    httpTesting.expectOne(environment.contactApiUrl).flush(
      { error: 'rate_limited' },
      { status: 429, statusText: 'Too Many Requests' },
    );
    fixture.detectChanges();

    expect(element.querySelector<HTMLInputElement>('#contact-name')!.value).toBe(
      'Florian Weimann',
    );
    expect(element.querySelector('.form-status')?.textContent).toContain(
      'Too many sending attempts.',
    );
  });
});
