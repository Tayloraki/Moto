import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { Subscription } from 'rxjs'
import { DataService } from '../core/services/data-service.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { isEmpty, without } from 'underscore'

@Component({
  selector: 'app-recipe-details-modal',
  templateUrl: './recipe-details-modal.component.html',
  styleUrls: ['./recipe-details-modal.component.scss'],
})
export class RecipeDetailsModalComponent implements OnInit {
  @Input() IngredientApiReturn: any[] = []
  @Input() recipeTitle: string = ''
  // @Input() userPrompt: boolean
  // @Output() userSelect = new EventEmitter()
  recipeData: any = {}
  @Input() servingSize: number = 1 // original recipeYield
  userSetSize: number = 1 // user-set recipeYield

  gotIngredients: any[] = []
  errorIngredients: any[] = []

  allIngredientResults: any[] = []
  finalIngredients: any[] = []
  modalOutput: any

  nutritionixNlpSubscription: Subscription = new Subscription()

  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.errorIngredients = (this.IngredientApiReturn as any).errors
    this.gotIngredients = (this.IngredientApiReturn as any).foods
    this.userSetSize = this.servingSize
    // this.checkVariables()
    for (let ingredient of this.errorIngredients) {
      let ingredientNlp = ingredient.original_text
      if (ingredient.err_code === 100) {
        this.nutritionixNlpSubscription = this.dataService
          .getIngredientByNlp(ingredientNlp)
          .subscribe(
            (res) => {
              this.error100IngredientByResults(ingredientNlp, res)
              this.nutritionixNlpSubscription.unsubscribe()
            },
            (err) => {
              console.log(err)
              this.nutritionixNlpSubscription.unsubscribe()
            }
          )
      } else if (ingredient.err_code === 101) {
        this.error101IngredientByResults(ingredientNlp)
      }
    }
    for (let ingredient of this.gotIngredients) {
      this.gotIngredientByResults(ingredient)
    }
  }

  checkVariables(): void {
    console.log('this.recipeData:')
    console.log(this.recipeData)
    console.log('this.servingSize:')
    console.log(this.servingSize)
  }

  // creates dataset of original ingredient description/ MULTIPLE potential ingredient nutrition from API/ empty field for
  // user selected ingredient nutrition
  error100IngredientByResults(recipeIngredient: any, ingredientsAPI: any) {
    let ingredientResults = {
      recipeIngredient: recipeIngredient,
      candidates: ingredientsAPI.foods,
      selected: {},
    }
    this.allIngredientResults.push(ingredientResults)
  }

  // adds no return error ingredients to ingredientataset for display purposes in the modal
  // for user ingredient search
  error101IngredientByResults(recipeIngredient: any) {
    let ingredientResults = {
      recipeIngredient: recipeIngredient,
      candidates: [],
      selected: {},
    }
    this.allIngredientResults.push(ingredientResults)
  }

  // adds "got" ingredients to error ingredient selection dataset for display purposes in the modal (for
  // false ingredient removal)
  gotIngredientByResults(ingredient: any) {
    let ingredientResults = {
      recipeIngredient: ingredient.metadata.original_input,
      candidates: [],
      selected: ingredient,
    }
    this.allIngredientResults.push(ingredientResults)
  }

  // user select a ingredient candidate
  confirmIngredient(ingredient: any, ingredientResult: any) {
    ingredient.selected = ingredientResult
    ingredient.selected.metadata.original_input = ingredient.recipeIngredient
  }

  // add all selected candidates to array of successfully got ingredients, finalIngredients used as confirmedIngredients in parent component
  confirmAllIngredient() {
    for (let ingredient of this.allIngredientResults) {
      this.finalIngredients.push(ingredient.selected)
    }
    this.modalOutput = {
      finalIngredients: this.finalIngredients,
      userSetSize: this.userSetSize,
    }
  }

  deleteIngredient(ingredient: any) {
    this.allIngredientResults = without(this.allIngredientResults, ingredient)
  }

  // boolean value if user has selected for all error ingredients
  allConfirmed(): boolean {
    return this.allIngredientResults.some((r) => isEmpty(r.selected))
  }

  // gets nutrition for selected search result ingredient
  getSearch(ingredient: any, recipeIngredient: any) {
    let ingredientName = ingredient.food_name
    this.nutritionixNlpSubscription = this.dataService
      .getIngredientByNlp(ingredientName)
      .subscribe(
        (res) => {
          this.searchIngredientByResults(res, recipeIngredient)
          this.nutritionixNlpSubscription.unsubscribe()
        },
        (err) => {
          console.log(err)
          this.nutritionixNlpSubscription.unsubscribe()
        }
      )
  }

  // updates error 101 ingredient with selected search result nutrition
  searchIngredientByResults(res: any, recipeIngredient: any) {
    let ingredient = res.foods[0]
    let ingredientIndex = this.allIngredientResults.findIndex(
      (ingredientObj) => ingredientObj.recipeIngredient == recipeIngredient
    )
    this.allIngredientResults[ingredientIndex].selected = ingredient
    this.allIngredientResults[
      ingredientIndex
    ].selected.metadata.original_input = recipeIngredient
  }

  // gets nutrition for selected search result ingredient
  // for user added ingredient
  addSearch(ingredient: any) {
    let ingredientName = ingredient.food_name
    this.nutritionixNlpSubscription = this.dataService
      .getIngredientByNlp(ingredientName)
      .subscribe(
        (res) => {
          this.addSearchIngredientByResults(res)
          this.nutritionixNlpSubscription.unsubscribe()
        },
        (err) => {
          console.log(err)
          this.nutritionixNlpSubscription.unsubscribe()
        }
      )
  }

  // adds non-recipe search result ingredients to error ingredient selection dataset for display purposes in the modal
  addSearchIngredientByResults(res: any) {
    let ingredient = res.foods[0]
    let ingredientResults = {
      recipeIngredient: ingredient.food_name,
      candidates: [],
      selected: ingredient,
    }
    ingredientResults.selected.metadata.original_input = ingredient.food_name
    this.allIngredientResults.push(ingredientResults)
  }
}
