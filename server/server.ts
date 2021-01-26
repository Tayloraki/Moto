const express = require('express')
const app = express()

app.listen(8000, () => {
  console.log('Server started!')
})

app.get('/', (req, res) => {
    res.send({ hello: 'world' })
})
