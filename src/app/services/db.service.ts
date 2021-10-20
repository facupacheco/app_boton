/**
 * manejo de base de datos
 */
import { Injectable, OnDestroy } from '@angular/core';
import { SQLiteObject, SQLite } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { FormGroup } from '@angular/forms';
import { ConexionService } from './conexion.service';
import { ApiService } from './api.service';
import { FormatDatePipe } from '../pipes/format-date.pipe';

@Injectable({
  providedIn: 'root'
})
export class DbService implements OnDestroy {
  // cambiar el número si se modific la base de datos
  readonly DATABASE_VERSION = "9";

  private _database: SQLiteObject;
  private _dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private _prospectos = new BehaviorSubject([]);
  private _incidencias = new BehaviorSubject([]);
  private _entrevistas = new BehaviorSubject([]);
  private _estados_entrevista = new BehaviorSubject([]);
  private _productos = new BehaviorSubject([]);
  private _filtrosPersonalizados = new BehaviorSubject([]);
  private _ranking_ventas = new BehaviorSubject([]);
  conectado: boolean = true;
  conexionSbs: Subscription;

  constructor(
    private _platform: Platform,
    private _sqlite: SQLite,
    private _http: HttpClient,
    private _sqlitePorter: SQLitePorter,
    private _conexionSv: ConexionService,
    private _apiSv: ApiService,
    private _formatDatePipe: FormatDatePipe,
  ) {
    this.conexionSbs = this._conexionSv.monitor$.subscribe((conectado) => {
      this.conectado = conectado;
    });
    this.conectar();
  }

  ngOnDestroy() {
    if (this.conexionSbs && !this.conexionSbs.closed)
      this.conexionSbs.unsubscribe();
  }

  conectar() {
    this._platform.ready().then(() => {
      this._sqlite
        .create({
          name: 'RedDeAgentes.db',
          location: 'default'
        })
        .then((db: SQLiteObject) => {
          this._database = db;
          // si cambió la base de datos
          if (localStorage.getItem('DATABASE_VERSION') != this.DATABASE_VERSION) {
            this.dropDatabase(() => {
              localStorage.setItem('DATABASE_VERSION', this.DATABASE_VERSION);
              this.seedDatabase();
            });
          } else {
            this.seedDatabase();
          }
        });
    });
  }

