const express = require('express')
const app = express()
const recipeScraper = require("recipe-scraper")

// Google Doc API imports
const fs = require('fs')
const readline = require('readline')
const google = require('googleapis')

app.listen(8000, () => {
  console.log('Server started!')
})

app.get('/', (req: any, res: any) => {
    res.send({ hello: 'world' })
})

app.get('/api/recipe/*', (req: any, res: any) => {
  let recipeUrl = req.params[0]
  recipeScraper(recipeUrl).then(recipe => {
    res.send({ value: recipe })
  }).catch(error => {
    res.send({ error: error })
  })
})

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json'

function callGoogleDocsAPI(callback) {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err)
    // Authorize a client with credentials, then call the Google Docs API.
    // authorize(JSON.parse(content), getDoc)
    authorize(JSON.parse(content), callback)
    // console.log(callback)
  })
  // return 'yo'
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0])

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback)
    oAuth2Client.setCredentials(JSON.parse(token))
    callback(oAuth2Client)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
function printDocTitle(auth) {
  const docs = google.docs({version: 'v1', auth})
  docs.documents.get({
    documentId: '11lAVjS-iGrVljGBgojHmZBuL7z3rqeqbBtg8rNp3LKo',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err)
    console.log(`The title of the document is: ${res.data.title}`)
    let printedTitle = res.data.title
    return printedTitle
  })
}


// api.get(/endpoint/doc) { if (doc) let data = getDoc(doc) res.send(data)}
// getDoc(data) ()

app.get('/google-api/doc/:docID', async (req: any, res: any) => {
  try {
    let requestDocID = req.params['docID']
    // requestDocID = '11lAVjS-iGrVljGBgojHmZBuL7z3rqeqbBtg8rNp3LKo'
    // console.log('callAPI: ' + callGoogleDocsAPI(printDocTitle))
    let docData = callGoogleDocsAPI(printDocTitle)
    console.log('docData')
    console.log(docData)
    res.send({ googleDoc: requestDocID ,  docName: docData })
    console.log('app.get res: ' + res)
  } catch(error) {
    console.log(error)
  }
    
})

// function getDoc(auth, requestDocID: string) {
function getDoc(auth) {
  const docs = google.docs({version: 'v1', auth})
  docs.documents.get({
    // documentId: requestDocID,
    documentId: '11lAVjS-iGrVljGBgojHmZBuL7z3rqeqbBtg8rNp3LKo'
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err)
    // return (res.data.body.content[2].table)
  })
}

    // TODO: figure out how to make res wait for the async request
    // TODO: figure out how to pass in requestDocID above in the callGoogleDocsAPI() call

    // console.log(res.data.body.content[2].table.tableRows[0].tableCells[1].content[0].paragraph.elements[0].textRun.content)