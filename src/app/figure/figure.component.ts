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
  dailyValuesDefault = [
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
  private svg: any
  private margin = 50
  private width = 750 - this.margin * 2
  private height = 400 - this.margin * 2

  // BMR
  user: any = {
    age: 0,
    sex: 'M',
    height: {
      imperial: {},
    },
    weight: {
      imperial: {},
    },
  }
  units: string = 'Metric'
  // calculated daily values
  sexes: any = ['M', 'F']
  userBMR: number = 0
  percentFat: number = 25
  percentCarb: number = 50
  percentProtein: number = 25
  userFat: number = 0
  userCarb: number = 0
  userProtein: number = 0

  convert: any

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.recipeData = this.dataService.getRecipeDB(this.recipeTitle)
    // this.checkVariables()
    this.numServes = this.recipeData.filter_data.recipeYield
    this.userSetSize = '' + this.numServes
    this.createSvg()
    this.makeFigure()
  }

  checkVariables(): void {
    console.log('this.recipeData:')
    console.log(this.recipeData)
  }

  // TODO: use for userNutrition()
  calculateBMR() {
    if (this.user.sex === 'M')
      this.userBMR =
        10 * this.user.weight.metric +
        6.25 * this.user.height.metric -
        5 * this.user.age +
        5
    else if (this.user.sex === 'F')
      this.userBMR =
        10 * this.user.weight.metric +
        6.25 * this.user.height.metric -
        5 * this.user.age -
        161
  }

  // TODO: use for userNutrition()
  calculateMacro() {
    this.userFat = this.userBMR * (this.percentFat / 100)
    this.userCarb = this.userBMR * (this.percentCarb / 100)
    this.userProtein = this.userBMR * (this.percentProtein / 100)
  }

  // TODO: will calculate user-specific nutrition numbers for custom variant of dailyValuesDefault
  userNutrition() {}

  // TODO: use for userForm submit
  onSubmit() {
    console.log(this.user)
  }

  // TODO: use library to convert between units
  // convertUnits() {
  //   if (this.user.height.metric === null)
  //     let convertInches = (this.user.height.imperial.ft * 12) + this.user.height.imperial.inch
  //     this.user.height.metric = this.convert.(convertInches).from('in').to('cm')
  //   if (this.user.height.imperial === null)
  //     let totalInches = this.convert.(this.user.height.metric).from('cm').to('in')
  //     this.user.height.imperial.ft = Math.floor(totalInches/12);
  //     this.user.height.imperial.inch = totalInches % 12;
  // }

  makeFigure(): void {
    this.perServing(this.figureData)
    this.percentData = []
    this.makePercent(this.servingData)
    this.drawBars(this.percentData)
  }

  makePercent(rawData: any) {
    // look into higher order functions, convert this function into map()
    for (let property of rawData) {
      let percentTotal: number = 0
      let dailyTotalIndex: number = this.dailyValuesDefault.findIndex(
        (dv) => dv.niceName === property.niceName
      )
      if (property && property.total && dailyTotalIndex > -1) {
        let dailyTotal: number =
          this.dailyValuesDefault[dailyTotalIndex].total || 0
        let propertyTotal: number = property.total || 0
        percentTotal = +(
          ((property.total / dailyTotal).toFixed(2) as any) * 100
        )
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
    // console.log('this.percentData:')
    // console.log(this.percentData)
  }

  perServing(rawData: any) {
    let properties = rawData
    this.servingData = properties.map((property: any) => {
      let temp = Object.assign({}, property)
      temp.total = temp.total / this.numServes
      return temp
    })
    // console.log('this.servingData:')
    // console.log(this.servingData)
  }

  changeNumServes(e: any) {
    this.numServes = e
    // console.log('this.numServes')
    // console.log(this.numServes)
    this.makeFigure()
  }

  private createSvg(): void {
    this.svg = d3
      .select('figure#bar')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2 + 35)
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')')
  }

  private drawBars(data: any[]): void {
    let t = this.svg.transition().duration(500)

    this.svg.selectAll('*').remove()

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
    const y = d3.scaleLinear().domain([0, 100]).range([this.height, 0])

    // Draw the Y-axis on the DOM
    this.svg.append('g').call(d3.axisLeft(y).ticks(5))

    // Create and fill the bars
    this.svg
      .selectAll('bars')
      .data(data)
      .join(
        (enter: any) =>
          enter
            .append('rect')
            .attr('x', (d: any) => x(d.niceName))
            .attr('y', (d: any) => y(d.total))
            .attr('width', x.bandwidth())
            .attr('height', (d: any) => this.height - y(d.total))
            .attr('fill', '#d04a35'),
        (update: any) =>
          update.call((update: any) =>
            update
              .transition(t)
              .attr('x', (d: any) => x(d.niceName))
              .attr('y', (d: any) => y(d.total))
              .attr('height', (d: any) => this.height - y(d.total))
          ),
        (exit: any) =>
          exit.call((exit: any) =>
            exit
              .transition(t)
              .attr('x', 0)
              .attr('y', 0)
              .attr('height', 0)
              .remove()
          )
      )

    this.svg
      .selectAll('.text')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d: any) => {
        return (x(d.niceName) || 0) + 20
      })
      .attr('y', (d: any) => {
        return y(d.total) - 15
      })
      .attr('dy', '.75em')
      .text((d: any) => {
        return Math.ceil(d.total) + '%'
      })
  }
}
