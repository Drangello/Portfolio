Dieser Ordner enthält Schriftdateien (z. B. .woff, .woff2, .ttf).

Lege hier eigene Fonts ab (z. B. `open-sans.woff2`) und referenziere sie in deiner `styles.scss` oder in Komponenten-CSS mit `@font-face`.

Beispiel `@font-face` (in `src/styles.scss`):

@font-face {
  font-family: 'MeineFont';
  src: url('/fonts/meinefont.woff2') format('woff2');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}
