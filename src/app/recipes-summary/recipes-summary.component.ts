import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from '../core/services/data-service.service'
import { Subscription, BehaviorSubject } from 'rxjs'
import { Router } from '@angular/router'
import { parse } from 'papaparse'
import { flatten, rest, some, uniq } from 'underscore'
import { RecipeService } from 'src/app/core/services/recipe.service'

@Component({
  selector: 'app-recipes-summary',
  templateUrl: './recipes-summary.component.html',
  styleUrls: ['./recipes-summary.component.scss'],
})
export class RecipesSummaryComponent implements OnInit, OnDestroy {
  fake_links: string[] = [
    'https://www.foodandwine.com/recipes/strawberry-rhubarb-cornmeal-skillet-cake', // recipe detail page error
    'https://www.bonappetit.com/recipe/chicken-piccata-2',
    'https://www.allrecipes.com/recipe/273236/ninas-filipino-fried-rice/',
    'https://www.bonappetit.com/recipe/thai-roast-chicken-thighs-with-coconut-rice',
    'https://www.bonappetit.com/recipe/baked-minty-rice-with-feta-and-pomegranate-relish',
    'https://www.allrecipes.com/recipe/235000/thai-yellow-chicken-curry/',
    'https://www.allrecipes.com/recipe/16354/easy-meatloaf/',
    // 'https://www.seriouseats.com/recipes/2017/06/ghana-west-african-peanut-stew-chicken-groundnut-soup.html',
  ]
  links: string[] = []
  linksTextInput: string = ''
  recipes: any[] = [] // [ { link: string, data: object }]
  uploadedFiles: any
  user: any

  // error booleans
  noLinks: boolean = false
  duplicateLinks: boolean = false
  loading: boolean = false

  spreadsheetMimes: string[] = [
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'text/tsv',
  ]

  authSubscription: Subscription = new Subscription()
  recipesSubscription: Subscription = new Subscription()
  recipeScraperSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    private router: Router,
    private recipeService: RecipeService
  ) {}

  ngOnInit() {
    if (this.isSessionStorage()) {
      this.recipes = this.dataService.getRecipesDB()
    } else {
      this.authSubscription = this.recipeService.authBehaviorSubject.subscribe(
        (user: any) => {
          if (user) {
            this.user = user
            this.recipesSubscription = this.recipeService
              .getRecipesList()
              .subscribe(
                (res) => {
                  this.recipes = res
                  this.dataService.storeRecipesDB(res)
                },
                (error) => {
                  console.log(error)
                }
              )
            this.authSubscription.unsubscribe()
          }
        }
      )
    }
  }

  ngOnDestroy(): void {
    if (this.recipeScraperSubscription) {
      this.recipeScraperSubscription.unsubscribe()
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe()
    }
    if (this.recipesSubscription) {
      this.recipesSubscription.unsubscribe()
    }
  }

  convertButton() {
    this.listLinks()
    this.listRecipes()
  }

  retry(recipe: any): void {
    // retry scraping a recipe
    recipe.status = 'loading'
    this.getRecipe(recipe)
  }

  retryMany(): void {
    // search recipes for any incomplete/errors and retry scraping their recipes
    for (let recipe of this.recipes) {
      if (recipe.status !== 'complete') {
        this.retry(recipe)
      }
    }
  }

  listLinks() {
    // populates this.links with links from text and file inputs
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

  listRecipes(): void {
    // iterate over links, checking if they're already in recipes, and if not then getting the recipe for it
    // also stores in session storage
    for (let link of this.links) {
      if (link) {
        if (this.recipes.some((r) => r.link === link)) {
          this.duplicateLinks = true
        } else {
          let recipe = {
            name: '',
            link: link,
            data: {},
            status: 'loading',
            // confirmedIngredients: [],
          }
          this.recipes.push(recipe)
        }
      }
    }
    for (let recipe of this.recipes) {
      if (recipe.status !== 'loading') {
      } else {
        this.getRecipe(recipe)
      }
    }
    this.dataService.storeRecipesDB(this.recipes)
  }

  getRecipe(recipe: any): void {
    // scrape recipe for a link
    this.loading = true
    this.recipeScraperSubscription = this.dataService
      .getScrapedRecipe(recipe.link)
      .subscribe(
        (res) => {
          if ((res as any).value) {
            recipe.data = (res as any).value
            recipe.name = recipe.data.name
            recipe.status = 'complete'
            this.loading = false
            this.storeRecipeFireDB(recipe)
          } else {
            console.log(res)
            recipe.status = 'error'
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

  checkIfUrl(str: string) {
    let geturl = new RegExp(
      '((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))',
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
    let title = recipe.data.name.replace('-', '^')
    title = title.replace(/ /g, '-')
    this.router.navigate(['/recipe', title])
  }

  isSessionStorage(): boolean {
    return sessionStorage.length > 0
  }

  clearSession(): void {
    sessionStorage.clear()
  }

  storeRecipeFireDB(recipe: any): void {
    this.recipeService.createRecipe(recipe)
  }
}
