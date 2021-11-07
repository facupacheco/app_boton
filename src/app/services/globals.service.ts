/**
 * Variables globales y archivos de configuración 
 */


import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  private ip = '0.0.0.0'
  public API_URL = 'http://'+this.ip+'/BotonAntipanico/index.php?r=webService/'; 
  constructor( private _navCtrl: NavController,) {}

  setIP(ipNew){
    this.ip=ipNew;
    this.API_URL='http://'+ipNew+'/BotonAntipanico/index.php?r=webService/'; 
    console.log('ipSeteada',this.ip);
  }
}
