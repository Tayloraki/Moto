import { Component, OnInit } from '@angular/core'
import { Subscription } from 'rxjs'
import { DataService } from '../core/services/data-service.service'
import { Output, EventEmitter } from '@angular/core'

@Component({
  selector: 'app-ingredient-search',
  templateUrl: './ingredient-search.component.html',
  styleUrls: ['./ingredient-search.component.scss'],
})
export class IngredientSearchComponent implements OnInit {
  @Output() selectResult = new EventEmitter<object>()

  searchInput: string = ''
  searchResults: any[] = []
  // searchResults: any[] = [{ food_name: 1 }, { food_name: 2 }, { food_name: 3 }]

  searching: boolean = false
  noResults: boolean = false

  nutritionixSearchSubscription: Subscription = new Subscription()

  constructor(private dataService: DataService) {}

  ngOnInit(): void {}

  // API call for ingredients by search input (NO NUTRITION RETURN)
  searchIngredient() {
    this.nutritionixSearchSubscription = this.dataService
      .searchIngredient(this.searchInput)
      .subscribe(
        (res) => {
          if (res.common.length === 0) {
            this.noResults = true
          } else {
            this.noResults = false
            this.searching = true
            this.searchResults = res.common
          }
          this.nutritionixSearchSubscription.unsubscribe()
        },
        (err) => {
          console.log(err)
          this.nutritionixSearchSubscription.unsubscribe()
        }
      )
  }

  // sends user selected search result to modal for handling
  selectIngredient(ingredient: any) {
    this.selectResult.emit(ingredient)
  }

  closeTable() {
    this.searching = false
  }
}
