import { Component, OnInit, OnDestroy } from '@angular/core'
import { DataService } from '../core/services/data-service.service'
import { Subscription } from 'rxjs'
import { parse } from 'papaparse'
import { flatten, some, uniq } from 'underscore'
import { RecipeDetailsModalComponent } from 'src/app/recipe-details-modal/recipe-details-modal.component'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import clone from 'just-clone'

import { AuthService } from '../core/services/auth.service'

@Component({
  selector: 'app-recipes-summary',
  templateUrl: './recipes-summary.component.html',
  styleUrls: ['./recipes-summary.component.scss'],
})
export class RecipesSummaryComponent implements OnInit, OnDestroy {
  links: string[] = []
  linksTextInput: string = ''
  recipes: any[] = [] // [ { link: string, data: object }]
  uploadedFiles: any
  title: string = ''

  // error booleans
  noLinks: boolean = false
  duplicateLinks: boolean = false
  loading: boolean = false
  show: boolean = false

  selectRecipe: any = []
  ingredientsNlp: string = ''
  recipeNutrition: any = []
  IngredientApiReturn: any = {}
  ingredientNutrition: any = {}
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
  sums: any = {
    nf_calories: { total: 0, niceName: 'Calories' },
    nf_cholesterol: { total: 0, niceName: 'Cholesterol (mg)' },
    nf_dietary_fiber: { total: 0, niceName: 'Dietary Fiber (g)' },
    nf_potassium: { total: 0, niceName: 'Potassium (mg)' },
    nf_protein: { total: 0, niceName: 'Protein (g)' },
    nf_saturated_fat: { total: 0, niceName: 'Saturated Fat (mg)' },
    nf_sodium: { total: 0, niceName: 'Sodium (mg)' },
    nf_sugars: { total: 0, niceName: 'Sugars (g)' },
    nf_total_carbohydrate: { total: 0, niceName: 'Carbohydrates (g)' },
    nf_total_fat: { total: 0, niceName: 'Fat (g)' },
  }
  figureData: any = []
  ingredientSums: any = {
    nf_calories: { total: 0, niceName: 'Calories' },
    nf_cholesterol: { total: 0, niceName: 'Cholesterol' },
    nf_dietary_fiber: { total: 0, niceName: 'Dietary Fiber' },
    nf_potassium: { total: 0, niceName: 'Potassium' },
    nf_protein: { total: 0, niceName: 'Protein' },
    nf_saturated_fat: { total: 0, niceName: 'Saturated Fat' },
    nf_sodium: { total: 0, niceName: 'Sodium' },
    nf_sugars: { total: 0, niceName: 'Sugars' },
    nf_total_carbohydrate: { total: 0, niceName: 'Carbohydrates' },
    nf_total_fat: { total: 0, niceName: 'Fat' },
  }

