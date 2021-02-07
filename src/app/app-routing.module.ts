import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AppComponent } from './app.component'
import { RecipesSummaryComponent } from './recipes-summary/recipes-summary.component'
import { RecipeDetailsComponent } from './recipe-details/recipe-details.component'

const routes: Routes = [
  {
    path: '',
    component: RecipesSummaryComponent,
  },
  {
    path: 'recipe/:title',
    component: RecipeDetailsComponent,
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
