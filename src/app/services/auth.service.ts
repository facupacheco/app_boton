/**
 * manejo de logueo
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
// import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { GlobalsService } from './globals.service';
import { tap, catchError } from 'rxjs/operators';
import { Platform } from '@ionic/angular';
import { AlertService } from './alert.service';
import { FirebaseAnalytics } from '@ionic-native/firebase-analytics';
// import { PushService } from './push.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn: boolean = false;
  token2: any;
  user: any;

  constructor(
    private _http: HttpClient,
    private _router: Router,
    // private _storage: NativeStorage,
    private _globalsSv: GlobalsService,
    private _platform: Platform,
    private _alertSv: AlertService,
    // private _pushSv: PushService, 
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const currentUser = this.isLoggedIn;
    if (currentUser) {
      // authorised so return true
      return true;
    }

    // not logged in so redirect to login page with the return url
    this._router.navigate(['/login']);
    return false;
  }

  login(model): Promise<any> {
    return this._http.post(
      this._globalsSv.API_URL + "login",
      model
    ).pipe(
      tap(
        (data: any) => {
          this.isLoggedIn = true;
          this.setTokenUserData("MI_LINDO_TOKEN", data);
        }
      ),
      catchError((error) => {
        return error;
      })
    ).toPromise();
  }
  setTokenUserData(token, userData) {
    console.log(this._platform);
    localStorage.setItem('token2', token);
    localStorage.setItem('id', userData.id);
    localStorage.setItem('nombre', userData.nombre);
    localStorage.setItem('telefono', userData.telefono);
    this.awaitUserDataInit();
  }

  awaitUserDataInit(): Promise<any> {
    return new Promise<void>((resolve) => {
      this.token2 = localStorage.getItem('token2');
      this.user = {
        // agencia: localStorage.getItem('agencia')
        // id: localStorage.getItem('id')
      };

      if (localStorage.getItem('id') && localStorage.getItem('id') != null) {
        this.user['id'] = localStorage.getItem('id');
      }
      this._verificarLoggedIn();
      resolve();
    });
  }

  private _verificarLoggedIn() {
    if (this.token2) {
      this.isLoggedIn = true;
    } else {
      this.isLoggedIn = false;
    }
  }

  clearTokenUserData() {
    delete this.token2;
    localStorage.removeItem('token');
    localStorage.removeItem('token2');
    localStorage.removeItem('id');
    localStorage.removeItem('nombre');
  }

  logout() {
    return new Observable((observer) => {
      this.isLoggedIn = false;
      this.clearTokenUserData();
      observer.complete();
    });
  }
}
