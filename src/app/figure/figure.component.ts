import { Component, OnInit, Input, OnChanges } from '@angular/core'
import * as d3 from 'd3'
import { DataService } from '../core/services/data-service.service'
import { AuthService } from '../core/services/auth.service'
import configureMeasurements, { allMeasures } from 'convert-units'
import { AngularFireObject } from '@angular/fire/compat/database'
import { Subscription } from 'rxjs'
import * as $ from 'jquery'

@Component({
  selector: 'app-figure',
  templateUrl: './figure.component.html',
  styleUrls: ['./figure.component.scss'],
})
export class FigureComponent implements OnInit, OnChanges {
  recipeData: any = []
  @Input() recipeTitle: string = ''
  @Input() recipeKey: string | undefined
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
  DailyValuesCustom: any[] = []
  hasCustom: boolean = false
  @Input() numServes: number = 0
  userSetSize: string = ''

  servingData: any[] = []
  percentData: any[] = []

  // D3 figure
  private svg: any
  private margin = 50
  private width = 750 - this.margin * 2
  private height = 400 - this.margin * 2
  private x: any
  private y: any
  private xAxis: any
  private yAxis: any
  private bars: any

  user: any = {}

  // BMR
  userPhysical: any = {
    age: 0,
    sex: 'M',
    metric: {
      height: 0,
      weight: 0,
    },
    imperial: {
      height: {
        ft: 0,
        inch: 0,
      },
      weight: 0,
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
  userSatFat: number = 0
  userSugar: number = 0

  // fireDB
  auth: any = undefined
  login: any = {}
  userRef: AngularFireObject<any> | undefined
  convert: any = configureMeasurements(allMeasures)
  usersPath: string = 'users/'
  recipesPath: string = 'recipes/'
  signedIn: boolean = false

  userSubscription: Subscription = new Subscription()
  userPhysicalSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.dataService.getUser().subscribe(
      (res) => {
        this.login = res
        if (this.login && this.login.uid !== 'new') {
          this.signedIn = true
          this.userPhysicalSubscription = this.dataService
            .getFireObject(this.usersPath + this.login.uid) // maybe + physical
            .subscribe(
              (res) => {
                if (!res) {
                } else {
                  this.user = res
                  if (!this.user.physical) {
                    this.userPhysical = {
                      age: 0,
                      sex: 'M',
                      metric: {
                        height: 0,
                        weight: 0,
                      },
                      imperial: {
                        height: {
                          ft: 0,
                          inch: 0,
                        },
                        weight: 0,
                      },
                    }
                  } else {
                    this.userPhysical = this.user.physical
                  }
                }
                this.userPhysicalSubscription.unsubscribe()
              },
              (error) => {
                console.error(error)
                this.userPhysicalSubscription.unsubscribe()
              }
            )
        }
        this.userSubscription.unsubscribe()
      },
      (error) => {
        console.error(error)
        this.userSubscription.unsubscribe()
      }
    )
    this.userSetSize = '' + this.numServes
    // this.checkVariables()
  }

  ngOnChanges(): void {
    if (this.svg) {
    } else {
      this.createSvg()
    }
    this.makeFigure()
  }

  checkVariables(): void {
    console.log('this.user:')
    console.log(this.user)
    console.log('this.recipeData:')
    console.log(this.recipeData)
    console.log('this.servingData:')
    console.log(this.servingData)
    console.log('this.percentData:')
    console.log(this.percentData)
  }

  // formula to find BMR (daily calorie needs)
  calculateBMR() {
    if (this.userPhysical.sex === 'M')
      this.userBMR =
        10 * this.userPhysical.metric.weight +
        6.25 * this.userPhysical.metric.height -
        5 * this.userPhysical.age +
        5
    else if (this.userPhysical.sex === 'F')
      this.userBMR =
        10 * this.userPhysical.metric.weight +
        6.25 * this.userPhysical.metric.height -
        5 * this.userPhysical.age -
        161
  }

  // finds daily macromolecule needs (in grams) based on BMR
  calculateMacro() {
    this.userFat = (this.userBMR * (this.percentFat / 100)) / 9 // this may need to get offset with SatFat
    this.userCarb = (this.userBMR * (this.percentCarb / 100)) / 4 // this may need to get offset with Sugar
    this.userProtein = (this.userBMR * (this.percentProtein / 100)) / 4
    this.userSatFat = (this.userBMR * 0.1) / 9
    this.userSugar = (this.userBMR * 0.1) / 4
  }

  // creates user-info calculated nutrient daily values
  userNutrition() {
    this.calculateBMR()
    this.calculateMacro()
    this.DailyValuesCustom = [
      { total: this.userBMR, niceName: 'Calories' },
      { total: 300, niceName: 'Cholesterol (mg)' }, // hard number
      { total: 28, niceName: 'Dietary Fiber (g)' }, // age/sex dependent
      { total: 4700, niceName: 'Potassium (mg)' }, // age/sex dependent
      { total: this.userProtein, niceName: 'Protein (g)' },
      { total: this.userSatFat, niceName: 'Saturated Fat (mg)' },
      { total: 2300, niceName: 'Sodium (mg)' }, // hard number
      { total: this.userSugar, niceName: 'Sugars (g)' },
      { total: this.userCarb, niceName: 'Carbohydrates (g)' },
      { total: this.userFat, niceName: 'Fat (g)' },
    ]
  }

  // takes user info form to create dailyValuesCustom, update data figure
  onSubmit() {
    if (this.signedIn) {
      console.log('this.login.uid')
      this.dataService.createFire(
        this.usersPath + this.login.uid + '/physical',
        this.userPhysical
      )
    } else {
      console.log('not signed')
    }
    this.convertUnits()
    this.userNutrition()
    this.hasCustom = true
    this.makeFigure()
    // this.checkVariables()
  }

  // converts user weight/height (BMR formula uses metric)
  convertUnits() {
    if (this.units === 'Imperial') {
      let convertInches =
        this.userPhysical.imperial.height.ft * 12 +
        this.userPhysical.imperial.height.inch
      this.userPhysical.metric.height = this.convert(convertInches)
        .from('in')
        .to('cm')
        .toFixed(2)
      this.userPhysical.metric.weight = this.convert(
        this.userPhysical.imperial.weight
      )
        .from('lb')
        .to('kg')
        .toFixed(2)
    } else {
      let totalInches = this.convert(this.userPhysical.metric.height)
        .from('cm')
        .to('in')
      this.userPhysical.imperial.height.ft = Math.floor(totalInches / 12)
      this.userPhysical.imperial.height.inch = (totalInches % 12).toFixed(1)
      this.userPhysical.imperial.weight = this.convert(
        this.userPhysical.metric.weight
      )
        .from('kg')
        .to('lb')
        .toFixed(1)
    }
  }

  // prepares raw recipe nutrition for visual data figure in daily % + per serving
  makeFigure(): void {
    this.perServing(this.figureData)
    this.percentData = []
    if (!this.hasCustom) {
      this.makePercent(this.servingData, this.dailyValuesDefault)
    } else {
      this.makePercent(this.servingData, this.DailyValuesCustom)
    }
    this.drawBars(this.percentData)
  }

  // creates new data array of recipe nutrients in per serving value
  perServing(rawData: any) {
    let properties = rawData
    this.servingData = properties.map((property: any) => {
      let temp = Object.assign({}, property)
      temp.total = temp.total / this.numServes
      return temp
    })
  }

  // creates new data array of recipe nutrients in daily % value
  // rawData = post-perServing recipe nutrition, dailyValues = default or custom
  makePercent(rawData: any, dailyValues: any) {
    // look into higher order functions, convert this function into map()
    for (let property of rawData) {
      let percentTotal: number = 0
      let dailyTotalIndex: number = dailyValues.findIndex(
        (dv: any) => dv.niceName === property.niceName
      )
      if (property && property.total && dailyTotalIndex > -1) {
        let dailyTotal: number = dailyValues[dailyTotalIndex].total || 0
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
  }

  // user-updated value for perServing() calculation
  changeNumServes(e: any) {
    this.numServes = e
    this.makeFigure()
  }

  // creates foundation html object for visual data figure
  private createSvg(): void {
    if (this.svg) {
      d3.select('#bar svg').remove()
    }
    this.svg = d3
      .select('figure#bar')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2 + 35)
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')')

    // maybe prevent redundant 'g's
    this.x = d3.scaleBand().range([0, this.width]).padding(0.1)

    this.xAxis = this.svg
      .append('g')
      .attr('transform', 'translate(0,' + this.height + ')')

    this.y = d3.scaleLinear().domain([0, 100]).range([this.height, 0])

    this.yAxis = this.svg.append('g').call(d3.axisLeft(this.y).ticks(5))
  }

  // creates visual data figure
  private drawBars(data: any[]): void {
    let t = this.svg.transition().duration(100)

    // Create the X-axis band scale
    // this.x = d3
    //   .scaleBand()
    //   .range([0, this.width])
    this.x.domain(data.map((d) => d.niceName))
    //   .padding(0.1)

    // Draw the X-axis on the DOM
    // this.svg
    //   .append('g')
    //   .attr('transform', 'translate(0,' + this.height + ')')
    this.xAxis
      .call(d3.axisBottom(this.x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')

    // Create the Y-axis band scale
    // const y = d3.scaleLinear().domain([0, 100]).range([this.height, 0])

    // Draw the Y-axis on the DOM
    // this.svg.append('g').call(d3.axisLeft(y).ticks(5))

    // Create and fill the bars
    // let bars = this.svg.selectAll('bars').data(data, (d: any) => d)
    this.bars = this.svg.selectAll('rect').data(data, (d: any) => d)

    // bars.join(
    this.bars.join(
      (enter: any) =>
        enter
          .append('rect')
          .merge(this.bars)
          .attr('x', (d: any) => this.x(d.niceName))
          .attr('y', (d: any) => {
            if (this.y(d.total) < 0) {
              return 0
            } else {
              return this.y(d.total)
            }
          })
          .attr('width', this.x.bandwidth())
          // .attr('height', (d: any) => this.height - this.y(d.total))
          .attr('height', (d: any) => {
            if (this.y(d.total) < 0) {
              return this.height
            } else {
              return this.height - this.y(d.total)
            }
          })
          // .attr('fill', '#d04a35'),
          .attr('fill', (d: any) => {
            if (d.total < 100) {
              return '#d04a35'
            } else {
              return '#333333'
            }
          }),
      (update: any) =>
        update.call((update: any) =>
          update
            .transition(t)
            .attr('x', (d: any) => this.x(d.niceName))
            .attr('y', (d: any) => {
              if (this.y(d.total) < 0) {
                return 0
              } else {
                return this.y(d.total)
              }
            })
            // .attr('y', (d: any) => this.y(d.total))
            .attr('height', (d: any) => {
              if (this.y(d.total) < 0) {
                return this.height
              } else {
                return this.height - this.y(d.total)
              }
            })
            .attr('fill', (d: any) => {
              if (d.total < 100) {
                return '#d04a35'
              } else {
                return '#333333'
              }
            })
        ),
      (exit: any) =>
        exit.call((exit: any) =>
          exit
            .transition(t)
            // .attr('x', 0)
            // .attr('y', 0)
            // .attr('height', 0)
            .remove()
        )
    )

    let labels = this.svg
      .selectAll('.text')
      .data(data)
      .join(
        (enter: any) =>
          enter
            .append('text')
            .attr('class', 'label text')
            .attr('x', (d: any) => {
              return (this.x(d.niceName) || 0) + 20
            })
            .attr('y', (d: any) => {
              if (this.y(d.total) - 15 < 0) {
                return -30
              } else {
                return this.y(d.total) - 15
              }
            })
            .attr('dy', '.75em')
            .text((d: any) => {
              return Math.ceil(d.total) + '%'
            }),
        (update: any) =>
          update.call((update: any) =>
            update
              .transition(t)
              .attr('x', (d: any) => {
                return (this.x(d.niceName) || 0) + 20
              })
              .attr('y', (d: any) => {
                if (this.y(d.total) - 15 < 0) {
                  return -30
                } else {
                  return this.y(d.total) - 15
                }
              })
              .attr('dy', '.75em')
              .text((d: any) => {
                return Math.ceil(d.total) + '%'
              })
          ),
        (exit: any) => exit.call((exit: any) => exit.transition(t).remove())
      )
  }
}
