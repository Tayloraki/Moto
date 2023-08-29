import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import {
  AngularFireDatabase,
  AngularFireList,
  AngularFireObject,
} from '@angular/fire/compat/database'
import { Observable } from 'rxjs'

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

  constructor(
    private http: HttpClient,
    private fireDB: AngularFireDatabase // TODO: change database rules to "write: false" or to ".read": "auth != null",".write": "auth != null"
  ) {}

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
}
