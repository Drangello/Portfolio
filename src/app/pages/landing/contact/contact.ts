import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  private readonly recipientEmail = 'florianweimann9@gmail.com';

  onSubmit() {
    // Reset messages
    this.successMessage.set(null);
    this.errorMessage.set(null);

    // For now, we'll use a simple approach: open the default email client
    // Later, you can integrate with a backend service (e.g., EmailJS, backend API)
    const name = (document.querySelector('input[name="name"]') as HTMLInputElement)?.value;
    const email = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value;
    const message = (document.querySelector('textarea[name="message"]') as HTMLTextAreaElement)?.value;

    if (!name || !email || !message) {
      this.errorMessage.set('Bitte alle Felder ausfüllen.');
      return;
    }

    // Compose email body
    const emailBody = `Name: ${name}\nEmail: ${email}\n\nNachricht:\n${message}`;
    const subject = `Neue Nachricht von ${name}`;

    // Open default email client (mailto:)
    const mailtoLink = `mailto:${this.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;

    // Show success message (optional, as the email client will open)
    this.successMessage.set('E-Mail-Programm öffnet sich...');

    // Reset form after a short delay
    setTimeout(() => {
      (document.querySelector('form') as HTMLFormElement)?.reset();
      this.successMessage.set(null);
    }, 2000);
  }
  threeWords: boolean = false;

checkWords(message: any) {
  const words = message.value?.trim().split(/\s+/) || [];
  this.threeWords = words.length >= 3;
}

}
