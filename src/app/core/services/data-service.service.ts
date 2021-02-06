import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class DataService {
  recipes: any[] = []  // TODO: delete once db is implemented

  constructor(private http: HttpClient) { }

  getScrapedRecipe(recipeUrl: string) {
    return this.http.get('/api/recipe/' + recipeUrl)
  }

  // TODO: delete once db is implemented
  storeRecipe(title: string, recipe: any): void {
    this.recipes.push({
      title: title,
      recipe: recipe
    })
  }

  getRecipe(title: string): void {
    return this.recipes.find(r => r.title === title)
  }
}
