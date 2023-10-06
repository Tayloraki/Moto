import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from './core/services/data-service.service'
import { AuthService } from './core/services/auth.service'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  showAccountDropdown: boolean = false
  error: boolean = false
  errorMessage: any = ''
  userLogin: any

  signInSubscription: Subscription = new Subscription()
  userSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    private router: Router,
    public authService: AuthService
  ) {}

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

  signOut(): void {
    this.authService.SignOut()
    this.showAccountDropdown = !this.showAccountDropdown
  }

  getUser() {
    this.userSubscription = this.dataService.getUser().subscribe(
      (res) => {
        this.userLogin = res
        this.userSubscription.unsubscribe()
      },
      (err) => {
        console.log(err)
        this.userSubscription.unsubscribe()
      }
    )
  }
}
