import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from '../core/services/data-service.service'
import { Subscription } from 'rxjs'
import { parse } from 'papaparse'
import { flatten } from 'underscore'
import { RecipeDetailsModalComponent } from 'src/app/recipe-details-modal/recipe-details-modal.component'
import { NgbModal, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import clone from 'just-clone'

@Component({
  selector: 'app-recipes-summary',
  templateUrl: './recipes-summary.component.html',
  styleUrls: ['./recipes-summary.component.scss'],
})
export class RecipesSummaryComponent implements OnInit, OnDestroy {
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

  selectRecipe: any = []
  ingredientsNlp: string = ''
  recipeNutrition: any = []
  IngredientApiReturn: any = {}
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

  // firebase
  usersPath: string = '/users/'
  recipesPath: string = '/recipes/'
  ingredientsPath: string = '/final_ingredients/'
  linksPath: string = '/links/'
  userLinks: any | undefined
  userLinksArray: any | undefined
  savedLink: boolean = false
  loadedLink: boolean = false
  recipeKey: string | undefined
  recipeLink: string = ''

  userLogin: any = {}

  spreadsheetMimes: string[] = [
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'text/tsv',
  ]

  recipeScraperSubscription: Subscription = new Subscription()
  nutritionixFoodByIdSubscription: Subscription = new Subscription()
  nutritionixNlpSubscription: Subscription = new Subscription()
  userSubscription: Subscription = new Subscription()
  userLinksSubscription: Subscription = new Subscription()
  signInSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.userSubscription = this.dataService.getUser().subscribe(
      (res) => {
        this.userLogin = res
        if (this.userLogin.uid && this.userLogin.uid !== 'new') {
          if (this.isSessionStorage()) {
            // checks session storage for new-user recipes for firebase storage
            let nonUserData: any = { ...sessionStorage }
            let nonUserDataKeys: any = Object.keys(nonUserData)
            for (let key of nonUserDataKeys) {
              let recipe = this.dataService.getRecipeDB(key)
              this.dataService.removeRecipeDB(recipe)
              recipe.user = this.userLogin.uid
              let tempRecipeKey = this.dataService.addFire(
                this.usersPath + recipe.user + this.linksPath,
                recipe.link
              )
              this.dataService.createFire(
                this.recipesPath + tempRecipeKey,
                recipe
              )
              console.log(this.userLinks)
              if (!this.userLinks) {
                this.userLinks = []
              }
              this.userLinks[tempRecipeKey] = recipe.link
            }
          }
          this.userLinksSubscription = this.dataService
            .getFireObject(this.usersPath + this.userLogin.uid + this.linksPath)
            .subscribe(
              (res) => {
                if (res) {
                  this.userLinks = res
                  this.userLinksArray = Object.keys(res)
                  this.recipes = []
                  for (let key of this.userLinksArray) {
                    let recipeLinksSubscription: Subscription = this.dataService
                      .getFireObject(this.recipesPath + key)
                      .subscribe(
                        (res) => {
                          // if ( TODO: logic unnecessary? preventing duplicates
                          //   this.userLinksArray.some(
                          //     (e: any) => e.link !== res.link
                          //   )
                          // ) {
                          if (res) {
                            this.recipes.push(res)
                          } else {
                            console.warn(
                              'user has link saved but no recipe info'
                            )
                          }
                          // }
                          recipeLinksSubscription.unsubscribe()
                        },
                        (err) => {
                          console.log(err)
                          recipeLinksSubscription.unsubscribe()
                        }
                      )
                  }
                } else {
                  this.userLinks = []
                  console.log('users had no saved recipes')
                }
                this.userLinksSubscription.unsubscribe()
              },
              (err) => {
                console.log(err)
                this.userLinksSubscription.unsubscribe()
              }
            )
        } else {
          console.log('no user')
        }
        this.recipes = []
        this.userLinks = []
        this.userSubscription.unsubscribe()
      },
      (err) => {
        console.log(err)
        this.userSubscription.unsubscribe()
      }
    )
  }

  ngOnDestroy(): void {
    if (this.isSessionStorage()) {
      // happens upon any redirect, needs to only happen when app is closed
      // this.clearSession()
      console.log('session needs to be cleared')
    }
    if (this.recipeScraperSubscription) {
      this.recipeScraperSubscription.unsubscribe()
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe()
    }
    if (this.userLinksSubscription) {
      this.userLinksSubscription.unsubscribe()
    }
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

  // each link: checking if they're already in this.recipes AND/OR firebase, and if not then getting the recipe for it
  listRecipes(): void {
    for (let link of this.links) {
      let standardLink = this.standardUrl(link)
      if (this.userLinks === null || this.userLinks === undefined) {
      } else {
        this.savedLink = Object.values(this.userLinks).includes(standardLink)
        this.loadedLink = this.recipes.some((e) => e.link === standardLink)
      }
      if (link) {
        if (this.recipes.some((r) => r.link === standardLink)) {
          this.duplicateLinks = true
        }
        if (this.savedLink && !this.loadedLink) {
          let tempRecipeKey = this.findKeyByLink(this.userLinks, standardLink)
          this.dataService
            .getFireObject(this.recipesPath + tempRecipeKey)
            .subscribe(
              (res) => {
                this.recipes.push(res)
              },
              (err) => {
                console.log(err)
              }
            )
        } else if (this.savedLink && this.loadedLink) {
        } else {
          let recipe = {
            original_data: { url: link },
            filter_data: {},
            status: 'loading',
            link: standardLink,
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
      .getScrapedRecipe(recipe.original_data.url)
      .subscribe(
        (res) => {
          if ((res as any).value) {
            recipe.original_data = (res as any).value
            recipe.filter_data = clone((res as any).value)
            recipe.status = 'complete'
            if (this.userLogin.uid && this.userLogin.uid !== 'new') {
              recipe.user = this.userLogin.uid
              let tempRecipeKey = this.dataService.addFire(
                this.usersPath + recipe.user + this.linksPath,
                recipe.link
              )
              this.dataService.createFire(
                this.recipesPath + tempRecipeKey,
                recipe
              )
              this.userLinks[tempRecipeKey] = recipe.link
            } else {
              this.dataService.storeRecipeDB(recipe)
              recipe.user = 'new'
            }
            this.loading = false
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

  standardUrl(str: string) {
    return str.split('www.')[1]
  }

  addToLinks(links: string[]) {
    this.links = this.links.concat(links).filter((l) => {
      return l
    })
  }

  anyIncomplete(): boolean {
    if (this.recipes.length > 0) {
      return this.recipes.some((r) => r.status !== 'complete')
    } else {
      return false
    }
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
    this.detailsLoading = true
    this.selectRecipe = recipe
    if (this.userLinks) {
      // if (this.userLinks && Object.keys(this.userLinks).length > 0) {
      this.recipeKey = this.findKeyByLink(
        this.userLinks,
        this.selectRecipe.link
      )
      this.savedLink = Object.values(this.userLinks).includes(
        this.selectRecipe.link
      )
    }
    this.ingredientsNlp = ''
    for (let ingredient of recipe.original_data.recipeIngredients) {
      this.ingredientsNlp = this.ingredientsNlp.concat('\n', ingredient)
    }
    if (recipe.final_ingredients) {
      this.detailsLoading = false
    } else {
      this.nutritionixNlpSubscription = this.dataService
        .getFoodByNlp(this.ingredientsNlp)
        .subscribe(
          (res) => {
            this.recipeLink = recipe.link
            this.openModal(res)
            this.nutritionixNlpSubscription.unsubscribe()
          },
          (err) => {
            console.log(err)
            this.nutritionixNlpSubscription.unsubscribe()
          }
        )
    }
  }

  // opens recipe-details-modal, passes recipe ingredient API results for user edit and submission
  openModal(res: any) {
    const modalRef = this.modalService.open(RecipeDetailsModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })
    modalRef.componentInstance.IngredientApiReturn = res
    modalRef.componentInstance.servingSize = this.selectRecipe.original_data.recipeYield
    modalRef.componentInstance.recipeTitle = this.title

    modalRef.result.then((modalOutput: any) => {
      this.selectRecipe.final_ingredients = modalOutput.finalIngredients
      this.selectRecipe.filter_data.recipeYield = modalOutput.userSetSize
      let recIndex = this.recipes.findIndex(
        (rec) => rec.link === this.selectRecipe.link
      )
      this.recipes[recIndex] = this.selectRecipe
      // ***
      if (this.userLogin.uid && this.userLogin.uid !== 'new') {
        this.dataService.updateFire(
          this.recipesPath + this.recipeKey + this.ingredientsPath,
          modalOutput.finalIngredients
        )
        this.dataService.updateFire(
          this.recipesPath + this.recipeKey + '/filter_data/recipeYield',
          modalOutput.userSetSize
        )
      } else {
        let recipe = this.dataService.getRecipeDB(
          this.selectRecipe.original_data.name
        )
        this.dataService.storeRecipeDB(this.selectRecipe)
      }
      this.detailsLoading = false
    })
  }

  isSessionStorage(): boolean {
    return sessionStorage.length > 0
  }

  clearSession(): void {
    sessionStorage.clear()
  }

  findKeyByLink(array: any, link: any) {
    return Object.keys(array).find((key) => array[key] === link)
  }
}
