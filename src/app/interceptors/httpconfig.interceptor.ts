import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders, HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Router } from "@angular/router";
import { ApiService } from "../services/api.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    token:any=localStorage.getItem('token');
    constructor(private router: Router, private _api: ApiService) { }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const clonedReq = req.clone({
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization':`Bearer ${this.token}`
            })
        });
        return next.handle(clonedReq).pipe(
            tap(
                (event : HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                            //Manejar la respuesta
                      }
                },
                (error : HttpErrorResponse ) => {
                    if (error.status == 401) {                       
                        this.router.navigate(['/login']);
                    }
                    if (error.status == 403) {                       
                        console.log('token vencido');
                    }
                }
            )
        )
    }
} 