import { cacheService } from './cacheService'

const TTL = 60 * 60 * 1000

export interface WeatherData {
  hourly: {
    time: string[]
    cloud_cover: number[]
    precipitation_probability: number[]
    relative_humidity_2m: number[]
    temperature_2m: number[]
    dew_point_2m: number[]
    visibility: number[]
  }
}

export async function fetchWeather(lat: string, lng: string, timezone: string): Promise<WeatherData> {
  const key = `cache_forecast_${lat}_${lng}`
  const cached = cacheService.get<WeatherData>(key)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    hourly: 'cloud_cover,precipitation_probability,relative_humidity_2m,temperature_2m,dew_point_2m,visibility',
    timezone,
    forecast_days: '14',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Weather API error ${res.status}`)
  const data = (await res.json()) as WeatherData
  cacheService.set(key, data, TTL)
  return data
}
