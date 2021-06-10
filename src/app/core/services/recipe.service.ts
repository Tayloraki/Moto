import { Injectable } from '@angular/core'
import { AngularFireDatabase } from '@angular/fire/database'
import { AngularFireAuth } from '@angular/fire/auth'
import { Recipe } from 'src/app/core/models/recipe'
import { BehaviorSubject, Observable, throwError } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  recipes: Observable<any[]> = new Observable()
  userId: string = ''
  authBehaviorSubject = new BehaviorSubject({})

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) {
    this.afAuth.authState.subscribe((user: any) => {
      if (user) {
        this.userId = user.uid
        this.recipes = this.db.list(`recipes/${this.userId}`).valueChanges()
      }
      this.authBehaviorSubject.next(user)
    })
  }

  getRecipesList(): Observable<Recipe[]> {
    if (!this.userId) {
      return throwError('no user')
    }
    return this.recipes
  }

  createRecipe(recipe: Recipe) {
    // this.db.list(`recipes/${this.userId}`).push(recipe)
    console.log(this.db.list(`recipes/${this.userId}`).push(recipe).key)
  }
}
