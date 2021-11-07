/**
 * manejo de request a la api con la información del servidor
 */
import { Injectable, OnDestroy } from '@angular/core';
import { GlobalsService } from './globals.service';
import { HttpClient } from '@angular/common/http';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService implements OnDestroy {
  readonly SIN_DATA = "SIN_DATA";

  constructor(
    private _http: HttpClient,
    private _globalsSv: GlobalsService,
    private _alertSv: AlertService,
  ) { }

  ngOnDestroy() {
  }

  /**
 * retorna los datos desde una respuesta de servidor
 * si da error retorna "NO_DATOS" y muestra un mensaje en pantalla
 * @param rspSv 
 */
  format(rspSv, mostrar_mensaje_cuando_responde_ok: boolean) {
    if (rspSv && rspSv.estado == 1) {
      if (mostrar_mensaje_cuando_responde_ok && rspSv.mensaje)
        this._alertSv.presentToast(rspSv.mensaje);
      delete rspSv.estado;
      return rspSv;
    } else {
      this._alertSv.presentToast(rspSv.mensaje);
    }
    return this.SIN_DATA;
  }

  private _postAction(model, action_name) {
    return this._http.get(
      this._globalsSv.API_URL + action_name,
      model
    ).toPromise();
  }

  getAlertas(model) {
    return this._postAction(model, "getAlertas");
  } 
  enviarAlerta(model) {
    return this._postAction(model, "setAlertas");
  }
} 
