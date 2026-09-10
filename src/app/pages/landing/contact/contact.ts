import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface ContactFormValue {
  name: string;
  email: string;
  message: string;
  privacy: boolean;
  website: string;
}

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact implements OnDestroy {
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isSubmitting = signal(false);
  threeWords = false;
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private successMessageSubscription?: Subscription;
  private errorMessageSubscription?: Subscription;

  onSubmit(form: NgForm): void {
    if (this.isSubmitting()) {
      return;
    }

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
    const website = values.website?.trim() ?? '';

    this.isSubmitting.set(true);
    this.http
      .post<{ status: string }>(environment.contactApiUrl, { name, email, message, website })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.setSuccessMessage('contact.status.success');
          form.resetForm();
          this.threeWords = false;
        },
        error: (error: HttpErrorResponse) => {
          this.setErrorMessage(this.getErrorTranslationKey(error));
        },
      });
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

  private getErrorTranslationKey(error: HttpErrorResponse): string {
    if (error.status === 429) {
      return 'contact.status.rate_limit';
    }
    if (error.status === 0) {
      return 'contact.status.network_error';
    }
    if (error.status === 422 || error.status === 413) {
      return 'contact.status.validation_error';
    }
    return 'contact.status.server_error';
  }
}
