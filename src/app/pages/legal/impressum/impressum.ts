import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-impressum',
  imports: [TranslatePipe],
  templateUrl: './impressum.html',
  styleUrl: '../legal.scss',
})
export class Impressum {}
