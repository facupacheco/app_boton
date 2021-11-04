import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { NavController, Platform } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import { GlobalsService } from 'src/app/services/globals.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { FirebaseAnalyticsOriginal } from '@ionic-native/firebase-analytics';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';



@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  cargando: boolean = true;
  form = this._fb.group({
    usuario: [null, Validators.required],
    password: [null, Validators.required]
  });
  keyboardVisible: boolean = false;
  primerIngreso: boolean = true;
  modalRecuparUsuario: boolean = false;
  datosContacto: any;

  badge: number = 0;
  private _notificacionesSbs: Subscription;
  constructor(
    private _authSv: AuthService,
    private _navCtrl: NavController,
    private _alertSv: AlertService,
    private _fb: FormBuilder,
    private _globalSv: GlobalsService,
    private _platform: Platform,
    private _changeDetectorRef: ChangeDetectorRef,
    private _apiSv: ApiService,
    private _firebase: FirebaseX
  ) {     
  }

  ngOnInit() {
    this.cargando = true;
    setTimeout(() => {
      this.cargando = false;
    }, 100);
  }

  ionViewWillEnter() {
    this._platform.ready().then(() => {
      this._authSv.awaitUserDataInit().then(() => {
        // if (this._authSv.isLoggedIn) {
          this._navCtrl.navigateRoot('/home');
        // }
      });
    });
  }

  public ionViewDidEnter()
{
  this._firebase.setAnalyticsCollectionEnabled(true);
  this._firebase.setScreenName("Home");
  this._firebase.logEvent("screen_view",{content_type:"home",item_id:"home"});
}

  alertaSOS(){
    var imagen=document.getElementById('logoAlerta');
    imagen.setAttribute('src','../../assets/boton-de-alarma-Recuperado.png');
    setTimeout(() => {
      imagen.setAttribute('src','../../assets/boton-de-alarma.png');
      this._alertSv.presentOk('Alerta Enviada Correctamente');
    }, 3000);
    this._alertSv.presentWarning('Enviando Alerta');
  }
 
  goTo(page) {
    this._navCtrl.navigateForward(page);
  }

  type_password: boolean = true;
  passwordTypeToggle() {
    this.type_password = !this.type_password;
  }
}
