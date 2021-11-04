import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { NavController, Platform } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import { GlobalsService } from 'src/app/services/globals.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';


@Component({
  selector: 'app-alertas',
  templateUrl: './alertas.page.html',
  styleUrls: ['./alertas.page.scss'],
})
export class AlertasPage implements OnInit {

  cargando: boolean = true;
  form = this._fb.group({
    usuario: [null, Validators.required],
    password: [null, Validators.required]
  });
  keyboardVisible: boolean = false;
  primerIngreso: boolean = true;
  modalRecuparUsuario: boolean = false;
  prospectos: any;

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
    this._apiSv.getAlertas({idUser: 2}).then((respuesta: any) => {
      if (respuesta) {
        console.log(respuesta);
        this.prospectos = respuesta;
       }
    }).catch(() => {
    });
    console.log(this.prospectos);
    setTimeout(() => {
      this.cargando = false;
    }, 100);
  }
  
  public ionViewDidEnter()
{
  this._firebase.setScreenName("Alertas");
  this._firebase.logEvent("screen_view",{content_type:"alertas",item_id:"alertas"});
}

  goTo(page) {
    this._navCtrl.navigateForward(page);
  }

  type_password: boolean = true;
  passwordTypeToggle() {
    this.type_password = !this.type_password;
  }
}
