import { Component, OnInit } from '@angular/core';

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
  allLinksRaw = ''
  linksTextInput: string = ''
  noLinks: boolean = false
  fileToUpload
  fileString: string = ''

  constructor() {
  }

  ngOnInit(): void { }

  listLinks() {
    console.log(this.linksTextInput)
    console.log(this.allLinksRaw)
    console.log(typeof this.links)
    this.allLinksRaw = this.allLinksRaw.concat(this.linksTextInput)
    // this.linksInput = "https://www.seriouseats.com/recipes/2021/01/crispy-fried-garlic-garlic-oil.html, https://www.seriouseats.com/recipes/2021/01/banh-trang-nuong-grilled-vietnamese-rice-paper.html,  https://www.seriouseats.com/recipes/2021/01/fried-plantain-chips.html"
    let splitLinks = this.checkIfUrl(this.allLinksRaw)
    console.log(splitLinks)
    
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
    this.links = this.arrayNoRepeats(this.links.concat(links))
  }

  arrayNoRepeats(array: string[]) {
    let uniqueArray = array.concat()
    for(let i=0; i<uniqueArray.length; ++i) {
        for(var j=i+1; j<uniqueArray.length; ++j) {
            if(uniqueArray[i] === uniqueArray[j])
            uniqueArray.splice(j--, 1)
        }
    }
    return uniqueArray
  }

  handleFileInput(files: FileList) {
    if (files.item(0)) {
      this.fileToUpload = files.item(0)
      console.log(this.fileToUpload)
      let reader: FileReader = new FileReader()
      reader.onload = (e) => {
        console.log(reader.result);
        this.fileString = reader.result;
        console.log(this.fileString)
        this.allLinksRaw = this.allLinksRaw.concat(this.fileString)
      };
      reader.readAsText(this.fileToUpload)

    // TODO:
      // Use File Reader (or something else or nothing) to parse the File for links
      // Write an algorithm to extract links from parsed File
      // Populate the table with the bookmarked links
      // Display an error if user tries to import duplicate links
      // Enable importing from a CSV, excel, etc.
    }
  }
}
