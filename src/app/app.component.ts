import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from './core/services/data-service.service'
import { Subscription } from 'rxjs'
import { parse } from 'papaparse'
import { flatten } from 'underscore'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  fake_links: string[] = [
    'https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html',
    'https://www.seriouseats.com/recipes/2021/01/banh-trang-nuong-grilled-vietnamese-rice-paper.html',
    'https://www.seriouseats.com/recipes/2021/01/fried-plantain-chips.html',
  ]
  links: string[] = []
  linksTextInput: string = ''
  recipes: any[] = [] // [ { link: string, data: object }]
  uploadedFiles: any

  // error booleans
  noLinks: boolean = false
  duplicateLinks: boolean = false

  spreadsheetMimes: string[] = ['application/vnd.ms-excel','text/plain','text/csv','text/tsv']

  recipeScraperSubscription: Subscription = new Subscription()

  // googleDocSubscription: Subscription = new Subscription()

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
  }

  // ngOnInit(): void {
    // this.links = this.fake_links
  //   this.recipeScraperSubscription = this.dataService.getScrapedRecipe('https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html').subscribe(
  //     res => {
  //       console.log(res)
  //       this.recipeScraperSubscription.unsubscribe()
  //     }, err => {
  //       console.log(err)
  //       this.recipeScraperSubscription.unsubscribe()
  //     }
  //   )
  // }

  ngOnDestroy(): void {
    if (this.recipeScraperSubscription) {
      this.recipeScraperSubscription.unsubscribe()
    }
  }

  activateButton() {
    this.listLinks()
    this.listRecipes()
  }

  listLinks() {
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

  listRecipes() {
    for (let link of this.links) {
      if (link) {
        let recipe = {
          'link': link,
          'data': {}
        }
        this.recipes.push(recipe)
        this.getRecipe(recipe)
      }
    }
  }

  getRecipe(recipe: any): void {
    this.recipeScraperSubscription = this.dataService.getScrapedRecipe(recipe.link).subscribe(
      res => {
        console.log(res)
        if ((res as any).value) recipe.data = (res as any).value
        this.recipeScraperSubscription.unsubscribe()
      }, err => {
        console.log(err)
        this.recipeScraperSubscription.unsubscribe()
      }
    )
  }

  // getGoogleDoc() {
  //   this.googleDocSubscription = this.dataService.getGoogleDoc(googleDocLink).subscribe(
  //     res => {
  //       console.log(res)
  //       if ((res as any).value) googleDocTable = (res as any)
  //       this.googleDocSubscription.unsubscribe()
  //     }, err => {
  //       console.log(err)
  //       this.googleDocSubscription.unsubscribe()
  //     }
  //   )
  // }

  handleFileInput(e: any) {
    let files = e.target.files
    if (files.item(0)) {
      let fileToUpload = files.item(0)
      if (this.spreadsheetMimes.includes(fileToUpload.type)) {
        parse(fileToUpload, {
          complete: res => {
            console.log(res)
            this.uploadedFiles = flatten(res.data) || ['']
          },
          error: err => {
            console.log(err)
          }
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
      "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
      // one below gets bothered by things before the https
      // "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
      ,"g"
      );
    return str.match(geturl)
  }

  addToLinks(links: string[]) {
    this.links = this.arrayNoRepeats(this.links.concat(links)).filter(l => { return l })
  }

  arrayNoRepeats(array: string[]) {
    let uniqueArray = array.concat()
    for (let i = 0; i < uniqueArray.length; ++i) {
        for (let j= i+ 1; j < uniqueArray.length; ++j) {
            if (uniqueArray[i] === uniqueArray[j]) {
              uniqueArray.splice(j--, 1)
              this.duplicateLinks = true
            }
        }
    }
    return uniqueArray
  }
}
