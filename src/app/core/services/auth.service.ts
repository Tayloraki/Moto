import { Injectable, NgZone } from '@angular/core'
import { User } from '../services/user'
// import { auth } from 'firebase/app' for 3rd party sign-in (google/fb)
import { AngularFireModule } from '@angular/fire/compat'
import { AngularFireAuth } from '@angular/fire/compat/auth'
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore'
import { Router } from '@angular/router'
import { from, Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any // Save logged in user data
  // userDataPipe: Observable<any>
  auth: any | undefined

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {
    /* Saving user data in localstorage when
    logged in and setting up null when logged out */
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user
      } else {
      }
    })
  }

  // Sign in with email/password
  SignIn(email: any, password: any) {
    return from(
      this.afAuth // deleted '.auth', supposedly dropped property
        .signInWithEmailAndPassword(email, password)
    )
  }

  // Sign up with email/password
  SignUp(email: any, password: any) {
    return from(
      this.afAuth.createUserWithEmailAndPassword(email, password)
    ).pipe(
      catchError((error: any) => {
        window.alert(error.message)
        return error
      }),
      map((result: any) => {
        /* Call the SendVerificaitonMail() function when new user sign
      up and returns promise */
        this.SendVerificationMail()
        this.SetUserData(result.user)
        return result
      })
    )
  }

  // Email verification when new user register
  SendVerificationMail() {
    return this.afAuth.currentUser
      .then((u) => u!.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email'])
      })
  }

  // Reset Forgot password
  ForgotPassword(passwordResetEmail: any) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.')
      })
      .catch((error: any) => {
        window.alert(error)
      })
  }

  // Returns true when user is logged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}') // added {} but preventing null may be issue
    return user !== null && user.emailVerified !== false ? true : false
  }

  // Auth logic to run auth providers
  AuthLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result: any) => {
        this.ngZone.run(() => {
          this.router.navigate(['dashboard']) //originally dashboard
        })
        this.SetUserData(result.user)
      })
      .catch((error: any) => {
        window.alert(error)
      })
  }

  /* Setting up user data when sign in with username/password,
  sign up with username/password and sign in with social auth
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    )
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
    }
    return userRef.set(userData, {
      merge: true,
    })
  }

  // Sign out
  SignOut() {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user')
      this.userData = []
      this.router.navigate(['sign-in'])
    })
  }

  getUser(): Observable<any> {
    if (this.userData) {
      return of(this.userData)
    } else {
      return this.afAuth.authState
    }
  }
}
