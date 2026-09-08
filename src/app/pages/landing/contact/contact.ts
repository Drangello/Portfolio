import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

interface ContactFormValue {
  name: string;
  email: string;
  message: string;
  privacy: boolean;
}

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnDestroy {
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  threeWords = false;
  private readonly translate = inject(TranslateService);
  private readonly recipientEmail = 'florianweimann9@gmail.com';
  private successMessageSubscription?: Subscription;
  private errorMessageSubscription?: Subscription;

  onSubmit(form: NgForm): void {
    this.setSuccessMessage(null);
    this.setErrorMessage(null);

    const values = form.value as ContactFormValue;
    this.checkWords(values.message);

    if (form.invalid || !this.threeWords || !values.privacy) {
      form.control.markAllAsTouched();
      this.setErrorMessage('contact.status.validation_error');
      return;
    }

    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();
    const translationParameters = { name, email, message };
    const emailBody = this.translate.instant('contact.mail.body', translationParameters);
    const subject = this.translate.instant('contact.mail.subject', translationParameters);
    const mailtoLink = `mailto:${this.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;
    this.setSuccessMessage('contact.status.success');

    form.resetForm();
    this.threeWords = false;
  }

  checkWords(message: string | null | undefined): void {
    const words = message?.trim().split(/\s+/).filter(Boolean) ?? [];
    this.threeWords = words.length >= 3;
  }

  ngOnDestroy(): void {
    this.successMessageSubscription?.unsubscribe();
    this.errorMessageSubscription?.unsubscribe();
  }

  private setSuccessMessage(key: string | null): void {
    this.successMessageSubscription?.unsubscribe();

    if (!key) {
      this.successMessage.set(null);
      return;
    }

    this.successMessageSubscription = this.translate.stream(key).subscribe((message) => {
      this.successMessage.set(message);
    });
  }

  private setErrorMessage(key: string | null): void {
    this.errorMessageSubscription?.unsubscribe();

    if (!key) {
      this.errorMessage.set(null);
      return;
    }

    this.errorMessageSubscription = this.translate.stream(key).subscribe((message) => {
      this.errorMessage.set(message);
    });
  }
}
