import { Component, OnInit, OnDestroy } from '@angular/core'
import { AuthService } from '../../core/services/auth.service'
import { DataService } from 'src/app/core/services/data-service.service'
import { User } from 'src/app/core/services/user'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit, OnDestroy {
  constructor(
    public authService: AuthService,
    public dataService: DataService
  ) {}

  usersPath: string = '/users/'

  signUpSubscription: Subscription = new Subscription()

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.signUpSubscription) this.signUpSubscription.unsubscribe()
  }

  signUp(userEmail: string, userPwd: string) {
    this.signUpSubscription = this.authService
      .SignUp(userEmail, userPwd)
      .subscribe(
        (res) => {
          console.log(res)
          let user = res.user
          console.log(user)
          const userData: User = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
          }
          this.dataService.createFire(this.usersPath + user.uid, userData)
          this.signUpSubscription.unsubscribe()
        },
        (error) => {
          console.error(error)
          this.signUpSubscription.unsubscribe()
        }
      )
  }
}
