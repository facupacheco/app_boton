import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(
    private _toastCtrl: ToastController,
    private _alertCtrl: AlertController,
  ) { }

  async presentToast(message: any) {
    const toast = await this._toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    toast.present();
  }

  async presentError(message: any) {
    if (await this._toastCtrl.getTop()) {
      await this._toastCtrl.dismiss();
    }
    const toast = await this._toastCtrl.create({
      message: message,
      duration: 4500,
      position: 'bottom',
      color: 'danger'
    });
    toast.present();
  }
  async presentWarning(message: any) {
    if (await this._toastCtrl.getTop()) {
      await this._toastCtrl.dismiss();
    }
    const toast = await this._toastCtrl.create({
      message: message,
      duration: 4500,
      position: 'bottom',
      color: 'warning'
    });
    toast.present();
  }

  async presentOk(message: any) {
    if (await this._toastCtrl.getTop()) {
      await this._toastCtrl.dismiss();
    }
    const toast = await this._toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    toast.present();
  }

  async presentConfirm(header, message, onOk = null, param?) {
    let buttons = [];
    if (onOk) {
      buttons.push({
        text: 'Ignorar',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => { }
      });
      buttons.push({
        text: 'Aceptar',
        handler: onOk
      });
    } else {
      buttons.push({
        text: param ? 'Aceptar' : 'Leido',
        role: 'cancel',
        cssClass: 'secondary',
        handler: () => { }
      });
    }
    const alert = await this._alertCtrl.create({
      header: header,
      message: message,
      buttons: buttons
    });
    await alert.present();
  }
}