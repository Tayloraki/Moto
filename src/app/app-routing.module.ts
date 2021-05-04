import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AppComponent } from './app.component'

// Import all the components for which navigation service has to be activated
import { SignInComponent } from './components/sign-in/sign-in.component'
import { SignUpComponent } from './components/sign-up/sign-up.component'
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component'
import { AuthGuard } from './core/guard/auth.guard'
import { DashboardComponent } from './components/dashboard/dashboard.component'
import { VerifyEmailComponent } from './components/verify-email/verify-email.component'

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
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: 'sign-in', component: SignInComponent },
  { path: 'register-user', component: SignUpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
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
