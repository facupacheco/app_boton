import { NgModule } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

// import { IonicGestureConfig } from './gestures/ionic-gesture-config';

// import { Keyboard } from '@ionic-native/keyboard/ngx';
// import { AppVersion } from '@ionic-native/app-version/ngx';


@NgModule({
  declarations: [
    AppComponent
  ],
  entryComponents: [

  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      scrollAssist: false,
      scrollPadding: false
    }),
    AppRoutingModule,
    HttpClientModule,
    // BrowserAnimationsModule,

  ],
  providers: [
    // AppVersion,
 
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    },  
  
    // {
    //   provide: HAMMER_GESTURE_CONFIG,
    //   useClass: IonicGestureConfig
    // },
    // Keyboard
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
