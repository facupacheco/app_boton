import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { AlertService } from 'src/app/services/alert.service';
import { NavController, Platform } from '@ionic/angular';
import { FormBuilder, Validators } from '@angular/forms';
import { GlobalsService } from 'src/app/services/globals.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

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
    setTimeout(() => {
      this.cargando = false;
    }, 100);
  }

  ionViewWillEnter() {
    this._platform.ready().then(() => {
      this._authSv.awaitUserDataInit().then(() => {
        if (this._authSv.isLoggedIn) {
          this._navCtrl.navigateRoot('/home');
        }
      });
    });
  }

  submit() {
    if (this.form.valid) {
      if(this.form.get('password').value == 1234){
        this._navCtrl.navigateForward('/home', { queryParams: { login: true } });
      }else{
        this._alertSv.presentError('Error de Usuario y/o Contraseña');
      }
    }
  }

  refresh(){
    this.form.get('password').setValue(null);
    this.form.get('usuario').setValue(null);
  }

  recuperarUsuario() {
    console.log('entro');
    
    // this._apiSv.getContacto({}).then((respuesta) => {
    //   if (respuesta) {
    //     console.log(respuesta);
    //     this.datosContacto = respuesta;
        
    //     this.modalRecuparUsuario = true;
    //   }
    // }).catch(() => {
    // });
  }

  goTo(page) {
    this._navCtrl.navigateForward(page);
  }

  type_password: boolean = true;
  passwordTypeToggle() {
    this.type_password = !this.type_password;
  }
}
