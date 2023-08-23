import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from '../core/services/data-service.service'
import { Subscription } from 'rxjs'
import { Router } from '@angular/router'
import { parse } from 'papaparse'
import { flatten, some, uniq } from 'underscore'
import { RecipeDetailsModalComponent } from 'src/app/recipe-details-modal/recipe-details-modal.component'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import clone from 'just-clone'

@Component({
  selector: 'app-recipes-summary',
  templateUrl: './recipes-summary.component.html',
  styleUrls: ['./recipes-summary.component.scss'],
})
export class RecipesSummaryComponent implements OnInit, OnDestroy {
  fake_links: string[] = [
    'https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html',
    'https://www.seriouseats.com/recipes/2021/01/banh-trang-nuong-grilled-vietnamese-rice-paper.html',
    'https://www.seriouseats.com/recipes/2021/01/fried-plantain-chips.html',
    'https://www.seriouseats.com/recipes/2017/02/detroit-style-pizza-recipe.html',
    'https://www.seriouseats.com/recipes/2017/06/ghana-west-african-peanut-stew-chicken-groundnut-soup.html',
  ]
  links: string[] = []
  linksTextInput: string = ''
  recipes: any[] = [] // [ { link: string, data: object }]
  uploadedFiles: any
  title: string = ''

  // error booleans
  noLinks: boolean = false
  duplicateLinks: boolean = false
  loading: boolean = false
  show: boolean = false

  // new (previous recipe-details)
  recipeData: any = []
  ingredientsNlp: string = ''
  recipeNutrition: any = []
  fullApiResult: any = {}
  ingredientNutrition: any = {}
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
  detailsLoading: boolean = true

  spreadsheetMimes: string[] = [
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'text/tsv',
  ]

