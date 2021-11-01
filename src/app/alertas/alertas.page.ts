import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { NavController, Platform } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import { GlobalsService } from 'src/app/services/globals.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';


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
    private _apiSv: ApiService
  ) {
   
  }

  ngOnInit() {
    this.cargando = true;
    // this._apiSv.getProspectosAsignados({idUser: 2}).then((respuesta) => {
    //   if (respuesta) {
    //     console.log(respuesta);
    //     this.datosContacto = respuesta;
    //    }
    // }).catch(() => {
    // });
    setTimeout(() => {
      this.cargando = false;
    }, 100);
  }
  


  goTo(page) {
    this._navCtrl.navigateForward(page);
  }

  type_password: boolean = true;
  passwordTypeToggle() {
    this.type_password = !this.type_password;
  }
}
