import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-empfang',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './empfang.html',
  styleUrl: './empfang.scss',
})
export class Empfang {

}
