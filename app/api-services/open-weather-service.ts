import { redis } from '../data-access/redis-connection'

const API_KEY = process.env.WEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const TEN_MINUTES = 1000 * 60 * 10 // in milliseconds

interface FetchWeatherDataParams {
  lat: number
  lon: number
  units: string
}

// Fetch weather data function using Redis cache
export async function fetchWeatherData({
  lat,
  lon,
  units,
}: FetchWeatherDataParams) {
  const queryString = `lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`

  // Check Redis cache for the query string
  const cacheEntry = await redis.get(queryString)
  if (cacheEntry) {
    // If cache entry exists, return the cached data
    return JSON.parse(cacheEntry)
  }

  // If no cache entry, make the API call
  const response = await fetch(`${BASE_URL}?${queryString}`)
  const data = await response.json()

  // Store the result in Redis with an expiry time of 10 minutes (PX = 10 minutes)
  await redis.set(queryString, JSON.stringify(data), { PX: TEN_MINUTES })
  return data
}

// Fetch geo coordinates for a postal code using OpenWeather API
export async function getGeoCoordsForPostalCode(
  postalCode: string,
  countryCode: string,
) {
  const url = `http://api.openweathermap.org/geo/1.0/zip?zip=${postalCode},${countryCode}&appid=${API_KEY}`
  const response = await fetch(url)
  const data = await response.json()
  return data
}
