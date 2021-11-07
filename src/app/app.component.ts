import { Component } from '@angular/core';
import { AlertService } from './services/alert.service';
import { GlobalsService } from './services/globals.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  ip:string;
  public appPages = [
    { title: 'Home', url: 'home', icon: 'home' },
    { title: 'Alertas', url: 'alertas', icon: 'archive' },
  ];
  // public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor(private global:  GlobalsService,private _alertSv: AlertService,
  ) {}

  public setIP(){
    localStorage.setItem('IP',this.ip);
    this.global.setIP(this.ip);    
    this._alertSv.presentWarning('Ip Actualizada. IR a HOME');
  }
}
