#!/usr/bin/env /Users/nuc/.nvm/versions/node/v20.7.0/bin/node

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import fetch from 'node-fetch'
import cheerio from 'cheerio'
import { uuid } from 'uuidv4'

const { OPENAI_API_KEY } = process.env
const UUIDS = [
  '6FA3F17E-F9DE-4D2D-A1F1-8A38AFBEE485',
  '4B04E1D8-F032-4E72-AE78-5372E4525BE0',
] // UUID of current image background(s)
const ZOOMPATH =
  '/Users/nuc/Library/Application Support/zoom.us/data/VirtualBkgnd_Custom/'
const IMAGE_DIR = 'images'

const dirname = path.resolve()

// Base prompt
const basePrompt = `Important: INDOORS PHOTO. Beautiful indoors photograph of a house on a cliff on an insland, indoor plants and pots, glass doors, fantastic architecture, modern, wood, concrete, `

// Grab "morning", "afternoon" or "evening" from the current time
const timeOfDay =
  new Date().getHours() < 12
    ? 'morning'
    : new Date().getHours() < 18
      ? 'afternoon'
      : 'evening'

const weatherConditions = {
  bewölkt: 'cloudy',
  'leichter Regen': 'light rain',
  'leichter Schneefall': 'light snowfall',
  'leichter Schneeregen': 'light sleet',
}

// Function to fetch and parse weather data
async function getWeather() {
  const url =
    'https://api.wo-cloud.com/content/widget/?timeFormat=HH:mm&windUnit=kmh&systemOfMeasurement=metric&temperatureUnit=celsius&geoID=10382&locationname=Berlin&language=de&region=DE'
  const response = await fetch(url)
  const data = await response.text()
  const $ = cheerio.load(data)
  console.log(data)
  // console.log(data);
  // Extract current weather conditions
  let currentTemp = $('.temp').text()
  // Remove new lines and white spaces
  currentTemp = currentTemp.replace(/\n/g, '').replace(/\s/g, '')
  const weather = $('.symbol')[0].attribs.title
  const condition = weatherConditions[weather]
  console.log({ currentTemp, weather, condition })

  return `${currentTemp} Celsius, ${weather}, ${condition}`
}

// Random art style
const artStyles = [
  'abstract',
  'cubism',
  'impressionism',
  'surrealism',
  'pointillism',
  'expressionism',
  'pop art',
  'minimalism',
  'realism',
  'romanticism',
  'renaissance',
  'baroque',
  'neoclassicism',
  'fauvism',
  'art nouveau',
  'rococo',
  'symbolism',
  'primitivism',
  'naive art',
  'dada',
  'conceptual art',
  'post-impressionism',
  'contemporary',
  'modern',
  'postmodern',
  'futurism',
  'neoplasticism',
  'suprematism',
  'constructivism',
  'de stijl',
  'biedermeier',
  'neogothic',
  'neorenaissance',
  'neobaroque',
  'neorococo',
  'neoclassicism',
  'neobyzantine',
  'neoromanesque',
  'metaphysical art',
  'futurism',
  'cubo-futurism',
  'rayonism',
  'constructivism',
  'russian avant-garde',
]

// Function to create an image with DALL-E
async function createImageWithDalle(prompt) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model: 'dall-e-3',
      n: 1,
      quality: 'hd',
      response_format: 'url',
      size: '1792x1024',
      style: 'vivid',
    }),
  })

  const data = await response.json()

  console.log(data)
  return data.data[0].url
}

// Function to download and save the image
async function downloadImage(url, filepath) {
  const response = await fetch(url)
  const buffer = await response.buffer()
  fs.writeFileSync(filepath, buffer)
}

// Function to replace the Zoom background
async function replaceZoomBackground() {
  const weather = await getWeather()
  // if prompt is not set, use default prompt
  const combinedTwoArtStyles = `${artStyles[Math.floor(Math.random() * artStyles.length)]}, ${artStyles[Math.floor(Math.random() * artStyles.length)]}`

  const prompt = process.argv[2]
    ? process.argv[2]
    : `${basePrompt} ${weather}, ${timeOfDay}, ${combinedTwoArtStyles}`
  console.log({ prompt })
  const imageUrl = await createImageWithDalle(prompt)
  const uuidForImageName = uuid()
  const localImagePath = path.join(
    dirname,
    IMAGE_DIR,
    `${uuidForImageName}.jpg`
  )

  await downloadImage(imageUrl, localImagePath)

  UUIDS.forEach((UUID) => {
    const destPath = path.join(ZOOMPATH, UUID)

    // exec('pgrep -x zoom.us', async (error) => {
    // if (error) {
    fs.copyFileSync(localImagePath, destPath)
    console.log('Zoom background replaced.')
    // }
    // })
  })
}

replaceZoomBackground()