  desconectar() {
    return new Promise((resolve) => {
      this._database.close()
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }

  dropDatabase(then) {
    this._http.get('assets/database/drop.sql', { responseType: 'text' })
      .subscribe(sql => {
        this._sqlitePorter.importSqlToDb(this._database, sql)
          .then(then)
          .catch(e => console.error(e));
      });
  }

  seedDatabase() {
    this._http.get('assets/database/seed.sql', { responseType: 'text' })
      .subscribe(sql => {
        this._sqlitePorter.importSqlToDb(this._database, sql)
          .then(_ => {
            this.loadProspectos({});
            this.loadIncidencias({});
            this.loadEntrevistas({});
            this.loadEstadosEntrevista({});
            this.loadProductos();
            this.loadFiltrosPersonalizados({});
            this.loadRankingVentas({});
            this._dbReady.next(true);
          })
          .catch(e => console.error(e));
      });
  }

  // FILTRO: manejo de filtros
  // -------------------------

  // retorna true si hay algún filtro aplicado
  tieneFiltro(filtros): boolean {
    let al_menos_un_filtro = false;
    Object.keys(filtros).forEach((key) => {
      let objFiltro = filtros[key];
      if (typeof objFiltro.operador != 'undefined') {
        const valor_default = typeof objFiltro.default != 'undefined' ? objFiltro.default : '';
        const valor = objFiltro.valor;
        if (valor_default != valor) {
          al_menos_un_filtro = true;
        }
      }
    });
    return al_menos_un_filtro;
  }

  // sabe como agregar los filtros a una query en string
  private _filtros(query, filtros) {
    const filtros_nombres = Object.keys(filtros);
    filtros_nombres.forEach((key) => {
      const objFiltro = filtros[key];
      // si el filtro fue utilizado
      if (objFiltro) {
        const filtro_nombre = objFiltro.columna ? objFiltro.columna : key;
        // Lógica de los filtros
        // ---------------------------------------------------------------------------
        if (objFiltro.operador != 'ORDEN' && typeof objFiltro.operador != 'undefined') {
          switch (objFiltro.operador) {
            case 'LIKE':
              query += ' AND ' + filtro_nombre + " LIKE '%" + objFiltro.valor.replace(/'/g, "") + "%'";
              break;
            case 'LIKE_IGUAL':
              if (isNaN(objFiltro.valor) && objFiltro.valor.replace(/'/g, "")) {
                query += ' AND ' + filtro_nombre + " LIKE '" + objFiltro.valor.replace(/'/g, "") + "'";
              } else if (!isNaN(objFiltro.valor) && objFiltro.valor != "") {
                query += ' AND ' + filtro_nombre + " LIKE '" + objFiltro.valor + "'";
              }
              break;
            case 'BOOL':
              switch (objFiltro.valor) {
                case 'SI':
                  query += ' AND ' + filtro_nombre + " !=''";
                  break;
                case 'NO':
                  query += ' AND ' + filtro_nombre + " ==''";
                  break;
                case '':
                  break;
              }
              break;
            case 'NOT IN':
              if (objFiltro.valor) {
                const IN = typeof objFiltro.in == 'string' ? objFiltro.in : objFiltro.in.join(',');
                query += ' AND ' + filtro_nombre + " NOT IN (" + IN + ")";
              }
              break;
            case 'IN':
              if (objFiltro.valor) {
                const IN = typeof objFiltro.in == 'string' ? objFiltro.in : objFiltro.in.join(',');
                query += ' AND ' + filtro_nombre + " IN (" + IN + ")";
              }
              break;
          }
        } else if (typeof objFiltro.operador == 'undefined' && objFiltro.operador != 'ORDEN') {
          const valor = objFiltro ? objFiltro.toString().replace(/'/g, "") : objFiltro;
          query += ' AND ' + filtro_nombre + " = " + valor;
        }
        if (objFiltro.operador == 'ORDEN') {
          var ordenarPor = "";
          if (objFiltro.valor.replace(/'/g, "") == 'fechaAsignacion') {
            ordenarPor = "asignacionFechaAlta";
            query += ' ORDER BY ' + ordenarPor + ' DESC';
          }

        }
      }
    });
    return query;
  }

  limpiarFiltro(form, control) {
    if (typeof form.get(control).value.operador != 'undefined') {
      const valor_default = typeof form.get(control).value.default != 'undefined' ? form.get(control).value.default : '';
      // Lógica de los filtros
      // ---------------------------------------------------------------------------
      switch (form.get(control).value.operador) {
        case 'LIKE':
          form.get(control).patchValue({
            valor: valor_default
          });
          break;
        case 'LIKE_IGUAL':
          form.get(control).patchValue({
            valor: valor_default
          });
          break;
        case 'BOOL':
          form.get(control).patchValue({
            valor: valor_default
          });
          break;
        case 'NOT IN':
          form.get(control).patchValue({
            valor: valor_default
          });
          break;
        case 'IN':
          form.get(control).patchValue({
            valor: valor_default
          });
          break;
        case 'ORDEN':
          form.get(control).patchValue({
            valor: valor_default
          });
          break;
      }
    } else {
      form.get(control).setValue('');
    }
  }

  // limpia todos los valores de un formulario de filtros
  limpiarFiltros(form: FormGroup) {
    Object.keys(form.controls).forEach((control) => {
      this.limpiarFiltro(form, control);
      form.get(control).updateValueAndValidity();
    });
  }

  // GET: retornar datos cargados desde una tabla
  // --------------------------------------------

  getDatabaseState() {
    return this._dbReady.asObservable();
  }

  getProspectos() {
    return this._prospectos.asObservable();
  }

  getIncidencias() {
    return this._incidencias.asObservable();
  }

  getEntrevistas() {
    return this._entrevistas.asObservable();
  }

  getEstadosEntrevista() {
    return this._estados_entrevista.asObservable();
  }

  getProductos() {
    return this._productos.asObservable();
  }

  getFiltrosPersonalizados() {
    return this._filtrosPersonalizados.asObservable();
  }

  getRankingVentas() {
    return this._ranking_ventas.asObservable();
  }

  // LOAD: cargar datos desde una tabla
  // ----------------------------------

  loadProspectos(filtros: {}) {
    let query = 'SELECT * FROM prospectos WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let prospectos: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        prospectos.push(data.rows.item(i));
      }
      this._prospectos.next(prospectos);
      return prospectos;
    });
  }
  loadProspectosFiltroAdjudicado(filtros: {}) {
    let query = 'SELECT * FROM prospectos WHERE referencia = "ADJUDICADO"';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let prospectos: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        prospectos.push(data.rows.item(i));
      }
      this._prospectos.next(prospectos);
      return prospectos;
    });
  }

  loadIncidencias(filtros: {}) {
    let query = 'SELECT * FROM incidencias WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let incidencias: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        incidencias.push(data.rows.item(i));
      }
      this._incidencias.next(incidencias);
      return incidencias;
    });
  }

  loadEntrevistas(filtros: {}) {
    let query = 'SELECT * FROM entrevistas WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let entrevistas: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        entrevistas.push(data.rows.item(i));
      }
      this._entrevistas.next(entrevistas);
      return entrevistas;
    });
  }

  loadEstadosEntrevista(filtros: {}) {
    let query = 'SELECT * FROM estados_entrevista';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let estadosEntrevista: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        estadosEntrevista.push(data.rows.item(i));
      };
      this._estados_entrevista.next(estadosEntrevista);
      return estadosEntrevista;
    });
  }

  loadProductos() {
    let query = 'SELECT * FROM productos';
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let productos: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        productos.push(data.rows.item(i));
      }
      this._productos.next(productos);
      return productos;
    });
  }
  loadFiltrosPersonalizados(filtros: {}) {
    let query = 'SELECT * FROM filtros_personalizados WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let filtros_personalizados: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        filtros_personalizados.push(data.rows.item(i));
      }
      this._filtrosPersonalizados.next(filtros_personalizados);
      return filtros_personalizados;
    });
  }

  loadRankingVentas(filtros: {}) {
    let query = 'SELECT * FROM ranking_ventas WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(data => {
      let ranking_ventas: any[] = [];
      for (let i = 0; i < data.rows.length; i++) {
        // acá se paresea la data, por ejemplo si hay array dentro de array (no soportado pro SQLite)
        ranking_ventas.push(data.rows.item(i));
      }
      this._ranking_ventas.next(ranking_ventas);
      return ranking_ventas;
    });
  }

  // ADD: agregar filas a una tabla
  // ------------------------------

  addEntrevistas(entrevistas, then) {
    if (entrevistas.length == 0) {
      return then();
    }
    let query = 'INSERT OR REPLACE INTO entrevistas (id, prospecto, direccion, localidad, provincia, entreCalles, telefono, cod_area, telefono2, fecha, hora, estado, estadoD, observaciones, vendedor, prospecto_id, documento, tipoDocumento, email, codigoPostal,nombre_sus,apellido_sus,direccion_sus, numero_dir_sus) VALUES ';
    entrevistas.forEach((entrevista, index) => {
      if (index !== 0) {
        query += ',';
      }
      query += "(";
      query += "\"" + (entrevista.id ? entrevista.id.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.prospecto ? entrevista.prospecto.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.direccion ? entrevista.direccion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.localidad ? entrevista.localidad.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.provincia ? entrevista.provincia.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.entreCalles ? entrevista.entreCalles.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.telefono ? entrevista.telefono.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.cod_area ? entrevista.cod_area.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.telefono2 ? entrevista.telefono2.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.fecha ? entrevista.fecha.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.hora ? entrevista.hora.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.estado ? entrevista.estado.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.estadoD ? entrevista.estadoD.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.observaciones ? entrevista.observaciones.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.vendedor ? entrevista.vendedor.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.prospecto_id ? entrevista.prospecto_id.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.documento ? entrevista.documento.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.tipoDocumento ? entrevista.tipoDocumento.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.email ? entrevista.email.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.codigoPostal ? entrevista.codigoPostal.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.nombre_sus ? entrevista.nombre_sus.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.apellido_sus ? entrevista.apellido_sus.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.direccion_sus ? entrevista.direccion_sus.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (entrevista.numero_dir_sus ? entrevista.numero_dir_sus.replace(/"/g, "'") : '') + "\"";
      query += ")";
    });
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  addEstadosEntrevista(estados_entrevista, then) {
    if (estados_entrevista.length == 0) {
      return then();
    }
    let query = 'INSERT OR REPLACE INTO estados_entrevista (id, descripcion) VALUES ';
    estados_entrevista.forEach((estado, index) => {
      if (index !== 0) {
        query += ',';
      }
      query += "(";
      query += "\"" + (estado.id ? estado.id.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (estado.descripcion ? estado.descripcion.replace(/"/g, "'") : '') + "\"";
      query += ")";
    });
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  addProspectos(prospectos, then) {
    if (prospectos.length == 0) {
      return then();
    }
    let query = 'INSERT OR REPLACE INTO prospectos (id, nombre, telefono, provincia, localidad, direccion, tipoDocumento, documento, observaciones, situacion, esBolsa, bolsa, situacionDescripcion, citaActual, vendedor, asignacionFechaAlta, recomendado, parentesco, ocupacion, referencia, referencia2, organizador, contactar, idVendedor, idOrganizador, usuAlta, esRecomendado, telefono2, email, idRecomendado) VALUES ';
    prospectos.forEach((dato, index) => {
      if (index !== 0) {
        query += ',';
      }
      query += "(";
      query += "\"" + (dato.id ? dato.id.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.nombre ? dato.nombre.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.telefono ? dato.telefono.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.provincia ? dato.provincia.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.localidad ? dato.localidad.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.direccion ? dato.direccion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.tipoDocumento ? dato.tipoDocumento.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.documento ? dato.documento.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.observaciones ? dato.observaciones.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.situacion ? dato.situacion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.esBolsa ? dato.esBolsa.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.bolsa ? dato.bolsa.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.situacionDescripcion ? dato.situacionDescripcion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.citaActual ? dato.citaActual.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.vendedor ? dato.vendedor.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.asignacionFechaAlta ? dato.asignacionFechaAlta.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.recomendado ? dato.recomendado.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.parentesco ? dato.parentesco.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.ocupacion ? dato.ocupacion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.referencia ? dato.referencia.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.referencia2 ? dato.referencia2.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.organizador ? dato.organizador.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.contactar ? dato.contactar.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.idVendedor ? dato.idVendedor.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.idOrganizador ? dato.idOrganizador.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.usuAlta ? dato.usuAlta.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.esRecomendado ? dato.esRecomendado.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.telefono2 ? dato.telefono2.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.email ? dato.email.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.idRecomendado ? dato.idRecomendado.replace(/"/g, "'") : '') + "\"";
      query += ")";
    });
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  addFiltroPersonalizado(filtro_personalizado, then) {
    if (filtro_personalizado.length == 0) {
      return then();
    }
    let query = 'INSERT OR REPLACE INTO filtros_personalizados (pantalla, filtro, nombre) VALUES ';
    [filtro_personalizado].forEach((filtro, index) => {
      if (index !== 0) {
        query += ',';
      }
      query += "(";
      query += "\"" + (filtro.pantalla ? filtro.pantalla.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (filtro.filtro ? filtro.filtro.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (filtro.nombre ? filtro.nombre.replace(/"/g, "'") : '') + "\"";
      query += ")";
    });
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  addIncidencias(incidencias, then) {
    if (incidencias.length == 0) {
      return then();
    }
    let query = 'INSERT OR REPLACE INTO incidencias (id, prospecto, estado, fecha, observaciones, usuario, fecha_notificacion, hora_notificacion, estado_id) VALUES ';
    incidencias.forEach((dato, index) => {
      if (index !== 0) {
        query += ',';
      }
      query += "(";
      query += "\"" + (dato.id ? dato.id.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.prospecto ? dato.prospecto.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.estado ? dato.estado.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.fecha ? dato.fecha.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.observaciones ? dato.observaciones.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.usuario ? dato.usuario.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.fecha_notificacion ? dato.fecha_notificacion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.hora_notificacion ? dato.hora_notificacion.replace(/"/g, "'") : '') + "\",";
      query += "\"" + (dato.estado_id ? dato.estado_id.replace(/"/g, "'") : '') + "\"";
      query += ")";
    });
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  addRankingVentas(ranking_ventas, then) {
    if (ranking_ventas.length == 0) {
      return then();
    }
    let query = 'INSERT OR REPLACE INTO ranking_ventas (json) VALUES ';
    [ranking_ventas].forEach((dato, index) => {
      if (index !== 0) {
        query += ',';
      }
      query += "(";
      query += "\"" + (dato ? dato.replace(/'/g, "").replace(/"/g, "'") : '') + "\"";
      query += ")";
    });
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  // DELETE: borrar datos de una tabla
  // ---------------------------------

  deleteEntrevistas(filtros: {}, then) {
    let query = 'DELETE FROM entrevistas WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  deleteEstadosEntrevista(filtros: {}, then) {
    let query = 'DELETE FROM estados_entrevista WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  deleteProspectos(filtros: {}, then) {
    let query = 'DELETE FROM prospectos WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  deleteFiltrosPersonalizados(filtros: {}, then) {
    let query = 'DELETE FROM filtros_personalizados WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  deleteIncidencias(filtros: {}, then) {
    let query = 'DELETE FROM incidencias WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  deleteRankingVentas(filtros: {}, then) {
    let query = 'DELETE FROM ranking_ventas WHERE 1=1';
    query = this._filtros(query, filtros);
    query += ';';
    return this._database.executeSql(query, []).then(then);
  }

  // SINCRONIZAR: actualizar la DB desde el servidor
  // -----------------------------------------------

  // sincronizarEntrevistas(model) {
  //   return new Promise<any[]>((resolve, reject) => {
  //     if (this.conectado) {
  //       this._apiSv.getEntrevistas({
  //         fecha: this._formatDatePipe.transform(model, "YYYY-MM-DD", "DD/MM/YYYY")
  //       }).then((respuesta) => {
  //         const data = this._apiSv.format(respuesta, false);
  //         if (data != this._apiSv.SIN_DATA) {
  //           this.deleteEntrevistas({
  //             fecha: {
  //               operador: 'LIKE',
  //               valor: this._formatDatePipe.transform(model, "YYYY-MM-DD", "YYYY-MM-DD")
  //             }
  //           }, () => {
  //             this.addEntrevistas(data.citas, () => {
  //               this.loadEntrevistas({
  //                 fecha: {
  //                   operador: 'LIKE',
  //                   valor: this._formatDatePipe.transform(model, "YYYY-MM-DD", "YYYY-MM-DD")
  //                 }
  //               }).then((entrevistas) => {
  //                 resolve(<any[]>entrevistas);
  //               }).catch(() => {
  //                 reject("Error leyendo base de datos");
  //               });
  //             });
  //           });
  //         } else {
  //           reject("Error servidor no responde");
  //         }
  //       }).catch(() => {
  //         reject("Error servidor no responde");
  //       });
  //     } else {
  //       reject("Error no conectado");
  //     }
  //   });
  // }

  // sincronizarProspectos(model, filtros) {
  //   return new Promise<any[]>((resolve, reject) => {
  //     if (this.conectado) {
  //       this._apiSv.getProspectos(
  //         model
  //       ).then((respuesta) => {
  //         const data = this._apiSv.format(respuesta, false);
  //         if (data != this._apiSv.SIN_DATA) {
  //           this.deleteProspectos({}, () => {
  //             this.addProspectos(data.prospectos, () => {
  //               this.loadProspectos(filtros).then((prospectos) => {
  //                 resolve(<any[]>prospectos);
  //               }).catch(() => {
  //                 reject("Error leyendo base de datos");
  //               });
  //             });
  //           });
  //         } else {
  //           reject("Error servidor no responde");
  //         }
  //       }).catch(() => {
  //         reject("Error servidor no responde");
  //       });
  //     } else {
  //       reject("Error no conectado");
  //     }
  //   });
  // }

  // sincronizarIncidencias(model, filtros) {
  //   return new Promise<any[]>((resolve, reject) => {
  //     if (this.conectado) {
  //       this._apiSv.getIncidencias(
  //         model
  //       ).then((respuesta) => {
  //         const data = this._apiSv.format(respuesta, false);
  //         if (data != this._apiSv.SIN_DATA) {
  //           this.deleteIncidencias(filtros, () => {
  //             this.addIncidencias(data.incidencias, () => {
  //               this.loadIncidencias(filtros).then((incidencias) => {
  //                 resolve(<any[]>incidencias);
  //               }).catch(() => {
  //                 reject("Error leyendo base de datos");
  //               });
  //             });
  //           });
  //         } else {
  //           reject("Error servidor no responde");
  //         }
  //       }).catch(() => {
  //         reject("Error servidor no responde");
  //       });
  //     } else {
  //       reject("Error no conectado");
  //     }
  //   });
  // }
}
