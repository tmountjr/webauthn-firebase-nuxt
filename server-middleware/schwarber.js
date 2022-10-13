import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import { load } from 'cheerio'

const scrape = async () => {
  const url = 'https://www.baseball-reference.com/players/s/schwaky01.shtml'
  const statsResponse = await axios.get(url)
  const $ = load(statsResponse.data)
  const headerRow = $('#div_batting_standard thead th')
  const headers = []
  headerRow.each((_idx, el) => headers.push($(el).text()))
  const dataRows = $('#div_batting_standard tbody tr:not([class*="hidden"]):not([class*=partial])')
  const data = []
  dataRows.each((_idx, el) => {
    const toReturn = {}
    const rows = $(el).children()
    toReturn[headers[0]] = rows.first().text()
    const cells = $(el).children('td')
    cells.each((idx, cell) => {
      const $cell = $(cell)
      const key = headers[idx + 1]
      let val = ''
      if ($cell.has('a').length > 0) {
        val = $cell.children().first().text()
      } else {
        val = $cell.text()
      }
      toReturn[key] = val
    })
    data.push(toReturn)
  })
  return { data, createdAt: Date.now() }
}

// Create a placeholder for scraped data.
let cachedData = { data: null, createdAt: 0 }

// Only fetch once per day.
const maxAge = 1000 * 60 * 60 * 24

// Set up middleware to automatically handle updating the data.
const refreshMiddleware = async (req, _res, next) => {
  if (
    (Date.now() > cachedData.createdAt + maxAge) ||
    ('refresh' in req.query && req.query.refresh === 'yes')
  ) {
    cachedData = await scrape()
  }
  return next()
}

const app = express()
app.use(bodyParser.json())

/**
 * Get specific stats for a single year.
 */
app.get('/year/:year/key/:statKey', refreshMiddleware, (req, res) => {
  const keys = req.params.statKey.split(',')
  const data = cachedData.data.filter(col => col.Year === req.params.year)
  const toReturn = keys.reduce((acc, key) => {
    acc[key] = key in data[0]
      ? data[0][key]
      : null
    return acc
  }, {})
  res.json({ data: toReturn })
})

/**
 * Get all stats for a single year.
 */
app.get('/year/:year', refreshMiddleware, (req, res) => {
  const data = cachedData.data.filter(col => col.Year === req.params.year)
  res.json({ data })
})

/**
 * Get specific stats for all years.
 */
app.get('/key/:statKey', refreshMiddleware, (req, res) => {
  let keys = req.params.statKey.split(',')
  if (!keys.includes('Year')) {
    keys = ['Year', ...keys]
  }
  const data = cachedData.data.map(year =>
    keys.reduce((accumulator, key) => {
      accumulator[key] = key in year
        ? year[key]
        : null
      return accumulator
    }, {})
  )
  res.json({ data })
})

/**
 * Get all stats for all years.
 */
app.get('/', refreshMiddleware, (_req, res) => {
  res.json({ data: cachedData.data })
})

export default app
