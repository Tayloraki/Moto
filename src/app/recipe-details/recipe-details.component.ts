import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService } from '../core/services/data-service.service'
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit {
  title: string = 'nothing'
  recipeData: any = []
  recipeNutrition: any[] = []
  ingredientNutrition: any = {}
  allIngredientNutrition: any[] = []

  fakeFoodId: string = '513fc9e73fe3ffd40300109f'
  fakeIngredientsNlp: string =
    'for breakfast i ate 2 eggs, bacon, a tomato, a grapefruit and half a cup of fish sauce'
  fakeIngredient: any = {}

  tempRecipeNutrition: string = ''

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

  nutritionixFoodByIdSubscription: Subscription = new Subscription()
  nutritionixNlpSubscription: Subscription = new Subscription()

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.params.title
    this.title = this.title.split('-').join(' ')
    this.recipeData = this.dataService.getRecipeDB(this.title)

    for (let ingredient of this.recipeData.data.ingredients) {
      this.tempRecipeNutrition = this.tempRecipeNutrition.concat(
        ' ',
        ingredient
      )
      let ingredientByNLP = {
        recipeIngredient: ingredient,
        data: {},
      }
      this.allIngredientNutrition.push(ingredientByNLP)

      // ingredientNutrition = { }
      // this.ingredientNutrition[<name-of-ingredient>] = {<ingredient information>}
      // ingredientNutrition = { <name of ingredient>: {nutrition} }
    }
    console.log(this.allIngredientNutrition)
    console.log(this.tempRecipeNutrition)
    // let ingredientsNlp = this.fakeIngredientsNlp
    let ingredientsNlp = this.tempRecipeNutrition
    this.nutritionixNlpSubscription = this.dataService
      .getFoodByNlp(ingredientsNlp)
      .subscribe(
        (res) => {
          // console.log(Object.keys(res.foods[0]))
          this.recipeNutrition = res.foods
          this.nutritionixNlpSubscription.unsubscribe()
          console.log(this.recipeNutrition)
          this.calculateSums(this.recipeNutrition)
          this.fakeIngredient = this.recipeNutrition[0]
        },
        (err) => {
          console.log(err)
          this.nutritionixNlpSubscription.unsubscribe()
        }
      )
  }

  calculateSums(recipe: any) {
    for (let ingredient of recipe) {
      for (let property in this.sums) {
        this.sums[property].total += ingredient[property]
      }
    }
    for (let property in this.sums) {
      this.sums[property].total =
        Math.round(this.sums[property].total * 10) / 10
    }
  }

  // openIngredient(ingredient: any) {
  openIngredient() {
    this.ingredientNutrition = this.fakeIngredient
    console.log(this.ingredientNutrition)
    for (let property in this.ingredientSums) {
      this.ingredientSums[property].total = this.ingredientNutrition[property]
    }
    console.log(this.ingredientSums)
  }

  closeIngredient() {
    this.ingredientNutrition = {}
  }
}

// API CALL FOR SPECIFIC INGREDIENT
// let foodId = this.fakeFoodId
// this.nutritionixFoodByIdSubscription = this.dataService
//   .getFoodById(foodId)
//   .subscribe(
//     (res) => {
//       console.log(res)
//     },
//     (err) => {
//       console.log(err)
//     }
//   )
