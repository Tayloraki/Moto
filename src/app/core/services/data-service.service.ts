import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}

  getScrapedRecipe(recipeUrl: string) {
    return this.http.get('/api/recipe/' + recipeUrl)
  }

  storeRecipeDB(recipe: any): void {
    sessionStorage.setItem(recipe.data.name, JSON.stringify(recipe))
  }

  getRecipeDB(title: string): void {
    let recipe = sessionStorage.getItem(title)
    return JSON.parse(recipe  || '{}')
  }
}
