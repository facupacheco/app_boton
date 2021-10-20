import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
// import { LoadingPageModule } from '../components/loading/loading.module';
// import { HeaderComponentModule } from '../components/header/header.module';

const routes: Routes = [
  {
    path: '',
    component: HomePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    // LoadingPageModule,
    // HeaderComponentModule
  ],
  declarations: [
    HomePage,
  ],
  providers: [
  ]
})
export class HomePageModule { }
