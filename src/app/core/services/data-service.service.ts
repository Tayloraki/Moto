import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'

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

  constructor(private http: HttpClient) {}

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
    sessionStorage.setItem(recipe.data.name, JSON.stringify(recipe))
  }

  getRecipeDB(title: string): void {
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
}
