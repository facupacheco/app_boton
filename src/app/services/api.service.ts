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
    return this._http.post(
      this._globalsSv.API_URL + action_name,
      model
    ).toPromise();
  }

  getHomeInfo(model) {
    return this._postAction(model, "getHomeInfo");
  }
  getAdjudicados(model) {
    return this._postAction(model, "getAdjudicados");
  }
  getAdjudicadoInfo(model) {
    return this._postAction(model, "getAdjudicadoInfo");
  }
  getContacto(model) {
    return this._postAction(model, "getContacto");
  }
  registro(model) {
    return this._postAction(model, "createUserApp");
  }
  getAgencias(model) {
    return this._postAction(model, "getAgencias");
  }
  getProvincias(model) {
    return this._postAction(model, "getProvincias");
  }
  getLocalidades(model) {
    return this._postAction(model, "getLocalidades");
  }
  validarUsuario(model) {
    return this._postAction(model, "validateUser");
  }
  getMisDatos(model) {
    return this._postAction(model, "getMisDatos");
  }
  getPlanes(model) {
    return this._postAction(model, "getPlanes");
  }
  getNotificaciones(model) {
    return this._postAction(model, "getNotificaciones");
  }
  getCuotas(model) {
    return this._postAction(model, "getCuotas");
  }
  recuperarPassword(model) {
    return this._postAction(model, "recuperarPassword");
  }
  validarRecuperarPassword(model) {
    return this._postAction(model, "validarRecuperarPassword");
  }
  terminarRecuperarPassword(model) {
    return this._postAction(model, "terminarRecuperarPassword");
  }
  getLinkCuota(model) {
    return this._postAction(model, "getLinkCuota");
  }
  setTokenFCM(model) {
    return this._postAction(model, "setTokenFCM");
  }
  validatePasswordUser(model) {
    return this._postAction(model, "validatePasswordUser");
  }
  setTelefonoSuscriptor(model) {
    return this._postAction(model, "setTelefonoSuscriptor");
  }
}
