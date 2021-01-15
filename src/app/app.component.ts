import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  links: string[] = ['link1', 'link2', 'link3']

  constructor() { }

  ngOnInit(): void {

  }
}