  recipeScraperSubscription: Subscription = new Subscription()
  nutritionixFoodByIdSubscription: Subscription = new Subscription()
  nutritionixNlpSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    private router: Router,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    // if (this.isSessionStorage()) {
    //   let sessionKeys = Object.keys(sessionStorage)
    //   for (let recipeKey in sessionKeys) {
    //     let recipeName = sessionKeys[recipeKey]
    //     // use getRecipeDB here
    //     let recipe = sessionStorage.getItem(recipeName)
    //     this.recipes.push(JSON.parse(recipe || '{}'))
    //   }
    // }
    // this.links = this.fake_links
    // this.test() // TODO: comment out
  }

  ngOnDestroy(): void {
    if (this.recipeScraperSubscription) {
      this.recipeScraperSubscription.unsubscribe()
    }
  }

  test() {
    this.linksTextInput =
      'https://www.seriouseats.com/negroni-cocktail-recipe-gin-campari-vermouth'
    this.convertButton()
  }

  convertButton() {
    this.title = ''
    this.listLinks()
    this.listRecipes()
    // this.checkVariables()
  }

  checkVariables() {
    console.log('links')
    console.log(this.links)
    console.log('linksTextInput')
    console.log(this.linksTextInput)
    console.log('recipes: ')
    console.log(this.recipes)
  }

  // retry scraping a recipe
  retry(recipe: any): void {
    recipe.status = 'loading'
    this.getRecipe(recipe)
  }

  // search recipes for any incomplete/errors and retry scraping their recipes
  retryMany(): void {
    for (let recipe of this.recipes) {
      if (recipe.status !== 'complete') {
        this.retry(recipe)
      }
    }
  }

  // populates this.links with links from text and file inputs
  listLinks() {
    this.links = []
    this.noLinks = false
    this.duplicateLinks = false

    if (this.linksTextInput) {
      let inputLinks = this.splitLinks(this.linksTextInput)
      this.addToLinks(inputLinks)
    }
    if (this.uploadedFiles) {
      this.addToLinks(this.uploadedFiles)
    }

    if (this.links.length < 1) {
      this.noLinks = true
    }
  }

  // iterate over links, checking if they're already in recipes, and if not then getting the recipe for it
  listRecipes(): void {
    for (let link of this.links) {
      if (link) {
        if (this.recipes.some((r) => r.link === link)) {
          this.duplicateLinks = true
        } else {
          let recipe = {
            link: link,
            original_data: {},
            filter_data: {},
            status: 'loading',
          }
          this.recipes.push(recipe)
          this.getRecipe(recipe)
        }
      }
    }
  }

  // scrape recipe for a link
  getRecipe(recipe: any): void {
    this.loading = true
    this.recipeScraperSubscription = this.dataService
      .getScrapedRecipe(recipe.link)
      .subscribe(
        (res) => {
          if ((res as any).value) {
            // console.log('res')
            // console.log(res)
            recipe.original_data = (res as any).value
            recipe.filter_data = clone((res as any).value)
            recipe.status = 'complete'
            this.dataService.storeRecipeDB(recipe)
            this.loading = false
            this.openRecipeDetails(recipe)
            this.show = true
          } else {
            recipe.status = 'error'
            console.log('no recipe')
          }
          this.recipeScraperSubscription.unsubscribe()
        },
        (err) => {
          console.log(err)
          recipe.status = 'error'
          this.recipeScraperSubscription.unsubscribe()
        }
      )
  }

  splitLinks(rawLinks: string) {
    let splitLinks = this.checkIfUrl(rawLinks)
    if (splitLinks) {
      // splitLinks.forEach(function(item: string, index: number, links: string[]) { links[index] = item.replace(/\s/g, '') });
      return splitLinks
    } else {
      return ['']
    }
  }

  // slightly pointless, bad links get through
  checkIfUrl(str: string) {
    let geturl = new RegExp(
      '((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))',
      // one below gets bothered by things before the https
      // "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
      'g'
    )
    return str.match(geturl)
  }

  addToLinks(links: string[]) {
    this.links = this.links.concat(links).filter((l) => {
      return l
    })
  }

  anyIncomplete(): boolean {
    return (
      this.recipes.length > 0 &&
      this.recipes.some((r) => r.status !== 'complete')
    )
  }

  handleFileInput(e: any) {
    let files = e.target.files
    if (files.item(0)) {
      let fileToUpload = files.item(0)
      if (this.spreadsheetMimes.includes(fileToUpload.type)) {
        parse(fileToUpload, {
          complete: (res) => {
            this.uploadedFiles = flatten(res.data) || ['']
          },
          error: (err) => {
            console.log(err)
          },
        })
      } else {
        let reader: FileReader = new FileReader()
        reader.onload = (e) => {
          let fileString: any = reader.result
          this.uploadedFiles = this.splitLinks(fileString) || ['']
        }
        reader.readAsText(fileToUpload)
      }
    }
  }

  openRecipeDetails(recipe: any): void {
    this.recipeData = recipe
    this.ingredientsNlp = ''
    for (let ingredient of recipe.original_data.recipeIngredients) {
      this.ingredientsNlp = this.ingredientsNlp.concat('\n', ingredient)
    }
    this.detailsLoading = true
    // let res = this.resFAKE //  use for mock data
    // this.openModal(res)    //  use for mock data
    this.nutritionixNlpSubscription = this.dataService
      .getFoodByNlp(this.ingredientsNlp)
      .subscribe(
        (res) => {
          this.title = recipe.original_data.name
          this.openModal(res)
          // console.log('res')
          // console.log(res)
          this.nutritionixNlpSubscription.unsubscribe()
        },
        (err) => {
          console.log(err)
          this.nutritionixNlpSubscription.unsubscribe()
        }
      )
  }

  // opens recipe-details-modal, passes recipe ingredient API results for user edit and submission
  openModal(res: any) {
    const modalRef = this.modalService.open(RecipeDetailsModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })
    modalRef.componentInstance.fullApiResult = res
    modalRef.componentInstance.recipeTitle = this.title

    modalRef.result.then((confirmedIngredients) => {
      this.recipeNutrition = confirmedIngredients
      this.calculateSums(this.recipeNutrition)
      this.detailsLoading = false
    })
  }

  // adds (desired) nutrition of each ingredient together, rounds
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

  isSessionStorage(): boolean {
    return sessionStorage.length > 0
  }

  clearSession(): void {
    sessionStorage.clear()
  }

  testing(): void {}
}
