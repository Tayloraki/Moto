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
    // https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html,
    // https://www.seriouseats.com/recipes/2021/01/banh-trang-nuong-grilled-vietnamese-rice-paper.html,
    // https://www.seriouseats.com/recipes/2021/01/fried-plantain-chips.html,
  ]
  links: string[] = []
  linksInput: string = ''
  noLinks: false

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

    if( splitLinks ) {
      splitLinks.forEach(function(item, index, links) { links[index] = item.replace(/\s/g, '') });
      console.log(splitLinks)
      this.links = splitLinks
    } else {
      console.log("no links")
      this.noLinks = true
    }
  }

  // validURL(str) {    obselete from checkIfUrl()
  //   var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  //     '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  //     '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  //     '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  //     '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  //     '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  //   return !!pattern.test(str);
  // }

  checkIfUrl(str) {
    var str;
    var geturl = new RegExp(
      "((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
      // one below gets bothered by things before the https
      // "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
      ,"g"
      );
    return str.match(geturl)
  }
}
