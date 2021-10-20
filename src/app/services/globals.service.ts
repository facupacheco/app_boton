/**
 * Variables globales y archivos de configuración 
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  readonly API_URL = 'http://192.168.0.27/publicidades_web/index.php?r=webService/'; 

  constructor() { }
}
