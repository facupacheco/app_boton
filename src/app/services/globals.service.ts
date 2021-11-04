/**
 * Variables globales y archivos de configuración 
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  readonly API_URL = 'http://192.168.0.13/BotonAntipanico/index.php?r=webService/'; 
  constructor() { }
}
