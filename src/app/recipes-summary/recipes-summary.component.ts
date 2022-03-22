import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from '../core/services/data-service.service'
import { Subscription } from 'rxjs'
import { Router } from '@angular/router'
import { parse } from 'papaparse'
import { flatten, some, uniq } from 'underscore'

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

  recipeScraperSubscription: Subscription = new Subscription()

  constructor(private dataService: DataService, private router: Router) {}

  ngOnInit() {
    if (this.isSessionStorage()) {
      let sessionKeys = Object.keys(sessionStorage)
      for (let recipeKey in sessionKeys) {
        let recipeName = sessionKeys[recipeKey]
        // use getRecipeDB here
        let recipe = sessionStorage.getItem(recipeName)
        this.recipes.push(JSON.parse(recipe || '{}'))
      }
    }
    this.links = this.fake_links
  }

  ngOnDestroy(): void {
    if (this.recipeScraperSubscription) {
      this.recipeScraperSubscription.unsubscribe()
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
    console.log(this.links)

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
    for (let link of this.links) {
      if (link) {
        if (this.recipes.some((r) => r.link === link)) {
          this.duplicateLinks = true
        } else {
          let recipe = {
            link: link,
            data: {},
            status: 'loading',
          }
          this.recipes.push(recipe)
          this.getRecipe(recipe)
        }
      }
    }
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
            recipe.status = 'complete'
            this.dataService.storeRecipeDB(recipe)
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
    let title = recipe.data.name.replace(/ /g, '-')
    this.router.navigate(['/recipe', title])
  }

  isSessionStorage(): boolean {
    return sessionStorage.length > 0
  }

  clearSession(): void {
    sessionStorage.clear()
  }

  testing(): void {}
}
