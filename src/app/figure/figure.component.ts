import { Component, OnInit, Input } from '@angular/core'
import * as d3 from 'd3'
import { DataService } from '../core/services/data-service.service'

@Component({
  selector: 'app-figure',
  templateUrl: './figure.component.html',
  styleUrls: ['./figure.component.scss'],
})
export class FigureComponent implements OnInit {
  recipeData: any = []
  @Input() recipeTitle: string = ''
  @Input() figureData: any[] = []
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
  dailyValues = [
    // https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx
    { total: 2000, niceName: 'Calories' },
    { total: 300, niceName: 'Cholesterol (mg)' },
    { total: 28, niceName: 'Dietary Fiber (g)' },
    { total: 4700, niceName: 'Potassium (mg)' },
    { total: 50, niceName: 'Protein (g)' },
    { total: 20, niceName: 'Saturated Fat (mg)' },
    { total: 2300, niceName: 'Sodium (mg)' },
    { total: 50, niceName: 'Sugars (g)' },
    { total: 275, niceName: 'Carbohydrates (g)' },
    { total: 78, niceName: 'Fat (g)' },
  ]
  numServes: number = 0
  userSetSize: string = ''

  servingData: any[] = []
  percentData: any[] = []
  private data = [
    { Framework: 'Vue', Stars: '166443', Released: '2014' },
    { Framework: 'React', Stars: '150793', Released: '2013' },
    { Framework: 'Angular', Stars: '62342', Released: '2016' },
    { Framework: 'Backbone', Stars: '27647', Released: '2010' },
    { Framework: 'Ember', Stars: '21471', Released: '2011' },
  ]
  private svg: any
  private margin = 50
  private width = 750 - this.margin * 2
  private height = 400 - this.margin * 2

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.recipeData = this.dataService.getRecipeDB(this.recipeTitle)
    console.log(this.recipeData)
    this.numServes = this.recipeData.filter_data.recipeYield
    this.userSetSize = '' + this.numServes
    this.makeFigure()
  }

  makeFigure(): void {
    this.perServing(this.figureData)
    this.makePercent(this.servingData)
    this.createSvg()
    this.drawBars(this.percentData)
  }

  makePercent(rawData: any) {
    // look into higher order functions, convert this function into map()
    for (let property of rawData) {
      let percentTotal: number = 0
      let dailyTotalIndex: number = this.dailyValues.findIndex(
        (dv) => dv.niceName === property.niceName
      )
      if (property && property.total && dailyTotalIndex > -1) {
        let dailyTotal: number = this.dailyValues[dailyTotalIndex].total || 0
        let propertyTotal: number = property.total || 0
        percentTotal = +(property.total / dailyTotal).toFixed(2)
        let percent: any = { total: percentTotal, niceName: property.niceName }
        this.percentData.push(percent)
      } else {
        console.warn(
          'could not calculate percent of daily value for property ' +
            property.niceName
        )
        let percent = { total: 0, niceName: '' }
        this.percentData.push(percent)
      }
    }
    console.log(this.percentData)
  }

  perServing(rawData: any) {
    let properties = rawData
    this.servingData = properties.map((property: any) => {
      let temp = Object.assign({}, property)
      temp.total = temp.total / this.numServes
      // console.log(this.servingData)
      // console.log(temp)
      return temp
    })
  }

  changeNumServes(e: any) {
    console.log(e)
    this.numServes = e
    this.makeFigure()
  }

  private createSvg(): void {
    this.svg = d3
      .select('figure#bar')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2)
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')')
  }

  private drawBars(data: any[]): void {
    // Create the X-axis band scale
    const x = d3
      .scaleBand()
      .range([0, this.width])
      // .domain(data.map((d) => d.niceName))
      .domain(data.map((d) => d.niceName))
      .padding(0.1)

    // Draw the X-axis on the DOM
    this.svg
      .append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')

    // Create the Y-axis band scale
    const y = d3.scaleLinear().domain([0, 2]).range([this.height, 0])
    // const y = d3.scaleLinear().domain([0, 200000]).range([this.height, 0])

    // Draw the Y-axis on the DOM
    this.svg.append('g').call(d3.axisLeft(y))

    // Create and fill the bars
    this.svg
      .selectAll('bars')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d: any) => x(d.niceName))
      // .attr('x', (d: any) => x(d.Framework))
      .attr('y', (d: any) => y(d.total))
      // .attr('y', (d: any) => y(d.Stars))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d.total))
      // .attr('height', (d: any) => this.height - y(d.Stars))
      .attr('fill', '#d04a35')
  }
}
