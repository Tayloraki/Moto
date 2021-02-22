import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { RecipeDetailsComponent } from './recipe-details/recipe-details.component'
import { RecipesSummaryComponent } from './recipes-summary/recipes-summary.component'
import { RecipeDetailsModalComponent } from './recipe-details-modal/recipe-details-modal.component'

@NgModule({
  declarations: [
    AppComponent,
    RecipeDetailsComponent,
    RecipesSummaryComponent,
    RecipeDetailsModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
