import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LandingpageComponent } from './landingpage/landingpage.component';
import { BookInfoComponent } from './book-info/book-info.component';

@NgModule({
  declarations: [
    LandingpageComponent,
    BookInfoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    LandingpageComponent,
    BookInfoComponent 
  ]
})
export class LandingpageModule { }
