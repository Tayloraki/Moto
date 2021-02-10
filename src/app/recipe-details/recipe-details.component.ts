import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { DataService } from '../core/services/data-service.service'

@Component({
  selector: 'app-recipe-details',
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.scss'],
})
export class RecipeDetailsComponent implements OnInit {
  title: string = 'nothing'
  recipeData: any = {}

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.title = this.route.snapshot.params.title
    this.title = this.title.split('-').join(' ')
    this.recipeData = this.dataService.getRecipeDB(this.title)
  }
}
