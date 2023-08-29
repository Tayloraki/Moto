import { Component, OnInit, Input } from '@angular/core'
import * as d3 from 'd3'
import { DataService } from '../core/services/data-service.service'
import { AuthService } from '../core/services/auth.service'
import configureMeasurements, { allMeasures } from 'convert-units'
import {
  AngularFireDatabase,
  AngularFireList,
  AngularFireObject,
} from '@angular/fire/compat/database'
import { Subscription } from 'rxjs'

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
  DailyValuesCustom: any[] = []
  hasCustom: boolean = false
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

  // mock data
  recipeFake: any = {
    link: 'https://www.seriouseats.com/jamaican-pepper-shrimp',
    original_data: {
      url: 'https://www.seriouseats.com/jamaican-pepper-shrimp',
      name: 'Jamaican Pepper Shrimp Recipe',
      image:
        'https://www.seriouseats.com/thmb/680uC6Dv-AN3pArTio1qnxYcZ1c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__2021__01__20210114-jamaican-pepper-shrimp-jillian-atkinson-8-83ed21f3c5b24e988e9cef830ff1e118.jpg',
      description:
        'Stewed in a flavorful aromatic broth loaded with onion, garlic, allspice, thyme, and Scotch bonnet peppers, this Jamaican roadside snack can now be made right in your kitchen.',
      cookTime: '25 minutes',
      prepTime: '20 minutes',
      totalTime: '75 minutes',
      recipeYield: '4',
      recipeIngredients: [
        '3 Scotch bonnet chile peppers (about 3/4 ounce; 20g)',
        '1 pound (455g) large shell-on shrimp, preferably head-on, rinsed',
        'Half of 1 medium (8-ounce; 225g) red bell pepper, stemmed, seeded, and finely diced',
        'Half of 1 medium (8-ounce; 225g) yellow onion, finely diced',
        '4 sprigs fresh thyme',
        '3 medium garlic cloves, minced',
        '1 tablespoon (15ml) annatto oil or neutral oil such as vegetable oil',
        '1 1/2 teaspoons (6g) Diamond Crystal kosher salt; for table salt use half as much by volume or the same weight, plus more if needed',
        '1 1/2 teaspoons (6g) annatto (achiote) powder',
        '1/2 teaspoon garlic powder',
        '1/2 teaspoon onion powder',
        '1 1/2 cups (355ml) water',
        '2 tablespoons (30ml) distilled white vinegar',
        '6 allspice berries',
      ],
      recipeInstructions: [
        'Wearing latex gloves, prepare Scotch bonnet peppers; preparation will depend on your heat tolerance. For very spicy heat, stem and chop or slice peppers, keeping seeds and white pith; for medium heat, stem and seed peppers, then chop or slice; for mild heat, leave peppers whole, including stems.',
        'In a medium bowl, add shrimp with Scotch bonnets, bell pepper, onion, thyme, garlic, annatto oil (or neutral oil), salt, annatto powder, garlic powder, and onion powder. Stir to combine well. Cover with plastic and refrigerate at least 30 minutes and up to overnight.',
        'Using a gloved hand, scrape aromatic vegetables and herbs off shrimp and set shrimp aside in a clean bowl. Add water to vegetable marinade, then pour mixture into a stainless-steel skillet large enough to hold shrimp in a single layer.',
        'Bring to a simmer over medium heat, add allspice berries, then cover and cook at a simmer for 15 minutes.',
        'Add vinegar, turn heat to medium-low, and add shrimp to the skillet in a single layer. Cover and cook for 2 minutes.',
        'Turn off heat, uncover, and stir until shrimp are just cooked through and no longer translucent, about 2 minutes longer. Season with additional salt, if desired.',
        'Transfer shrimp to a serving plate and let cool slightly. Discard cooking liquid and vegetables. Serve shrimp warm or at room temperature, peeling them at the table.',
      ],
      recipeCategories: ["Appetizers and Hors d'Oeuvres", 'Snacks'],
      recipeCuisines: ['Caribbean'],
    },
    filter_data: {
      url: 'https://www.seriouseats.com/jamaican-pepper-shrimp',
      name: 'Jamaican Pepper Shrimp Recipe',
      image:
        'https://www.seriouseats.com/thmb/680uC6Dv-AN3pArTio1qnxYcZ1c=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__2021__01__20210114-jamaican-pepper-shrimp-jillian-atkinson-8-83ed21f3c5b24e988e9cef830ff1e118.jpg',
      description:
        'Stewed in a flavorful aromatic broth loaded with onion, garlic, allspice, thyme, and Scotch bonnet peppers, this Jamaican roadside snack can now be made right in your kitchen.',
      cookTime: '25 minutes',
      prepTime: '20 minutes',
      totalTime: '75 minutes',
      recipeYield: '4',
      recipeIngredients: [
        '3 Scotch bonnet chile peppers (about 3/4 ounce; 20g)',
        '1 pound (455g) large shell-on shrimp, preferably head-on, rinsed',
        'Half of 1 medium (8-ounce; 225g) red bell pepper, stemmed, seeded, and finely diced',
        'Half of 1 medium (8-ounce; 225g) yellow onion, finely diced',
        '4 sprigs fresh thyme',
        '3 medium garlic cloves, minced',
        '1 tablespoon (15ml) annatto oil or neutral oil such as vegetable oil',
        '1 1/2 teaspoons (6g) Diamond Crystal kosher salt; for table salt use half as much by volume or the same weight, plus more if needed',
        '1 1/2 teaspoons (6g) annatto (achiote) powder',
        '1/2 teaspoon garlic powder',
        '1/2 teaspoon onion powder',
        '1 1/2 cups (355ml) water',
        '2 tablespoons (30ml) distilled white vinegar',
        '6 allspice berries',
      ],
      recipeInstructions: [
        'Wearing latex gloves, prepare Scotch bonnet peppers; preparation will depend on your heat tolerance. For very spicy heat, stem and chop or slice peppers, keeping seeds and white pith; for medium heat, stem and seed peppers, then chop or slice; for mild heat, leave peppers whole, including stems.',
        'In a medium bowl, add shrimp with Scotch bonnets, bell pepper, onion, thyme, garlic, annatto oil (or neutral oil), salt, annatto powder, garlic powder, and onion powder. Stir to combine well. Cover with plastic and refrigerate at least 30 minutes and up to overnight.',
        'Using a gloved hand, scrape aromatic vegetables and herbs off shrimp and set shrimp aside in a clean bowl. Add water to vegetable marinade, then pour mixture into a stainless-steel skillet large enough to hold shrimp in a single layer.',
        'Bring to a simmer over medium heat, add allspice berries, then cover and cook at a simmer for 15 minutes.',
        'Add vinegar, turn heat to medium-low, and add shrimp to the skillet in a single layer. Cover and cook for 2 minutes.',
        'Turn off heat, uncover, and stir until shrimp are just cooked through and no longer translucent, about 2 minutes longer. Season with additional salt, if desired.',
        'Transfer shrimp to a serving plate and let cool slightly. Discard cooking liquid and vegetables. Serve shrimp warm or at room temperature, peeling them at the table.',
      ],
      recipeCategories: ["Appetizers and Hors d'Oeuvres", 'Snacks'],
      recipeCuisines: ['Caribbean'],
    },
    status: 'complete',
  }

  // fireDB
  auth: any = undefined
  login: any = {}
  userRef: AngularFireObject<any> | undefined
  convert: any = configureMeasurements(allMeasures)
  usersPath: string = 'users/'
  recipesPath: string = 'recipes/'
  signedIn: boolean = false

  userSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.signedIn = this.authService.signedIn
    console.log(this.signedIn)
    this.login = this.authService.userData
    if (this.signedIn) {
      this.dataService.getFireObject(this.usersPath + this.login.uid).subscribe(
        (res) => {
          if (res === null) {
            console.log('no user info')
          } else {
            this.user = res
          }
        },
        (error) => {
          console.error(error)
        }
      )
      // this.user = this.dataService.getFireObject(
      //   this.usersPath + this.login.uid
      // )
      // console.log(this.user)
    }
    this.recipeData = this.recipeFake
    // this.recipeData = this.dataService.getRecipeDB(this.recipeTitle)
    // this.checkVariables()
    this.numServes = this.recipeData.filter_data.recipeYield
    this.userSetSize = '' + this.numServes
    this.createSvg()
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
    if (this.user.sex === 'M')
      this.userBMR =
        10 * this.user.metric.weight +
        6.25 * this.user.metric.height -
        5 * this.user.age +
        5
    else if (this.user.sex === 'F')
      this.userBMR =
        10 * this.user.metric.weight +
        6.25 * this.user.metric.height -
        5 * this.user.age -
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
    this.convertUnits()
    this.userNutrition()
    this.hasCustom = true
    this.makeFigure()
    // this.checkVariables()
    this.dataService.createFire(this.usersPath + this.login.uid, this.user)
  }

  // converts user weight/height (BMR formula uses metric)
  convertUnits() {
    if (this.units === 'Imperial') {
      let convertInches =
        this.user.imperial.height.ft * 12 + this.user.imperial.height.inch
      this.user.metric.height = this.convert(convertInches).from('in').to('cm')
      this.user.metric.weight = this.convert(this.user.imperial.weight)
        .from('lb')
        .to('kg')
    } else {
      let totalInches = this.convert(this.user.metric.height)
        .from('cm')
        .to('in')
      this.user.imperial.height.ft = Math.floor(totalInches / 12)
      this.user.imperial.height.inch = totalInches % 12
      this.user.imperial.weight = this.convert(this.user.metric.weight)
        .from('kg')
        .to('lb')
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
    this.userSubscription = this.dataService
      .getFireObject(this.usersPath + this.login.uid)
      .subscribe(
        (res) => {
          let user = res
          console.log(user)
        },
        (error) => {
          console.error(error)
        }
      )
    this.makeFigure()
  }

  // creates foundation html object for visual data figure
  private createSvg(): void {
    this.svg = d3
      .select('figure#bar')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2 + 35)
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')')
  }

  // creates visual data figure
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