  // mock data
  linksTextInputFAKE: string =
    'https://www.seriouseats.com/jamaican-pepper-shrimp'
  recipeFake: any = {
    link: 'seriouseats.com/jamaican-pepper-shrimp',
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
  resFAKE: any = {
    foods: [
      {
        food_name: 'red bell pepper',
        brand_name: null,
        serving_qty: 225,
        serving_unit: 'g',
        serving_weight_grams: 225,
        nf_calories: 63,
        nf_total_fat: 0.45,
        nf_saturated_fat: 0.07,
        nf_cholesterol: 0,
        nf_sodium: 4.5,
        nf_total_carbohydrate: 15.08,
        nf_dietary_fiber: 2.7,
        nf_sugars: 9.88,
        nf_protein: 2.07,
        nf_potassium: 373.5,
        nf_p: 40.5,
        full_nutrients: [
          { attr_id: 203, value: 2.07 },
          { attr_id: 204, value: 0.45 },
          { attr_id: 205, value: 15.075 },
          { attr_id: 207, value: 0.6975 },
          { attr_id: 208, value: 63 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 206.7075 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 263.25 },
          { attr_id: 269, value: 9.8775 },
          { attr_id: 291, value: 2.7 },
          { attr_id: 301, value: 20.25 },
          { attr_id: 303, value: 1.035 },
          { attr_id: 304, value: 22.5 },
          { attr_id: 305, value: 40.5 },
          { attr_id: 306, value: 373.5 },
          { attr_id: 307, value: 4.5 },
          { attr_id: 309, value: 0.27 },
          { attr_id: 312, value: 0.1463 },
          { attr_id: 315, value: 0.2588 },
          { attr_id: 317, value: 0.675 },
          { attr_id: 318, value: 6617.25 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 330.75 },
          { attr_id: 321, value: 3431.25 },
          { attr_id: 322, value: 40.5 },
          { attr_id: 323, value: 3.7125 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 1035 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 105.75 },
          { attr_id: 401, value: 384.75 },
          { attr_id: 404, value: 0.1328 },
          { attr_id: 405, value: 0.0675 },
          { attr_id: 406, value: 1.0733 },
          { attr_id: 410, value: 0.1778 },
          { attr_id: 415, value: 0.5243 },
          { attr_id: 417, value: 36 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 13.05 },
          { attr_id: 430, value: 11.475 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 36 },
          { attr_id: 435, value: 36 },
          { attr_id: 501, value: 0.027 },
          { attr_id: 502, value: 0.0765 },
          { attr_id: 503, value: 0.0675 },
          { attr_id: 504, value: 0.108 },
          { attr_id: 505, value: 0.0923 },
          { attr_id: 506, value: 0.0248 },
          { attr_id: 507, value: 0.0405 },
          { attr_id: 508, value: 0.0653 },
          { attr_id: 509, value: 0.0428 },
          { attr_id: 510, value: 0.0878 },
          { attr_id: 511, value: 0.099 },
          { attr_id: 512, value: 0.0428 },
          { attr_id: 513, value: 0.0855 },
          { attr_id: 514, value: 0.297 },
          { attr_id: 515, value: 0.2745 },
          { attr_id: 516, value: 0.0765 },
          { attr_id: 517, value: 0.09 },
          { attr_id: 518, value: 0.0833 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0653 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0.0495 },
          { attr_id: 614, value: 0.0158 },
          { attr_id: 617, value: 0.027 },
          { attr_id: 618, value: 0.216 },
          { attr_id: 619, value: 0.0225 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0.0023 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 636, value: 20.25 },
          { attr_id: 645, value: 0.0293 },
          { attr_id: 646, value: 0.2385 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input:
            'Half of 1 medium (8-ounce; 225g) red bell pepper, stemmed, seeded, and finely diced',
        },
        source: 1,
        ndb_no: 11823,
        tags: {
          item: 'red bell pepper',
          measure: 'g',
          quantity: 225.0,
          food_group: 4,
          tag_id: 8707,
        },
        alt_measures: [
          {
            serving_weight: 68,
            measure: 'cup, chopped',
            seq: 3,
            qty: 0.5,
          },
          {
            serving_weight: 11.6,
            measure: 'tbsp',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 135,
            measure: 'cup, strips',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 114,
            measure: 'pepper',
            seq: 80,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/8707_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/8707_highres.jpg',
          is_user_uploaded: false,
        },
        ub_recipe: null,
      },
      {
        food_name: 'yellow onion',
        brand_name: null,
        serving_qty: 225,
        serving_unit: 'g',
        serving_weight_grams: 225,
        nf_calories: 99,
        nf_total_fat: 0.43,
        nf_saturated_fat: 0.07,
        nf_cholesterol: 0,
        nf_sodium: 6.75,
        nf_total_carbohydrate: 22.84,
        nf_dietary_fiber: 3.15,
        nf_sugars: 10.64,
        nf_protein: 3.06,
        nf_potassium: 373.5,
        nf_p: 78.75,
        full_nutrients: [
          { attr_id: 203, value: 3.06 },
          { attr_id: 204, value: 0.4275 },
          { attr_id: 205, value: 22.8375 },
          { attr_id: 207, value: 0.99 },
          { attr_id: 208, value: 99 },
          { attr_id: 210, value: 2.475 },
          { attr_id: 211, value: 4.9275 },
          { attr_id: 212, value: 3.24 },
          { attr_id: 213, value: 0 },
          { attr_id: 214, value: 0 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 197.685 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 414 },
          { attr_id: 269, value: 10.6425 },
          { attr_id: 287, value: 0 },
          { attr_id: 291, value: 3.15 },
          { attr_id: 301, value: 49.5 },
          { attr_id: 303, value: 0.54 },
          { attr_id: 304, value: 24.75 },
          { attr_id: 305, value: 78.75 },
          { attr_id: 306, value: 373.5 },
          { attr_id: 307, value: 6.75 },
          { attr_id: 309, value: 0.4725 },
          { attr_id: 312, value: 0.1508 },
          { attr_id: 315, value: 0.3443 },
          { attr_id: 317, value: 1.35 },
          { attr_id: 318, value: 4.5 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 2.25 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0.045 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 9 },
          { attr_id: 341, value: 0 },
          { attr_id: 342, value: 0 },
          { attr_id: 343, value: 0 },
          { attr_id: 401, value: 11.7 },
          { attr_id: 404, value: 0.0945 },
          { attr_id: 405, value: 0.0518 },
          { attr_id: 406, value: 0.3713 },
          { attr_id: 410, value: 0.2543 },
          { attr_id: 415, value: 0.2903 },
          { attr_id: 417, value: 33.75 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 15.3 },
          { attr_id: 430, value: 1.125 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 33.75 },
          { attr_id: 435, value: 33.75 },
          { attr_id: 501, value: 0.045 },
          { attr_id: 502, value: 0.0743 },
          { attr_id: 503, value: 0.108 },
          { attr_id: 504, value: 0.108 },
          { attr_id: 505, value: 0.1463 },
          { attr_id: 506, value: 0.0248 },
          { attr_id: 507, value: 0.054 },
          { attr_id: 508, value: 0.0788 },
          { attr_id: 509, value: 0.0765 },
          { attr_id: 510, value: 0.0698 },
          { attr_id: 511, value: 0.4118 },
          { attr_id: 512, value: 0.0495 },
          { attr_id: 513, value: 0.0855 },
          { attr_id: 514, value: 0.1665 },
          { attr_id: 515, value: 0.495 },
          { attr_id: 516, value: 0.1283 },
          { attr_id: 517, value: 0.0945 },
          { attr_id: 518, value: 0.09 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0698 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0.0023 },
          { attr_id: 613, value: 0.063 },
          { attr_id: 614, value: 0.0045 },
          { attr_id: 617, value: 0.0608 },
          { attr_id: 618, value: 0.1575 },
          { attr_id: 619, value: 0.009 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 636, value: 40.5 },
          { attr_id: 645, value: 0.0608 },
          { attr_id: 646, value: 0.1643 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input:
            'Half of 1 medium (8-ounce; 225g) yellow onion, finely diced',
        },
        source: 1,
        ndb_no: 11283,
        tags: {
          item: 'yellow onion',
          measure: 'g',
          quantity: 225.0,
          food_group: 4,
          tag_id: 8574,
        },
        alt_measures: [
          {
            serving_weight: 8,
            measure: 'slice, thin',
            seq: 8,
            qty: 1,
          },
          {
            serving_weight: 60,
            measure: 'small',
            seq: 7,
            qty: 1,
          },
          {
            serving_weight: 12,
            measure: 'slice, medium (1/8 thick)',
            seq: 6,
            qty: 1,
          },
          {
            serving_weight: 94,
            measure: 'medium',
            seq: 5,
            qty: 1,
          },
          {
            serving_weight: 32,
            measure: 'slice, large (1/4 thick)',
            seq: 4,
            qty: 1,
          },
          {
            serving_weight: 128,
            measure: 'large',
            seq: 3,
            qty: 1,
          },
          {
            serving_weight: 15,
            measure: 'tbsp chopped',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 210,
            measure: 'cup',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 240,
            measure: 'cup, chopped',
            seq: 80,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/717_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/717_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'fresh thyme',
        brand_name: null,
        serving_qty: 4,
        serving_unit: 'tsp',
        serving_weight_grams: 3.2,
        nf_calories: 3.23,
        nf_total_fat: 0.05,
        nf_saturated_fat: 0.01,
        nf_cholesterol: 0,
        nf_sodium: 0.29,
        nf_total_carbohydrate: 0.78,
        nf_dietary_fiber: 0.45,
        nf_sugars: null,
        nf_protein: 0.18,
        nf_potassium: 19.49,
        nf_p: 3.39,
        full_nutrients: [
          { attr_id: 203, value: 0.1779 },
          { attr_id: 204, value: 0.0538 },
          { attr_id: 205, value: 0.7824 },
          { attr_id: 207, value: 0.1024 },
          { attr_id: 208, value: 3.232 },
          { attr_id: 255, value: 2.0835 },
          { attr_id: 268, value: 13.536 },
          { attr_id: 291, value: 0.448 },
          { attr_id: 301, value: 12.96 },
          { attr_id: 303, value: 0.5584 },
          { attr_id: 304, value: 5.12 },
          { attr_id: 305, value: 3.392 },
          { attr_id: 306, value: 19.488 },
          { attr_id: 307, value: 0.288 },
          { attr_id: 309, value: 0.0579 },
          { attr_id: 312, value: 0.0178 },
          { attr_id: 315, value: 0.055 },
          { attr_id: 318, value: 152.032 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 7.616 },
          { attr_id: 321, value: 91.232 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 401, value: 5.1232 },
          { attr_id: 404, value: 0.0015 },
          { attr_id: 405, value: 0.0151 },
          { attr_id: 406, value: 0.0584 },
          { attr_id: 410, value: 0.0131 },
          { attr_id: 415, value: 0.0111 },
          { attr_id: 417, value: 1.44 },
          { attr_id: 418, value: 0 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 1.44 },
          { attr_id: 435, value: 1.44 },
          { attr_id: 501, value: 0.0037 },
          { attr_id: 502, value: 0.0049 },
          { attr_id: 503, value: 0.0091 },
          { attr_id: 504, value: 0.0084 },
          { attr_id: 505, value: 0.004 },
          { attr_id: 510, value: 0.0098 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0149 },
          { attr_id: 609, value: 0.0013 },
          { attr_id: 610, value: 0.0007 },
          { attr_id: 611, value: 0.0013 },
          { attr_id: 612, value: 0.0008 },
          { attr_id: 613, value: 0.0094 },
          { attr_id: 614, value: 0.0015 },
          { attr_id: 617, value: 0.0026 },
          { attr_id: 618, value: 0.0027 },
          { attr_id: 619, value: 0.0143 },
          { attr_id: 645, value: 0.0026 },
          { attr_id: 646, value: 0.017 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input: '4 sprigs fresh thyme',
        },
        source: 1,
        ndb_no: 2049,
        tags: {
          item: 'thyme, fresh',
          measure: null,
          quantity: 4.0,
          food_group: 9,
          tag_id: 1937,
        },
        alt_measures: [
          {
            serving_weight: 0.8,
            measure: 'tsp',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 0.4,
            measure: 'tsp',
            seq: 2,
            qty: 0.5,
          },
          {
            serving_weight: 1,
            measure: 'sprig',
            seq: 80,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/1937_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/1937_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'garlic cloves',
        brand_name: null,
        serving_qty: 3,
        serving_unit: 'clove',
        serving_weight_grams: 9,
        nf_calories: 13.41,
        nf_total_fat: 0.05,
        nf_saturated_fat: 0.01,
        nf_cholesterol: 0,
        nf_sodium: 1.53,
        nf_total_carbohydrate: 2.98,
        nf_dietary_fiber: 0.19,
        nf_sugars: 0.09,
        nf_protein: 0.57,
        nf_potassium: 36.09,
        nf_p: 13.77,
        full_nutrients: [
          { attr_id: 203, value: 0.5724 },
          { attr_id: 204, value: 0.045 },
          { attr_id: 205, value: 2.9754 },
          { attr_id: 207, value: 0.135 },
          { attr_id: 208, value: 13.41 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 5.2722 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 56.07 },
          { attr_id: 269, value: 0.09 },
          { attr_id: 291, value: 0.189 },
          { attr_id: 301, value: 16.29 },
          { attr_id: 303, value: 0.153 },
          { attr_id: 304, value: 2.25 },
          { attr_id: 305, value: 13.77 },
          { attr_id: 306, value: 36.09 },
          { attr_id: 307, value: 1.53 },
          { attr_id: 309, value: 0.1044 },
          { attr_id: 312, value: 0.0269 },
          { attr_id: 315, value: 0.1505 },
          { attr_id: 317, value: 1.278 },
          { attr_id: 318, value: 0.81 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 0.45 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0.0072 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 1.44 },
          { attr_id: 401, value: 2.808 },
          { attr_id: 404, value: 0.018 },
          { attr_id: 405, value: 0.0099 },
          { attr_id: 406, value: 0.063 },
          { attr_id: 410, value: 0.0536 },
          { attr_id: 415, value: 0.1112 },
          { attr_id: 417, value: 0.27 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 2.088 },
          { attr_id: 430, value: 0.153 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 0.27 },
          { attr_id: 435, value: 0.27 },
          { attr_id: 501, value: 0.0059 },
          { attr_id: 502, value: 0.0141 },
          { attr_id: 503, value: 0.0195 },
          { attr_id: 504, value: 0.0277 },
          { attr_id: 505, value: 0.0246 },
          { attr_id: 506, value: 0.0068 },
          { attr_id: 507, value: 0.0059 },
          { attr_id: 508, value: 0.0165 },
          { attr_id: 509, value: 0.0073 },
          { attr_id: 510, value: 0.0262 },
          { attr_id: 511, value: 0.0571 },
          { attr_id: 512, value: 0.0102 },
          { attr_id: 513, value: 0.0119 },
          { attr_id: 514, value: 0.044 },
          { attr_id: 515, value: 0.0725 },
          { attr_id: 516, value: 0.018 },
          { attr_id: 517, value: 0.009 },
          { attr_id: 518, value: 0.0171 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.008 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0.0002 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0.0078 },
          { attr_id: 614, value: 0 },
          { attr_id: 617, value: 0.001 },
          { attr_id: 618, value: 0.0206 },
          { attr_id: 619, value: 0.0018 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 645, value: 0.001 },
          { attr_id: 646, value: 0.0224 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input: '3 medium garlic cloves, minced',
        },
        source: 1,
        ndb_no: 11215,
        tags: {
          item: 'garlic',
          measure: null,
          quantity: 3,
          food_group: 4,
          tag_id: 330,
        },
        alt_measures: [
          {
            serving_weight: 9,
            measure: 'cloves',
            seq: 4,
            qty: 3,
          },
          {
            serving_weight: 3,
            measure: 'clove',
            seq: 3,
            qty: 1,
          },
          {
            serving_weight: 2.8,
            measure: 'tsp',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 136,
            measure: 'cup',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 30,
            measure: 'head',
            seq: 80,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/330_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/330_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'salt',
        brand_name: null,
        serving_qty: 9,
        serving_unit: 'g',
        serving_weight_grams: 9,
        nf_calories: 0,
        nf_total_fat: 0,
        nf_saturated_fat: 0,
        nf_cholesterol: 0,
        nf_sodium: 3488.22,
        nf_total_carbohydrate: 0,
        nf_dietary_fiber: 0,
        nf_sugars: 0,
        nf_protein: 0,
        nf_potassium: 0.72,
        nf_p: 0,
        full_nutrients: [
          { attr_id: 203, value: 0 },
          { attr_id: 204, value: 0 },
          { attr_id: 205, value: 0 },
          { attr_id: 207, value: 8.982 },
          { attr_id: 208, value: 0 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 0.018 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 0 },
          { attr_id: 269, value: 0 },
          { attr_id: 291, value: 0 },
          { attr_id: 301, value: 2.16 },
          { attr_id: 303, value: 0.0297 },
          { attr_id: 304, value: 0.09 },
          { attr_id: 305, value: 0 },
          { attr_id: 306, value: 0.72 },
          { attr_id: 307, value: 3488.22 },
          { attr_id: 309, value: 0.009 },
          { attr_id: 312, value: 0.0027 },
          { attr_id: 313, value: 0.18 },
          { attr_id: 315, value: 0.009 },
          { attr_id: 317, value: 0.009 },
          { attr_id: 318, value: 0 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 0 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 0 },
          { attr_id: 401, value: 0 },
          { attr_id: 404, value: 0 },
          { attr_id: 405, value: 0 },
          { attr_id: 406, value: 0 },
          { attr_id: 410, value: 0 },
          { attr_id: 415, value: 0 },
          { attr_id: 417, value: 0 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 0 },
          { attr_id: 430, value: 0 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 0 },
          { attr_id: 435, value: 0 },
          { attr_id: 501, value: 0 },
          { attr_id: 502, value: 0 },
          { attr_id: 503, value: 0 },
          { attr_id: 504, value: 0 },
          { attr_id: 505, value: 0 },
          { attr_id: 506, value: 0 },
          { attr_id: 507, value: 0 },
          { attr_id: 508, value: 0 },
          { attr_id: 509, value: 0 },
          { attr_id: 510, value: 0 },
          { attr_id: 511, value: 0 },
          { attr_id: 512, value: 0 },
          { attr_id: 513, value: 0 },
          { attr_id: 514, value: 0 },
          { attr_id: 515, value: 0 },
          { attr_id: 516, value: 0 },
          { attr_id: 517, value: 0 },
          { attr_id: 518, value: 0 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0 },
          { attr_id: 614, value: 0 },
          { attr_id: 617, value: 0 },
          { attr_id: 618, value: 0 },
          { attr_id: 619, value: 0 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 636, value: 0 },
          { attr_id: 645, value: 0 },
          { attr_id: 646, value: 0 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input:
            '1 1/2 teaspoons (6g) Diamond Crystal kosher salt; for table salt use half as much by volume or the same weight, plus more if needed',
        },
        source: 1,
        ndb_no: 2047,
        tags: {
          item: 'salt',
          measure: 'g',
          quantity: 9.0,
          food_group: 9,
          tag_id: 177,
        },
        alt_measures: [
          {
            serving_weight: 0.4,
            measure: 'dash',
            seq: 4,
            qty: 1,
          },
          {
            serving_weight: 6,
            measure: 'tsp',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 18,
            measure: 'tbsp',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 292,
            measure: 'cup',
            seq: 3,
            qty: 1,
          },
          {
            serving_weight: 1.5,
            measure: 'to taste',
            seq: 80,
            qty: 1,
          },
          {
            serving_weight: 1.5,
            measure: 'tsp',
            seq: 81,
            qty: 0.25,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/177_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/177_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'garlic powder',
        brand_name: null,
        serving_qty: 0.5,
        serving_unit: 'teaspoon',
        serving_weight_grams: 1.58,
        nf_calories: 5.24,
        nf_total_fat: 0.01,
        nf_saturated_fat: 0,
        nf_cholesterol: 0,
        nf_sodium: 0.95,
        nf_total_carbohydrate: 1.15,
        nf_dietary_fiber: 0.14,
        nf_sugars: 0.04,
        nf_protein: 0.26,
        nf_potassium: 18.89,
        nf_p: 6.56,
        full_nutrients: [
          { attr_id: 203, value: 0.262 },
          { attr_id: 204, value: 0.0116 },
          { attr_id: 205, value: 1.1516 },
          { attr_id: 207, value: 0.0561 },
          { attr_id: 208, value: 5.2408 },
          { attr_id: 210, value: 0.0325 },
          { attr_id: 211, value: 0.0011 },
          { attr_id: 212, value: 0.0049 },
          { attr_id: 213, value: 0 },
          { attr_id: 214, value: 0 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 0.1021 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 21.945 },
          { attr_id: 269, value: 0.0385 },
          { attr_id: 287, value: 0 },
          { attr_id: 291, value: 0.1425 },
          { attr_id: 301, value: 1.2508 },
          { attr_id: 303, value: 0.0895 },
          { attr_id: 304, value: 1.2192 },
          { attr_id: 305, value: 6.555 },
          { attr_id: 306, value: 18.8892 },
          { attr_id: 307, value: 0.95 },
          { attr_id: 309, value: 0.0473 },
          { attr_id: 312, value: 0.0084 },
          { attr_id: 315, value: 0.0155 },
          { attr_id: 317, value: 0.3784 },
          { attr_id: 318, value: 0 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 0 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0.0106 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 0 },
          { attr_id: 341, value: 0 },
          { attr_id: 342, value: 0 },
          { attr_id: 343, value: 0 },
          { attr_id: 344, value: 0 },
          { attr_id: 345, value: 0 },
          { attr_id: 346, value: 0 },
          { attr_id: 347, value: 0 },
          { attr_id: 401, value: 0.019 },
          { attr_id: 404, value: 0.0069 },
          { attr_id: 405, value: 0.0022 },
          { attr_id: 406, value: 0.0126 },
          { attr_id: 410, value: 0.0118 },
          { attr_id: 415, value: 0.0262 },
          { attr_id: 417, value: 0.7442 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 1.0688 },
          { attr_id: 429, value: 0 },
          { attr_id: 430, value: 0.0063 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 0.7442 },
          { attr_id: 435, value: 0.7442 },
          { attr_id: 454, value: 0.0966 },
          { attr_id: 501, value: 0.0019 },
          { attr_id: 502, value: 0.0059 },
          { attr_id: 503, value: 0.0066 },
          { attr_id: 504, value: 0.0115 },
          { attr_id: 505, value: 0.0122 },
          { attr_id: 506, value: 0.0018 },
          { attr_id: 507, value: 0.004 },
          { attr_id: 508, value: 0.0083 },
          { attr_id: 509, value: 0.0071 },
          { attr_id: 510, value: 0.0106 },
          { attr_id: 511, value: 0.0533 },
          { attr_id: 512, value: 0.0042 },
          { attr_id: 513, value: 0.0077 },
          { attr_id: 514, value: 0.0299 },
          { attr_id: 515, value: 0.0579 },
          { attr_id: 516, value: 0.0083 },
          { attr_id: 517, value: 0.0214 },
          { attr_id: 518, value: 0.008 },
          { attr_id: 521, value: 0 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0039 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0.0002 },
          { attr_id: 613, value: 0.0016 },
          { attr_id: 614, value: 0.0017 },
          { attr_id: 615, value: 0 },
          { attr_id: 617, value: 0.0017 },
          { attr_id: 618, value: 0.0023 },
          { attr_id: 619, value: 0.0002 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 624, value: 0.0004 },
          { attr_id: 625, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 636, value: 0.1267 },
          { attr_id: 645, value: 0.0018 },
          { attr_id: 646, value: 0.0028 },
          { attr_id: 652, value: 0 },
          { attr_id: 653, value: 0 },
          { attr_id: 654, value: 0 },
          { attr_id: 663, value: 0 },
          { attr_id: 671, value: 0.0001 },
          { attr_id: 672, value: 0.0004 },
          { attr_id: 674, value: 0.0017 },
          { attr_id: 685, value: 0 },
          { attr_id: 687, value: 0 },
          { attr_id: 689, value: 0 },
          { attr_id: 693, value: 0 },
          { attr_id: 696, value: 0 },
          { attr_id: 697, value: 0 },
          { attr_id: 851, value: 0.0002 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input: '1/2 teaspoon garlic powder',
        },
        source: 1,
        ndb_no: 2020,
        tags: {
          item: 'garlic powder',
          measure: 'teaspoon',
          quantity: 0.5,
          food_group: 9,
          tag_id: 1909,
        },
        alt_measures: [
          {
            serving_weight: 3.1,
            measure: 'tsp',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 9.7,
            measure: 'tbsp',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
          {
            serving_weight: 155.2,
            measure: 'cup',
            seq: 100,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/1909_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/1909_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'onion powder',
        brand_name: null,
        serving_qty: 0.5,
        serving_unit: 'teaspoon',
        serving_weight_grams: 1.18,
        nf_calories: 4.01,
        nf_total_fat: 0.01,
        nf_saturated_fat: 0,
        nf_cholesterol: 0,
        nf_sodium: 0.86,
        nf_total_carbohydrate: 0.93,
        nf_dietary_fiber: 0.18,
        nf_sugars: 0.08,
        nf_protein: 0.12,
        nf_potassium: 11.57,
        nf_p: 3.78,
        full_nutrients: [
          { attr_id: 203, value: 0.1223 },
          { attr_id: 204, value: 0.0122 },
          { attr_id: 205, value: 0.9297 },
          { attr_id: 207, value: 0.0475 },
          { attr_id: 208, value: 4.0068 },
          { attr_id: 210, value: 0.0455 },
          { attr_id: 211, value: 0.0086 },
          { attr_id: 212, value: 0.0196 },
          { attr_id: 213, value: 0 },
          { attr_id: 214, value: 0 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 0.0633 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 16.7908 },
          { attr_id: 269, value: 0.0779 },
          { attr_id: 287, value: 0.0042 },
          { attr_id: 291, value: 0.1786 },
          { attr_id: 301, value: 4.512 },
          { attr_id: 303, value: 0.0458 },
          { attr_id: 304, value: 1.3278 },
          { attr_id: 305, value: 3.7835 },
          { attr_id: 306, value: 11.5738 },
          { attr_id: 307, value: 0.8578 },
          { attr_id: 309, value: 0.0476 },
          { attr_id: 312, value: 0.0069 },
          { attr_id: 315, value: 0.0153 },
          { attr_id: 317, value: 0.168 },
          { attr_id: 318, value: 0 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 0 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0.0032 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 0 },
          { attr_id: 341, value: 0 },
          { attr_id: 342, value: 0.0006 },
          { attr_id: 343, value: 0 },
          { attr_id: 344, value: 0.0005 },
          { attr_id: 345, value: 0 },
          { attr_id: 346, value: 0 },
          { attr_id: 347, value: 0 },
          { attr_id: 401, value: 0.275 },
          { attr_id: 404, value: 0.0054 },
          { attr_id: 405, value: 0.0009 },
          { attr_id: 406, value: 0.0038 },
          { attr_id: 410, value: 0.0086 },
          { attr_id: 415, value: 0.0084 },
          { attr_id: 417, value: 0.752 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 0.4583 },
          { attr_id: 429, value: 0 },
          { attr_id: 430, value: 0.0482 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 0.752 },
          { attr_id: 435, value: 0.752 },
          { attr_id: 454, value: 0.0047 },
          { attr_id: 501, value: 0.0007 },
          { attr_id: 502, value: 0.0017 },
          { attr_id: 503, value: 0.0017 },
          { attr_id: 504, value: 0.0026 },
          { attr_id: 505, value: 0.0058 },
          { attr_id: 506, value: 0.0011 },
          { attr_id: 507, value: 0.0009 },
          { attr_id: 508, value: 0.0033 },
          { attr_id: 509, value: 0.0015 },
          { attr_id: 510, value: 0.002 },
          { attr_id: 511, value: 0.0229 },
          { attr_id: 512, value: 0.0019 },
          { attr_id: 513, value: 0.0021 },
          { attr_id: 514, value: 0.0078 },
          { attr_id: 515, value: 0.0246 },
          { attr_id: 516, value: 0.0032 },
          { attr_id: 517, value: 0.0081 },
          { attr_id: 518, value: 0.0017 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0026 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0.0013 },
          { attr_id: 614, value: 0.0003 },
          { attr_id: 615, value: 0.0004 },
          { attr_id: 617, value: 0.0024 },
          { attr_id: 618, value: 0.003 },
          { attr_id: 619, value: 0.0002 },
          { attr_id: 620, value: 0.0005 },
          { attr_id: 621, value: 0 },
          { attr_id: 624, value: 0.0006 },
          { attr_id: 625, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 636, value: 1.0223 },
          { attr_id: 645, value: 0.0024 },
          { attr_id: 646, value: 0.0036 },
          { attr_id: 652, value: 0 },
          { attr_id: 653, value: 0 },
          { attr_id: 654, value: 0 },
          { attr_id: 663, value: 0 },
          { attr_id: 671, value: 0 },
          { attr_id: 672, value: 0 },
          { attr_id: 674, value: 0.0024 },
          { attr_id: 685, value: 0 },
          { attr_id: 687, value: 0 },
          { attr_id: 689, value: 0 },
          { attr_id: 696, value: 0 },
          { attr_id: 697, value: 0 },
          { attr_id: 851, value: 0.0002 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input: '1/2 teaspoon onion powder',
        },
        source: 1,
        ndb_no: 2026,
        tags: {
          item: 'onion powder',
          measure: 'teaspoon',
          quantity: 0.5,
          food_group: 9,
          tag_id: 1928,
        },
        alt_measures: [
          {
            serving_weight: 2.4,
            measure: 'tsp',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 6.9,
            measure: 'tbsp',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
          {
            serving_weight: 110.4,
            measure: 'cup',
            seq: 100,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/1928_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/1928_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'water',
        brand_name: null,
        serving_qty: 355,
        serving_unit: 'ml',
        serving_weight_grams: 355.21,
        nf_calories: 0,
        nf_total_fat: 0,
        nf_saturated_fat: 0,
        nf_cholesterol: 0,
        nf_sodium: 14.21,
        nf_total_carbohydrate: 0,
        nf_dietary_fiber: 0,
        nf_sugars: 0,
        nf_protein: 0,
        nf_potassium: 0,
        nf_p: 0,
        full_nutrients: [
          { attr_id: 203, value: 0 },
          { attr_id: 204, value: 0 },
          { attr_id: 205, value: 0 },
          { attr_id: 207, value: 0.3552 },
          { attr_id: 208, value: 0 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 354.8511 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 0 },
          { attr_id: 269, value: 0 },
          { attr_id: 291, value: 0 },
          { attr_id: 301, value: 10.6562 },
          { attr_id: 303, value: 0 },
          { attr_id: 304, value: 3.5521 },
          { attr_id: 305, value: 0 },
          { attr_id: 306, value: 0 },
          { attr_id: 307, value: 14.2083 },
          { attr_id: 309, value: 0.0355 },
          { attr_id: 312, value: 0.0355 },
          { attr_id: 313, value: 252.9069 },
          { attr_id: 315, value: 0 },
          { attr_id: 317, value: 0 },
          { attr_id: 318, value: 0 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 0 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 0 },
          { attr_id: 401, value: 0 },
          { attr_id: 404, value: 0 },
          { attr_id: 405, value: 0 },
          { attr_id: 406, value: 0 },
          { attr_id: 410, value: 0 },
          { attr_id: 415, value: 0 },
          { attr_id: 417, value: 0 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 0 },
          { attr_id: 430, value: 0 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 0 },
          { attr_id: 435, value: 0 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0 },
          { attr_id: 614, value: 0 },
          { attr_id: 617, value: 0 },
          { attr_id: 618, value: 0 },
          { attr_id: 619, value: 0 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 645, value: 0 },
          { attr_id: 646, value: 0 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input: '1 1/2 cups (355ml) water',
        },
        source: 1,
        ndb_no: 14411,
        tags: {
          item: 'tap water',
          measure: 'ml',
          quantity: 355.0,
          food_group: 9,
          tag_id: 4483,
        },
        alt_measures: [
          {
            serving_weight: 1000,
            measure: 'liter',
            seq: 3,
            qty: 1,
          },
          {
            serving_weight: 237,
            measure: 'serving 8 fl oz',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 29.6,
            measure: 'fl oz',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 236.8,
            measure: 'cup',
            seq: 100,
            qty: 1,
          },
          {
            serving_weight: 4.93,
            measure: 'tsp',
            seq: 101,
            qty: 1,
          },
          {
            serving_weight: 14.8,
            measure: 'tbsp',
            seq: 102,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/4483_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/4483_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'white vinegar',
        brand_name: null,
        serving_qty: 60,
        serving_unit: 'ml',
        serving_weight_grams: 60.56,
        nf_calories: 10.9,
        nf_total_fat: 0,
        nf_saturated_fat: 0,
        nf_cholesterol: 0,
        nf_sodium: 1.21,
        nf_total_carbohydrate: 0.02,
        nf_dietary_fiber: 0,
        nf_sugars: 0.02,
        nf_protein: 0,
        nf_potassium: 1.21,
        nf_p: 2.42,
        full_nutrients: [
          { attr_id: 203, value: 0 },
          { attr_id: 204, value: 0 },
          { attr_id: 205, value: 0.0242 },
          { attr_id: 207, value: 0.0121 },
          { attr_id: 208, value: 10.9008 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 57.3987 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 46.0256 },
          { attr_id: 269, value: 0.0242 },
          { attr_id: 291, value: 0 },
          { attr_id: 301, value: 3.6336 },
          { attr_id: 303, value: 0.0182 },
          { attr_id: 304, value: 0.6056 },
          { attr_id: 305, value: 2.4224 },
          { attr_id: 306, value: 1.2112 },
          { attr_id: 307, value: 1.2112 },
          { attr_id: 309, value: 0.0061 },
          { attr_id: 312, value: 0.0036 },
          { attr_id: 315, value: 0.0333 },
          { attr_id: 317, value: 0.3028 },
          { attr_id: 318, value: 0 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 0 },
          { attr_id: 321, value: 0 },
          { attr_id: 322, value: 0 },
          { attr_id: 323, value: 0 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 0 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 0 },
          { attr_id: 401, value: 0 },
          { attr_id: 404, value: 0 },
          { attr_id: 405, value: 0 },
          { attr_id: 406, value: 0 },
          { attr_id: 410, value: 0 },
          { attr_id: 415, value: 0 },
          { attr_id: 417, value: 0 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 0 },
          { attr_id: 430, value: 0 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 0 },
          { attr_id: 435, value: 0 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0 },
          { attr_id: 614, value: 0 },
          { attr_id: 617, value: 0 },
          { attr_id: 618, value: 0 },
          { attr_id: 619, value: 0 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 645, value: 0 },
          { attr_id: 646, value: 0 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: 2021 - 0o2 - 16,
        metadata: {
          is_raw_food: false,
          original_input: '2 tablespoons (30ml) distilled white vinegar',
        },
        source: 1,
        ndb_no: 2053,
        tags: {
          item: 'white vinegar',
          measure: 'ml',
          quantity: 60.0,
          food_group: 0,
          tag_id: 1187,
        },
        alt_measures: [
          {
            serving_weight: 5,
            measure: 'tsp',
            seq: 3,
            qty: 1,
          },
          {
            serving_weight: 14.9,
            measure: 'tbsp',
            seq: 1,
            qty: 1,
          },
          {
            serving_weight: 238,
            measure: 'cup',
            seq: 2,
            qty: 1,
          },
          {
            serving_weight: 100,
            measure: 'g',
            seq: null,
            qty: 100,
          },
          {
            serving_weight: 28.3495,
            measure: 'wt. oz',
            seq: null,
            qty: 1,
          },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/1187_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/1187_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
    ],
    errors: [
      {
        original_text: '3 Scotch bonnet chile peppers (about 3/4 ounce; 20g)',
        warning:
          'There were multiple foods detected for the ingredient on line 2',
        err_code: 100,
      },
      {
        original_text:
          '1 pound (455g) large shell-on shrimp, preferably head-on, rinsed',
        warning:
          'There were multiple foods detected for the ingredient on line 3',
        err_code: 100,
      },
      {
        original_text:
          '1 tablespoon (15ml) annatto oil or neutral oil such as vegetable oil',
        warning:
          'There were multiple foods detected for the ingredient on line 8',
        err_code: 100,
      },
      {
        original_text: '1 1/2  teaspoons (6g) annatto (achiote) powder',
        warning: 'There were no foods detected for the ingredient on line 10',
        err_code: 101,
      },
      {
        original_text: '6 allspice berries',
        warning:
          'There were multiple foods detected for the ingredient on line 15',
        err_code: 100,
      },
    ],
  }
  ingredientResFake: any = {
    foods: [
      {
        food_name: 'scotch bonnet',
        brand_name: null,
        serving_qty: 3,
        serving_unit: 'pepper',
        serving_weight_grams: 135,
        nf_calories: 54,
        nf_total_fat: 0.59,
        nf_saturated_fat: 0.06,
        nf_cholesterol: 0,
        nf_sodium: 12.15,
        nf_total_carbohydrate: 11.89,
        nf_dietary_fiber: 2.03,
        nf_sugars: 7.16,
        nf_protein: 2.52,
        nf_potassium: 434.7,
        nf_p: 58.05,
        full_nutrients: [
          { attr_id: 203, value: 2.5245 },
          { attr_id: 204, value: 0.594 },
          { attr_id: 205, value: 11.8935 },
          { attr_id: 207, value: 1.1745 },
          { attr_id: 208, value: 54 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 118.827 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 224.1 },
          { attr_id: 269, value: 7.155 },
          { attr_id: 291, value: 2.025 },
          { attr_id: 301, value: 18.9 },
          { attr_id: 303, value: 1.3905 },
          { attr_id: 304, value: 31.05 },
          { attr_id: 305, value: 58.05 },
          { attr_id: 306, value: 434.7 },
          { attr_id: 307, value: 12.15 },
          { attr_id: 309, value: 0.351 },
          { attr_id: 312, value: 0.1742 },
          { attr_id: 315, value: 0.2525 },
          { attr_id: 317, value: 0.675 },
          { attr_id: 318, value: 1285.2 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 64.8 },
          { attr_id: 321, value: 720.9 },
          { attr_id: 322, value: 48.6 },
          { attr_id: 323, value: 0.9315 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 54 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 957.15 },
          { attr_id: 401, value: 193.995 },
          { attr_id: 404, value: 0.0972 },
          { attr_id: 405, value: 0.1161 },
          { attr_id: 406, value: 1.6794 },
          { attr_id: 410, value: 0.2714 },
          { attr_id: 415, value: 0.6831 },
          { attr_id: 417, value: 31.05 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 14.715 },
          { attr_id: 430, value: 18.9 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 31.05 },
          { attr_id: 435, value: 31.05 },
          { attr_id: 501, value: 0.0351 },
          { attr_id: 502, value: 0.0999 },
          { attr_id: 503, value: 0.0878 },
          { attr_id: 504, value: 0.1418 },
          { attr_id: 505, value: 0.1202 },
          { attr_id: 506, value: 0.0324 },
          { attr_id: 507, value: 0.0513 },
          { attr_id: 508, value: 0.0837 },
          { attr_id: 509, value: 0.0567 },
          { attr_id: 510, value: 0.1134 },
          { attr_id: 511, value: 0.1296 },
          { attr_id: 512, value: 0.0554 },
          { attr_id: 513, value: 0.1107 },
          { attr_id: 514, value: 0.3861 },
          { attr_id: 515, value: 0.3564 },
          { attr_id: 516, value: 0.0999 },
          { attr_id: 517, value: 0.1175 },
          { attr_id: 518, value: 0.108 },
          { attr_id: 601, value: 0 },
          { attr_id: 606, value: 0.0567 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0.0027 },
          { attr_id: 613, value: 0.0446 },
          { attr_id: 614, value: 0.0095 },
          { attr_id: 617, value: 0.0324 },
          { attr_id: 618, value: 0.3078 },
          { attr_id: 619, value: 0.0149 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 645, value: 0.0324 },
          { attr_id: 646, value: 0.3227 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: '2021-02-18T01:15:16+00:00',
        metadata: { is_raw_food: false },
        source: 1,
        ndb_no: 1000568,
        tags: {
          item: 'scotch bonnet pepper',
          measure: null,
          quantity: '3',
          food_group: 9,
          tag_id: 9433,
        },
        alt_measures: [
          { serving_weight: 45, measure: 'pepper', seq: 1, qty: 1 },
          { serving_weight: 100, measure: 'g', seq: null, qty: 100 },
          { serving_weight: 28.3495, measure: 'wt. oz', seq: null, qty: 1 },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb:
            'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png',
          highres: null,
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'chile',
        brand_name: null,
        serving_qty: 1,
        serving_unit: 'pepper',
        serving_weight_grams: 45,
        nf_calories: 18,
        nf_total_fat: 0.2,
        nf_saturated_fat: 0.02,
        nf_cholesterol: 0,
        nf_sodium: 4.05,
        nf_total_carbohydrate: 3.96,
        nf_dietary_fiber: 0.68,
        nf_sugars: 2.38,
        nf_protein: 0.84,
        nf_potassium: 144.9,
        nf_p: 19.35,
        full_nutrients: [
          { attr_id: 203, value: 0.8415 },
          { attr_id: 204, value: 0.198 },
          { attr_id: 205, value: 3.9645 },
          { attr_id: 207, value: 0.3915 },
          { attr_id: 208, value: 18 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 39.609 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 74.7 },
          { attr_id: 269, value: 2.385 },
          { attr_id: 291, value: 0.675 },
          { attr_id: 301, value: 6.3 },
          { attr_id: 303, value: 0.4635 },
          { attr_id: 304, value: 10.35 },
          { attr_id: 305, value: 19.35 },
          { attr_id: 306, value: 144.9 },
          { attr_id: 307, value: 4.05 },
          { attr_id: 309, value: 0.117 },
          { attr_id: 312, value: 0.0581 },
          { attr_id: 315, value: 0.0842 },
          { attr_id: 317, value: 0.225 },
          { attr_id: 318, value: 428.4 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 21.6 },
          { attr_id: 321, value: 240.3 },
          { attr_id: 322, value: 16.2 },
          { attr_id: 323, value: 0.3105 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 18 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 319.05 },
          { attr_id: 401, value: 64.665 },
          { attr_id: 404, value: 0.0324 },
          { attr_id: 405, value: 0.0387 },
          { attr_id: 406, value: 0.5598 },
          { attr_id: 410, value: 0.0905 },
          { attr_id: 415, value: 0.2277 },
          { attr_id: 417, value: 10.35 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 4.905 },
          { attr_id: 430, value: 6.3 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 10.35 },
          { attr_id: 435, value: 10.35 },
          { attr_id: 501, value: 0.0117 },
          { attr_id: 502, value: 0.0333 },
          { attr_id: 503, value: 0.0293 },
          { attr_id: 504, value: 0.0473 },
          { attr_id: 505, value: 0.0401 },
          { attr_id: 506, value: 0.0108 },
          { attr_id: 507, value: 0.0171 },
          { attr_id: 508, value: 0.0279 },
          { attr_id: 509, value: 0.0189 },
          { attr_id: 510, value: 0.0378 },
          { attr_id: 511, value: 0.0432 },
          { attr_id: 512, value: 0.0185 },
          { attr_id: 513, value: 0.0369 },
          { attr_id: 514, value: 0.1287 },
          { attr_id: 515, value: 0.1188 },
          { attr_id: 516, value: 0.0333 },
          { attr_id: 517, value: 0.0392 },
          { attr_id: 518, value: 0.036 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0189 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0.0009 },
          { attr_id: 613, value: 0.0149 },
          { attr_id: 614, value: 0.0032 },
          { attr_id: 617, value: 0.0108 },
          { attr_id: 618, value: 0.1026 },
          { attr_id: 619, value: 0.005 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 645, value: 0.0108 },
          { attr_id: 646, value: 0.1076 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: '2021-02-18T01:15:16+00:00',
        metadata: { is_raw_food: false },
        source: 1,
        ndb_no: 11819,
        tags: {
          item: 'chile',
          measure: null,
          quantity: '1.0',
          food_group: 4,
          tag_id: 9158,
        },
        alt_measures: [
          {
            serving_weight: 75,
            measure: 'cup, chopped or diced',
            seq: 2,
            qty: 0.5,
          },
          { serving_weight: 45, measure: 'pepper', seq: 1, qty: 1 },
          { serving_weight: 100, measure: 'g', seq: null, qty: 100 },
          { serving_weight: 28.3495, measure: 'wt. oz', seq: null, qty: 1 },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb: 'https://nix-tag-images.s3.amazonaws.com/9158_thumb.jpg',
          highres: 'https://nix-tag-images.s3.amazonaws.com/9158_highres.jpg',
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
      {
        food_name: 'peppers',
        brand_name: null,
        serving_qty: 1,
        serving_unit: 'pepper',
        serving_weight_grams: 114,
        nf_calories: 31.54,
        nf_total_fat: 0.23,
        nf_saturated_fat: 0.03,
        nf_cholesterol: 0,
        nf_sodium: 2.28,
        nf_total_carbohydrate: 7.49,
        nf_dietary_fiber: 1.25,
        nf_sugars: 2.88,
        nf_protein: 1.08,
        nf_potassium: 206.72,
        nf_p: 22.8,
        full_nutrients: [
          { attr_id: 203, value: 1.0792 },
          { attr_id: 204, value: 0.2318 },
          { attr_id: 205, value: 7.4936 },
          { attr_id: 207, value: 0.4066 },
          { attr_id: 208, value: 31.54 },
          { attr_id: 210, value: 0.057 },
          { attr_id: 211, value: 0.589 },
          { attr_id: 212, value: 0.57 },
          { attr_id: 213, value: 0 },
          { attr_id: 214, value: 0 },
          { attr_id: 221, value: 0 },
          { attr_id: 255, value: 104.7888 },
          { attr_id: 262, value: 0 },
          { attr_id: 263, value: 0 },
          { attr_id: 268, value: 131.48 },
          { attr_id: 269, value: 2.8804 },
          { attr_id: 287, value: 0 },
          { attr_id: 291, value: 1.254 },
          { attr_id: 301, value: 11.02 },
          { attr_id: 303, value: 0.5244 },
          { attr_id: 304, value: 12.16 },
          { attr_id: 305, value: 22.8 },
          { attr_id: 306, value: 206.72 },
          { attr_id: 307, value: 2.28 },
          { attr_id: 309, value: 0.1558 },
          { attr_id: 312, value: 0.0901 },
          { attr_id: 315, value: 0.1319 },
          { attr_id: 317, value: 0.342 },
          { attr_id: 318, value: 1371.42 },
          { attr_id: 319, value: 0 },
          { attr_id: 320, value: 68.4 },
          { attr_id: 321, value: 725.42 },
          { attr_id: 322, value: 16.72 },
          { attr_id: 323, value: 0.817 },
          { attr_id: 324, value: 0 },
          { attr_id: 328, value: 0 },
          { attr_id: 334, value: 177.84 },
          { attr_id: 337, value: 0 },
          { attr_id: 338, value: 181.64 },
          { attr_id: 341, value: 0 },
          { attr_id: 342, value: 0.0038 },
          { attr_id: 343, value: 0 },
          { attr_id: 401, value: 162.982 },
          { attr_id: 404, value: 0.0555 },
          { attr_id: 405, value: 0.0323 },
          { attr_id: 406, value: 0.7007 },
          { attr_id: 410, value: 0.1239 },
          { attr_id: 415, value: 0.2409 },
          { attr_id: 417, value: 22.04 },
          { attr_id: 418, value: 0 },
          { attr_id: 421, value: 5.016 },
          { attr_id: 430, value: 5.662 },
          { attr_id: 431, value: 0 },
          { attr_id: 432, value: 22.04 },
          { attr_id: 435, value: 22.04 },
          { attr_id: 501, value: 0.0141 },
          { attr_id: 502, value: 0.0399 },
          { attr_id: 503, value: 0.035 },
          { attr_id: 504, value: 0.0562 },
          { attr_id: 505, value: 0.0479 },
          { attr_id: 506, value: 0.0129 },
          { attr_id: 507, value: 0.0209 },
          { attr_id: 508, value: 0.0338 },
          { attr_id: 509, value: 0.0224 },
          { attr_id: 510, value: 0.0456 },
          { attr_id: 511, value: 0.0517 },
          { attr_id: 512, value: 0.0221 },
          { attr_id: 513, value: 0.0444 },
          { attr_id: 514, value: 0.1547 },
          { attr_id: 515, value: 0.1429 },
          { attr_id: 516, value: 0.0399 },
          { attr_id: 517, value: 0.0471 },
          { attr_id: 518, value: 0.0433 },
          { attr_id: 601, value: 0 },
          { attr_id: 605, value: 0 },
          { attr_id: 606, value: 0.0338 },
          { attr_id: 607, value: 0 },
          { attr_id: 608, value: 0 },
          { attr_id: 609, value: 0 },
          { attr_id: 610, value: 0 },
          { attr_id: 611, value: 0 },
          { attr_id: 612, value: 0 },
          { attr_id: 613, value: 0.0167 },
          { attr_id: 614, value: 0.0053 },
          { attr_id: 617, value: 0.0091 },
          { attr_id: 618, value: 0.0729 },
          { attr_id: 619, value: 0.0076 },
          { attr_id: 620, value: 0 },
          { attr_id: 621, value: 0 },
          { attr_id: 626, value: 0.0007 },
          { attr_id: 627, value: 0 },
          { attr_id: 628, value: 0 },
          { attr_id: 629, value: 0 },
          { attr_id: 630, value: 0 },
          { attr_id: 631, value: 0 },
          { attr_id: 636, value: 6.84 },
          { attr_id: 645, value: 0.0099 },
          { attr_id: 646, value: 0.0805 },
        ],
        nix_brand_name: null,
        nix_brand_id: null,
        nix_item_name: null,
        nix_item_id: null,
        upc: null,
        consumed_at: '2021-02-18T01:15:16+00:00',
        metadata: { is_raw_food: false },
        source: 1,
        ndb_no: 1006253,
        tags: {
          item: 'rainbow bell pepper',
          measure: null,
          quantity: '1.0',
          food_group: 4,
          tag_id: 15444,
        },
        alt_measures: [
          { serving_weight: 135, measure: 'cup, strips', seq: 2, qty: 1 },
          { serving_weight: 114, measure: 'pepper', seq: 1, qty: 1 },
          { serving_weight: 100, measure: 'g', seq: null, qty: 100 },
          { serving_weight: 28.3495, measure: 'wt. oz', seq: null, qty: 1 },
        ],
        lat: null,
        lng: null,
        meal_type: 5,
        photo: {
          thumb:
            'https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png',
          highres: null,
          is_user_uploaded: false,
        },
        sub_recipe: null,
      },
    ],
  }
  detailsLoading: boolean = true

  // firebase
  usersPath: string = '/users/'
  recipesPath: string = '/recipes/'
  ingredientsPath: string = '/final_ingredients/'
  linksPath: string = '/links/'
  userLinks: any | undefined
  savedLink: boolean = false
  loadedLink: boolean = false
  recipeKey: string | undefined
  recipeLink: string = ''

  userLogin: any = {}

  spreadsheetMimes: string[] = [
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'text/tsv',
  ]

  recipeScraperSubscription: Subscription = new Subscription()
  nutritionixFoodByIdSubscription: Subscription = new Subscription()
  nutritionixNlpSubscription: Subscription = new Subscription()

  signInSubscription: Subscription = new Subscription()

  constructor(
    private dataService: DataService,
    private modalService: NgbModal,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.userLogin.uid = '1rhLawyeExhyELfFjy8GZ8sGeuy2'
    // this.dataService.getUser().subscribe(
    //   (res) => {
    //     this.userLogin = res
    //   },
    //   (err) => {
    //     console.log(err)
    //   }
    // )
    if (this.userLogin.uid) {
      this.dataService
        .getFireObject(this.usersPath + this.userLogin.uid + this.linksPath)
        .subscribe(
          (res) => {
            console.log(res)
            this.userLinks = res
            // TODO: pipe? res --> for loop get saved recipes
            // for (let link of this.userLinks) {
            //   this.dataService
            //     .getFireObject(this.recipesPath + this.recipeKey)
            //     .subscribe(
            //       (res) => {
            //         this.recipes.push(res)
            //       },
            //       (err) => {
            //         console.log(err)
            //       }
            //     )
            // }
          },
          (err) => {
            console.log(err)
          }
        )
    }
    // this.links = this.fake_links
    // this.test() // TODO: comment out
  }

  ngOnDestroy(): void {
    if (this.recipeScraperSubscription) {
      this.recipeScraperSubscription.unsubscribe()
    }
  }

  test() {
    this.linksTextInput =
      'https://www.seriouseats.com/negroni-cocktail-recipe-gin-campari-vermouth'
    this.convertButton()
  }

  convertButton() {
    this.title = ''
    this.listLinks()
    this.listRecipes()
    // this.checkVariables()
  }

  checkVariables() {
    console.log('links')
    console.log(this.links)
    console.log('linksTextInput')
    console.log(this.linksTextInput)
    console.log('recipes: ')
    console.log(this.recipes)
  }

  // retry scraping a recipe
  retry(recipe: any): void {
    recipe.status = 'loading'
    this.getRecipe(recipe)
  }

  // search recipes for any incomplete/errors and retry scraping their recipes
  retryMany(): void {
    for (let recipe of this.recipes) {
      if (recipe.status !== 'complete') {
        this.retry(recipe)
      }
    }
  }

  // populates this.links with links from text and file inputs
  listLinks() {
    this.links = []
    this.noLinks = false
    this.duplicateLinks = false
    // this.linksTextInput = this.linksTextInputFAKE // mock data
    if (this.linksTextInput) {
      let inputLinks = this.splitLinks(this.linksTextInput)
      this.addToLinks(inputLinks)
    }
    if (this.uploadedFiles) {
      this.addToLinks(this.uploadedFiles)
    }

    if (this.links.length < 1) {
      this.noLinks = true
    }
  }

  // each link: checking if they're already in this.recipes AND/OR firebase, and if not then getting the recipe for it
  listRecipes(): void {
    for (let link of this.links) {
      let standardLink = this.standardUrl(link)
      if (this.userLinks === null) {
      } else {
        this.savedLink = Object.values(this.userLinks).includes(standardLink)
        this.loadedLink = this.recipes.some((e) => e.link === standardLink)
      }
      if (link) {
        if (this.recipes.some((r) => r.link === standardLink)) {
          this.duplicateLinks = true
        }
        if (this.savedLink && !this.loadedLink) {
          let tempRecipeKey = Object.keys(this.userLinks).find(
            (key) => this.userLinks[key] === standardLink
          )
          this.dataService
            .getFireObject(this.recipesPath + tempRecipeKey)
            .subscribe(
              (res) => {
                this.recipes.push(res)
              },
              (err) => {
                console.log(err)
              }
            )
        } else if (this.savedLink && this.loadedLink) {
        } else {
          let recipe = {
            original_data: { url: link },
            filter_data: {},
            status: 'loading',
            link: standardLink,
          }
          // recipe = this.recipeFake // ** MOCK DATA **
          this.recipes.push(recipe)
          this.getRecipe(recipe)
        }
      }
    }
  }

  // scrape recipe for a link
  getRecipe(recipe: any): void {
    this.loading = true
    // ** USE FOR MOCK DATA
    // recipe.user = this.userLogin.uid
    // this.loading = false
    // this.recipeKey = this.dataService.addFire(
    //   this.usersPath + recipe.user + this.linksPath,
    //   recipe.link
    // )
    // this.dataService.createFire(this.recipesPath + this.recipeKey, recipe)
    // this.openRecipeDetails(recipe)  // for single handling
    // ** USE FOR MOCK DATA
    this.recipeScraperSubscription = this.dataService
      .getScrapedRecipe(recipe.original_data.url)
      .subscribe(
        (res) => {
          if ((res as any).value) {
            // console.log(res)
            recipe.original_data = (res as any).value
            recipe.filter_data = clone((res as any).value)
            recipe.status = 'complete'
            if (this.userLogin.uid) {
              recipe.user = this.userLogin.uid
              let tempRecipeKey = this.dataService.addFire(
                this.usersPath + recipe.user + this.linksPath,
                recipe.link
              )
              this.dataService.createFire(
                this.recipesPath + tempRecipeKey,
                recipe
              )
            } else {
              this.dataService.storeRecipeDB(recipe) // TODO: uses session storage, need non-user data handling
              recipe.user = 'guest'
            }
            this.loading = false
          } else {
            recipe.status = 'error'
            console.log('no recipe')
          }
          this.recipeScraperSubscription.unsubscribe()
        },
        (err) => {
          console.log(err)
          recipe.status = 'error'
          this.recipeScraperSubscription.unsubscribe()
        }
      )
  }

  splitLinks(rawLinks: string) {
    let splitLinks = this.checkIfUrl(rawLinks)
    if (splitLinks) {
      // splitLinks.forEach(function(item: string, index: number, links: string[]) { links[index] = item.replace(/\s/g, '') });
      return splitLinks
    } else {
      return ['']
    }
  }

  // slightly pointless, bad links get through
  checkIfUrl(str: string) {
    let geturl = new RegExp(
      '((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))',
      // one below gets bothered by things before the https
      // "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
      'g'
    )
    return str.match(geturl)
  }

  standardUrl(str: string) {
    return str.split('www.')[1]
  }

  addToLinks(links: string[]) {
    this.links = this.links.concat(links).filter((l) => {
      return l
    })
  }

  anyIncomplete(): boolean {
    return (
      this.recipes.length > 0 &&
      this.recipes.some((r) => r.status !== 'complete')
    )
  }

  handleFileInput(e: any) {
    let files = e.target.files
    if (files.item(0)) {
      let fileToUpload = files.item(0)
      if (this.spreadsheetMimes.includes(fileToUpload.type)) {
        parse(fileToUpload, {
          complete: (res) => {
            this.uploadedFiles = flatten(res.data) || ['']
          },
          error: (err) => {
            console.log(err)
          },
        })
      } else {
        let reader: FileReader = new FileReader()
        reader.onload = (e) => {
          let fileString: any = reader.result
          this.uploadedFiles = this.splitLinks(fileString) || ['']
        }
        reader.readAsText(fileToUpload)
      }
    }
  }

  openRecipeDetails(recipe: any): void {
    this.selectRecipe = recipe
    this.recipeKey = Object.keys(this.userLinks).find(
      (key) => this.userLinks[key] === this.selectRecipe.link
    )
    this.savedLink = Object.values(this.userLinks).includes(
      this.selectRecipe.link
    )
    this.ingredientsNlp = ''
    for (let ingredient of recipe.original_data.recipeIngredients) {
      this.ingredientsNlp = this.ingredientsNlp.concat('\n', ingredient)
    }
    this.detailsLoading = true
    if (this.savedLink && recipe.final_ingredients) {
      this.detailsLoading = false
    } else {
      // ** USE FOR MOCK DATA **
      // let res = this.resFAKE
      // this.openModal(res)
      // ** USE FOR MOCK DATA **
      this.nutritionixNlpSubscription = this.dataService
        .getFoodByNlp(this.ingredientsNlp)
        .subscribe(
          (res) => {
            this.recipeLink = recipe.link
            this.openModal(res)
            // console.log(res)
            this.nutritionixNlpSubscription.unsubscribe()
          },
          (err) => {
            console.log(err)
            this.nutritionixNlpSubscription.unsubscribe()
          }
        )
    }
  }

  // opens recipe-details-modal, passes recipe ingredient API results for user edit and submission
  openModal(res: any) {
    const modalRef = this.modalService.open(RecipeDetailsModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    })
    modalRef.componentInstance.IngredientApiReturn = res
    modalRef.componentInstance.servingSize = this.selectRecipe.original_data.recipeYield
    modalRef.componentInstance.recipeTitle = this.title

    modalRef.result.then((modalOutput: any) => {
      //  TODO: selectRecipe --> recipe-details but after modal input, selectRecipe needs manual update or updated Fire object needs to be got
      this.selectRecipe.final_ingredients = modalOutput.finalIngredients
      // same for .recipeYield
      // ***
      this.dataService.updateFire(
        this.recipesPath + this.recipeKey + this.ingredientsPath,
        modalOutput.finalIngredients
      )
      this.dataService.updateFire(
        this.recipesPath + this.recipeKey + '/filter_data/recipeYield',
        modalOutput.userSetSize
      )
      this.detailsLoading = false
    })
  }

  // TODO: sessionStorage status unknown
  isSessionStorage(): boolean {
    return sessionStorage.length > 0
  }

  clearSession(): void {
    sessionStorage.clear()
  }
}
