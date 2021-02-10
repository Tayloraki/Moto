import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { RecipeDetailsComponent } from './recipe-details/recipe-details.component'
import { RecipesSummaryComponent } from './recipes-summary/recipes-summary.component'

@NgModule({
  declarations: [AppComponent, RecipeDetailsComponent, RecipesSummaryComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
