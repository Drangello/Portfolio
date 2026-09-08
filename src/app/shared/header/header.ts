import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements AfterViewChecked, OnDestroy {
  @ViewChild('brandLink') private brandLink?: ElementRef<HTMLAnchorElement>;
  @ViewChild('burgerButton') private burgerButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileMenu') private mobileMenu?: ElementRef<HTMLElement>;
  @ViewChild('firstMenuLink') private firstMenuLink?: ElementRef<HTMLAnchorElement>;

  menuOpen = false;

  private scrollLockActive = false;
  private previousBodyOverflow = '';
  private previousBodyPaddingRight = '';
  private previousBodyPosition = '';
  private previousBodyTop = '';
  private previousBodyWidth = '';
  private previousHtmlOverflowY = '';
  private lockedScrollPosition = 0;
  private focusFirstMenuLink = false;

  toggleMenu() {
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }

    this.openMenu();
  }

  ngAfterViewChecked() {
    if (!this.focusFirstMenuLink || !this.firstMenuLink) {
      return;
    }

    this.focusFirstMenuLink = false;
    this.firstMenuLink.nativeElement.focus();
  }

  closeMenu(restoreBurgerFocus = true) {
    if (!this.menuOpen) {
      return;
    }

    this.menuOpen = false;
    this.unlockPageScroll();

    if (restoreBurgerFocus) {
      setTimeout(() => this.burgerButton?.nativeElement.focus());
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent) {
    if (!this.menuOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      this.keepFocusInsideMenu(event);
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('document:wheel', ['$event'])
  preventWheelScroll(event: WheelEvent) {
    if (this.menuOpen) {
      event.preventDefault();
    }
  }

  @HostListener('document:touchmove', ['$event'])
  preventTouchScroll(event: TouchEvent) {
    if (this.menuOpen) {
      event.preventDefault();
    }
  }

  @HostListener('window:resize')
  handleViewportResize() {
    if (window.innerWidth <= 800) {
      return;
    }

    if (!this.menuOpen) {
      this.unlockPageScroll();
      return;
    }

    const focusWasInsideMenu = this.mobileMenu?.nativeElement.contains(document.activeElement) ?? false;
    this.closeMenu(false);

    if (focusWasInsideMenu) {
      setTimeout(() => this.brandLink?.nativeElement.focus());
    }
  }

  ngOnDestroy() {
    this.unlockPageScroll();
  }

  private openMenu() {
    this.focusFirstMenuLink = true;
    this.menuOpen = true;
    this.lockPageScroll();
  }

  private keepFocusInsideMenu(event: KeyboardEvent) {
    const menu = this.mobileMenu?.nativeElement;
    if (!menu) {
      return;
    }

    const focusableElements = Array.from(
      menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((element) => element.getClientRects().length > 0);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (!menu.contains(activeElement)) {
      event.preventDefault();
      (event.shiftKey ? lastElement : firstElement).focus();
      return;
    }

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private lockPageScroll() {
    if (this.scrollLockActive) {
      return;
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    this.lockedScrollPosition = window.scrollY;
    this.previousBodyOverflow = document.body.style.overflow;
    this.previousBodyPaddingRight = document.body.style.paddingRight;
    this.previousBodyPosition = document.body.style.position;
    this.previousBodyTop = document.body.style.top;
    this.previousBodyWidth = document.body.style.width;
    this.previousHtmlOverflowY = document.documentElement.style.overflowY;

    document.documentElement.style.overflowY = 'scroll';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.lockedScrollPosition}px`;
    document.body.style.width = '100%';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    this.scrollLockActive = true;
  }

  private unlockPageScroll() {
    if (!this.scrollLockActive) {
      return;
    }

    document.documentElement.style.overflowY = this.previousHtmlOverflowY;
    document.body.style.overflow = this.previousBodyOverflow;
    document.body.style.paddingRight = this.previousBodyPaddingRight;
    document.body.style.position = this.previousBodyPosition;
    document.body.style.top = this.previousBodyTop;
    document.body.style.width = this.previousBodyWidth;
    this.scrollLockActive = false;
    window.scrollTo(0, this.lockedScrollPosition);
  }
}
