import { Component, OnInit } from '@angular/core'
import { AuthService } from '../../core/services/auth.service'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  error: boolean = false
  errorMessage: any = ''

  SignInSubscription: Subscription

  constructor(public authService: AuthService, public router: Router) {}

  ngOnInit(): void {}

  signIn(userName: string, userPassword: string): void {
    this.error = false
    this.SignInSubscription = this.authService
      .SignIn(userName, userPassword)
      .subscribe(
        (result) => {
          this.router.navigate(['dashboard'])
          this.authService.SetUserData(result.user)
        },
        (error) => {
          console.log(error)
          this.error = true
          this.signInError(error)
        }
      )
  }

  signInError(error) {
    if (error.code == 'auth/invalid-email') {
      this.errorMessage = 'There is no account with this username'
    } else if (error.code == 'auth/wrong-password') {
      this.errorMessage = 'Incorrect password'
    } else {
      this.errorMessage = 'There was a problem logging in. Please try again.'
    }
  }
}
