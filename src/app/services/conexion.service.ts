/**
 * manejo de logueo
 */
import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionService } from 'ng-connection-service';
import { Network } from '@ionic-native/network/ngx';
import { Platform } from '@ionic/angular';
import { Subscription, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConexionService implements OnDestroy {
  // suscribirse para saber cuando cambia la conexión
  public monitor$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  private _cordovaConecionSuscription: Subscription;
  private _domConecionSuscription: Subscription;
  private _susbscritoAmonitoresDeConexion: boolean = false;

  constructor(
    private _platform: Platform,
    private _networkCordova: Network,
    private _networkDom: ConnectionService
  ) {
    this._platform.ready().then(() => {
      this._suscribirseAmonitoresDeConexion();
    });
  }

  private _suscribirseAmonitoresDeConexion() {
    if (!this._susbscritoAmonitoresDeConexion) {
      // si la configuración ya fue cargada, podemos inicializar el monitor
      if (this._platform.is('cordova')) {
        this._cordovaConecionSuscription = this._networkCordova.onChange().subscribe((event) => {
          // this._conexionChange(event.type == 'online');
        });
      } else {
        this._domConecionSuscription = this._networkDom.monitor().subscribe((conectado) => {
          this._conexionChange(conectado);
        });
      }
      this._susbscritoAmonitoresDeConexion = true;
    } else {
      setTimeout(() => {
        this._suscribirseAmonitoresDeConexion();
      }, 500);
    }
  }

  private _conexionChange(estado) {
    this.monitor$.next(estado);
  }

  ngOnDestroy() {
    this._cordovaConecionSuscription.unsubscribe();
    this._domConecionSuscription.unsubscribe();
  }
}
