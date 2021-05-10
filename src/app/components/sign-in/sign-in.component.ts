import { Component, OnInit, OnDestroy } from '@angular/core'
import { AuthService } from '../../core/services/auth.service'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit, OnDestroy {
  error: boolean = false
  errorMessage: any = ''

  signInSubscription: Subscription = new Subscription()

  constructor(public authService: AuthService, public router: Router) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.signInSubscription) {
      this.signInSubscription.unsubscribe()
    }
  }

  signIn(userName: string, userPassword: string): void {
    this.error = false
    this.signInSubscription = this.authService
      .SignIn(userName, userPassword)
      .subscribe(
        (result) => {
          this.router.navigate(['dashboard'])
          this.authService.SetUserData(result.user)
          this.signInSubscription.unsubscribe()
        },
        (error) => {
          console.log(error)
          this.error = true
          this.signInError(error)
          this.signInSubscription.unsubscribe()
        }
      )
  }

  signInError(error: any) {
    if (error.code == 'auth/invalid-email') {
      this.errorMessage = 'There is no account with this username'
    } else if (error.code == 'auth/wrong-password') {
      this.errorMessage = 'Incorrect password'
    } else {
      this.errorMessage = 'There was a problem logging in. Please try again.'
    }
  }
}
