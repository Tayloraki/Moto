import { Component, Input, OnInit, OnChanges } from '@angular/core'
import { DataService } from '../core/services/data-service.service'

@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit, OnChanges {
  ingredientsNlp: string = ''
  @Input() recipeDetails: any = {}
  finalIngredients: any = []
  ingredientNutrition: any = {}
  recipeTitle: any = ''

  keys: string[] = [
    'nf_calories',
    'nf_cholesterol',
    'nf_dietary_fiber',
    'nf_potassium',
    'nf_protein',
    'nf_saturated_fat',
    'nf_sodium',
    'nf_sugars',
    'nf_total_carbohydrate',
    'nf_total_fat',
  ]
  sums: any = {
    nf_calories: { total: 0, niceName: 'Calories' },
    nf_cholesterol: { total: 0, niceName: 'Cholesterol (mg)' },
    nf_dietary_fiber: { total: 0, niceName: 'Dietary Fiber (g)' },
    nf_potassium: { total: 0, niceName: 'Potassium (mg)' },
    nf_protein: { total: 0, niceName: 'Protein (g)' },
    nf_saturated_fat: { total: 0, niceName: 'Saturated Fat (mg)' },
    nf_sodium: { total: 0, niceName: 'Sodium (mg)' },
    nf_sugars: { total: 0, niceName: 'Sugars (g)' },
    nf_total_carbohydrate: { total: 0, niceName: 'Carbohydrates (g)' },
    nf_total_fat: { total: 0, niceName: 'Fat (g)' },
  }
  figureData: any = []
  ingredientSums: any = {
    nf_calories: { total: 0, niceName: 'Calories' },
    nf_cholesterol: { total: 0, niceName: 'Cholesterol' },
    nf_dietary_fiber: { total: 0, niceName: 'Dietary Fiber' },
    nf_potassium: { total: 0, niceName: 'Potassium' },
    nf_protein: { total: 0, niceName: 'Protein' },
    nf_saturated_fat: { total: 0, niceName: 'Saturated Fat' },
    nf_sodium: { total: 0, niceName: 'Sodium' },
    nf_sugars: { total: 0, niceName: 'Sugars' },
    nf_total_carbohydrate: { total: 0, niceName: 'Carbohydrates' },
    nf_total_fat: { total: 0, niceName: 'Fat' },
  }

  // error booleans
  loading: boolean = false
  show: boolean = false // currently not called

  // mock data for testing
  fakeNlpRecipe: any = {}
  fakeFoodId: string = '513fc9e73fe3ffd40300109f'
  fakeIngredientsNlp: string =
    'for breakfast i ate 2 eggs, bacon, a tomato, a grapefruit and half a cup of fish sauce'
  fakeIngredient: any = {}

  recipesPath: string = '/recipes/'
  @Input() recipeKey: string | undefined
  recipeYield: any

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.setRecipe()
    // this.checkVariables()
  }

  ngOnChanges(): void {
    this.setRecipe()
  }

  setRecipe(): void {
    console.log(this.recipeDetails)
    this.finalIngredients = this.recipeDetails.final_ingredients
    this.recipeTitle = this.recipeDetails.original_data.name
    this.recipeYield = this.recipeDetails.filter_data.recipeYield
    this.calculateSums(this.finalIngredients)
    this.openFigures(this.sums)
  }

  checkVariables(): void {
    console.log('this.finalIngredients:')
    console.log(this.finalIngredients)
  }

  // // adds (desired) nutrition of each ingredient together, rounds
  calculateSums(recipeIngredients: any) {
    this.sums = {
      nf_calories: { total: 0, niceName: 'Calories' },
      nf_cholesterol: { total: 0, niceName: 'Cholesterol (mg)' },
      nf_dietary_fiber: { total: 0, niceName: 'Dietary Fiber (g)' },
      nf_potassium: { total: 0, niceName: 'Potassium (mg)' },
      nf_protein: { total: 0, niceName: 'Protein (g)' },
      nf_saturated_fat: { total: 0, niceName: 'Saturated Fat (mg)' },
      nf_sodium: { total: 0, niceName: 'Sodium (mg)' },
      nf_sugars: { total: 0, niceName: 'Sugars (g)' },
      nf_total_carbohydrate: { total: 0, niceName: 'Carbohydrates (g)' },
      nf_total_fat: { total: 0, niceName: 'Fat (g)' },
    }
    for (let ingredient of recipeIngredients) {
      for (let property in this.sums) {
        this.sums[property].total += ingredient[property]
      }
    }
    for (let property in this.sums) {
      this.sums[property].total =
        Math.round(this.sums[property].total * 10) / 10
    }
  }

  // populates dataset with (desired) nutrition of specific ingredient for table display
  openIngredient(ingredient: any) {
    this.ingredientNutrition = ingredient
    for (let property in this.ingredientSums) {
      this.ingredientSums[property].total = this.ingredientNutrition[property]
    }
  }

  // empties specific ingredient dataset to remove table display
  closeIngredient() {
    this.ingredientNutrition = {}
  }

  // populates this.figureData to display and pass to figure component
  openFigures(recipeData: any) {
    this.figureData = []
    for (let property in recipeData) {
      this.figureData.push(this.sums[property])
    }
  }
}
