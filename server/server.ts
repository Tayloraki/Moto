const express = require('express')
const app = express()
const recipeScraper = require('recipe-scraper')

app.listen(8000, () => {
  console.log('Server started!')
})

app.get('/', (req: any, res: any) => {
  res.send({ hello: 'world' })
})

app.get('/api/recipe/*', (req: any, res: any) => {
  let recipeUrl = req.params[0]
  recipeScraper(recipeUrl)
    .then((recipe) => {
      res.send({ value: recipe })
    })
    .catch((error) => {
      res.send({ error: error })
    })
})
