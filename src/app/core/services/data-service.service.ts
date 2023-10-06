import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import {
  AngularFireDatabase,
  AngularFireList,
  AngularFireObject,
} from '@angular/fire/compat/database'
import { Observable } from 'rxjs'
import { AuthService } from './auth.service'
import { of, Subscription } from 'rxjs'
import { map, catchError } from 'rxjs/operators'

@Injectable({
  providedIn: 'root',
})
export class DataService {
  nutritionixUrl = 'https://trackapi.nutritionix.com/'
  headers = {
    headers: {
      'x-app-id': environment.nutritionixAppId,
      'x-app-key': environment.nutritionixAppKey,
      'x-remote-user-id': environment.nutritionixRemoteUserId,
      'content-type': 'application/json',
      accept: 'application/json',
    },
  }
  fireRef: AngularFireObject<any> | any
  fireList: AngularFireList<any> | any
  user: any
  signedIn: boolean = false
  usersPath: string = '/users/'

  constructor(
    private http: HttpClient,
    private fireDB: AngularFireDatabase, // TODO: change database rules to "write: false" or to ".read": "auth != null",".write": "auth != null"
    public authService: AuthService
  ) {}

  getUser() {
    {
      // if (this.user && this.user.uid !== 'new') {    // TODO: prevents getting and loading new user from sign-in/sign-out
      //   console.log(this.user)
      //   return of(this.user)
      // } else {
      return this.authService.getUser().pipe(
        catchError((err) => {
          console.log(err)
          return err
        }),
        map((res) => {
          console.log(res)
          if (res) {
            this.user = {
              uid: res.uid,
              email: res.email,
            }
          } else this.user = { uid: 'new', email: 'new' }
          return this.user
        })
      )

      // const authUser = this.authService.getUser()
      // console.log(authUser)
      // this.user = this.getFireObject(this.usersPath + authUser.uid)
      // TODO: hit the user db, get their data (list of recipes, etc., and save it to this.user and then return that)
      // return this.http.get('/users/'+uid).pipe(map => {this.user = {data}}; maybe return this.user})
      // return of(this.user)
      //get it from auth service, etc. and then save to this.user
    }
  }

  getScrapedRecipe(recipeUrl: string) {
    return this.http.get('/api/recipe/' + recipeUrl)
  }

  getFoodById(foodId: string) {
    return this.http.get(
      this.nutritionixUrl + 'v2/search/item?nix_item_id=' + foodId,
      this.headers
    )
    // return this.http.get(this.nutritionixUrl + 'v2/search/item?nix_item_id=513fc9e73fe3ffd40300109f', this.headers)
  }

  getFoodByNlp(ingredientsNlp: string) {
    return this.http.post<any>(
      this.nutritionixUrl + '/v2/natural/nutrients',
      {
        query: ingredientsNlp,
        line_delimited: true,
      },
      this.headers
    )
  }

  getIngredientByNlp(ingredientNlp: string) {
    return this.http.post<any>(
      this.nutritionixUrl + '/v2/natural/nutrients',
      {
        query: ingredientNlp,
      },
      this.headers
    )
  }

  searchIngredient(searchInput: string) {
    return this.http.post<any>(
      this.nutritionixUrl + '/v2/search/instant',
      {
        query: searchInput,
      },
      this.headers
    )
  }

  storeRecipeDB(recipe: any): void {
    sessionStorage.setItem(recipe.original_data.name, JSON.stringify(recipe))
  }

  getRecipeDB(title: string): any {
    let recipe = sessionStorage.getItem(title)
    return JSON.parse(recipe || '{}')
  }

  storeNutritionDB(ingredient: any): void {
    sessionStorage.setItem(ingredient, JSON.stringify(ingredient))
  }

  getNutritionDB(name: string): void {
    let ingredient = sessionStorage.getItem(name)
    return JSON.parse(ingredient || '{}')
  }

  createFire(object: any, data: any): any {
    this.fireRef = this.fireDB.object(object)
    this.fireRef.set(data)
  }

  updateFire(object: any, data: any): any {
    this.fireRef = this.fireDB.object(object)
    this.fireRef.set(data)
  }

  getFireList(list: any): Observable<any> {
    this.fireList = this.fireDB.list(list)
    return this.fireList.valueChanges()
  }

  getFireObject(object: any): Observable<any> {
    this.fireRef = this.fireDB.object(object)
    return this.fireRef.valueChanges()
  }

  addFire(object: any, data: any): any {
    this.fireRef = this.fireDB.list(object)
    // this.fireRef.push(data)
    let add = this.fireRef.push(data)
    return add.key
  }
}
