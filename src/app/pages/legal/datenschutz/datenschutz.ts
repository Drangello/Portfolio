import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-datenschutz',
  imports: [TranslatePipe],
  templateUrl: './datenschutz.html',
  styleUrl: '../legal.scss',
})
export class Datenschutz {}
