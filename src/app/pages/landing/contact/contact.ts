import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

interface ContactFormValue {
  name: string;
  email: string;
  message: string;
  privacy: boolean;
}

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  threeWords = false;
  private readonly recipientEmail = 'florianweimann9@gmail.com';

  onSubmit(form: NgForm): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const values = form.value as ContactFormValue;
    this.checkWords(values.message);

    if (form.invalid || !this.threeWords || !values.privacy) {
      form.control.markAllAsTouched();
      this.errorMessage.set('Bitte prüfe die markierten Felder.');
      return;
    }

    const name = values.name.trim();
    const email = values.email.trim();
    const message = values.message.trim();
    const emailBody = `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`;
    const subject = `Neue Nachricht von ${name}`;
    const mailtoLink = `mailto:${this.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;
    this.successMessage.set(
      'Dein E-Mail-Programm sollte sich jetzt öffnen. Bitte sende die vorbereitete Nachricht dort ab.',
    );

    form.resetForm();
    this.threeWords = false;
  }

  checkWords(message: string | null | undefined): void {
    const words = message?.trim().split(/\s+/).filter(Boolean) ?? [];
    this.threeWords = words.length >= 3;
  }
}
