import { Component } from '@angular/core';
import { Empfang } from './empfang/empfang';
import { UeberMich } from './ueber-mich/ueber-mich';
import { Skills } from './skills/skills';
import { MeineWerke } from './meine-werke/meine-werke';
import { Contact } from './contact/contact';

@Component({
  selector: 'app-landing',
  imports: [Empfang, UeberMich, Skills, MeineWerke, Contact],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {

}
