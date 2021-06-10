import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'

// Firebase
import { AngularFireModule } from '@angular/fire'
import { AngularFirestoreModule } from '@angular/fire/firestore'
import { AngularFireAuthModule } from '@angular/fire/auth'
import { environment } from '../environments/environment'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { RecipeDetailsComponent } from './recipe-details/recipe-details.component'
import { RecipesSummaryComponent } from './recipes-summary/recipes-summary.component'
import { RecipeDetailsModalComponent } from './recipe-details-modal/recipe-details-modal.component'
import { IngredientSearchComponent } from './ingredient-search/ingredient-search.component'

import { SignInComponent } from './components/sign-in/sign-in.component'
import { SignUpComponent } from './components/sign-up/sign-up.component'
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component'
import { VerifyEmailComponent } from './components/verify-email/verify-email.component'
import { AuthService } from './core/services/auth.service'
import { DashboardComponent } from './components/dashboard/dashboard.component'

@NgModule({
  declarations: [
    AppComponent,
    RecipeDetailsComponent,
    RecipesSummaryComponent,
    RecipeDetailsModalComponent,
    IngredientSearchComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    VerifyEmailComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    AngularFireModule.initializeApp(environment.firebaseConfig, 'moto'),
    AngularFirestoreModule, // imports firebase/firestore, only needed for database features
    AngularFireAuthModule, // imports firebase/auth, only needed for auth features
  ],
  providers: [AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
