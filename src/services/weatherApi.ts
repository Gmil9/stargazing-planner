import { cacheService } from './cacheService'
import type { IWeatherData } from '../types'

const TTL = 60 * 60 * 1000 // 1 hour

export async function fetchWeather(lat: string, lng: string, timezone: string): Promise<IWeatherData> {
  const key = `cache_forecast_${lat}_${lng}`
  const cached = cacheService.get<IWeatherData>(key)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    hourly: 'cloud_cover,precipitation_probability,relative_humidity_2m,temperature_2m,dew_point_2m,visibility,vapour_pressure_deficit',
    timezone,
    forecast_days: '14',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Weather API error ${res.status}`)
  const data = (await res.json()) as IWeatherData
  cacheService.set(key, data, TTL)
  return data
}
