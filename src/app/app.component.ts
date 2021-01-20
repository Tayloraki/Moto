import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  fake_links: string[] = [
    'https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html',
    'https://www.seriouseats.com/recipes/2021/01/banh-trang-nuong-grilled-vietnamese-rice-paper.html',
    'https://www.seriouseats.com/recipes/2021/01/fried-plantain-chips.html',
  ]
  links: string[] = []
  linksInput: string = ''
  noLinks: boolean = false

  constructor() { }

  ngOnInit(): void { }

  listLinks() {
    console.log(this.linksInput)
    // split() strings into different links
    // iterate over each link and check if they are a valid URL (look at all the different ways to iterate)
    // if they're not a valid URL, show an error message and don't pass THOSE invalid URLs into table
    // otherwise, pass valid links into table of links as hrefs
    // console.log(this.validURL(this.linksInput))
    // this.linksInput = "https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html, https://www.seriouseats.com/recipes/2021/01/banh-trang-nuong-grilled-vietnamese-rice-paper.html,  https://www.seriouseats.com/recipes/2021/01/fried-plantain-chips.html"
    let splitLinks = this.checkIfUrl(this.linksInput)
    console.log(splitLinks)
    // read about for..in vs for...of vs forEach() vs map
    // read about pass by value vs pass by reference in js
    // TODO: parsing breaks with no spaces, ''s - make sure it works for lists separated by commas and linebreaks and then conditionally show error message

    if (splitLinks) {
      splitLinks.forEach(function(item: string, index: number, links: string[]) { links[index] = item.replace(/\s/g, '') });
      console.log(splitLinks)
      this.addToLinks(splitLinks)
    } else {
      console.log("no links")
      this.noLinks = true
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
    // TODO: check for duplicates and append to end of links array
    this.links = links
  }
}
