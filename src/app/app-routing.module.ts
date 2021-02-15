import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AppComponent } from './app.component'
import { RecipesSummaryComponent } from './recipes-summary/recipes-summary.component'
import { RecipeDetailsComponent } from './recipe-details/recipe-details.component'
import { PageNotFoundComponent } from './page-not-found/page-not-found.component'

const routes: Routes = [
  {
    path: '',
    component: RecipesSummaryComponent,
  },
  {
    path: 'recipe/:title',
    component: RecipeDetailsComponent,
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
