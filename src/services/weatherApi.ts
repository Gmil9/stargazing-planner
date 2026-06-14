import { cacheService } from './cacheService'
import type { IWeatherData } from '../types'
import { gridPoint, GRID_RANGE } from '../utils/regionalGrid'

const TTL = 60 * 60 * 1000 // 1 hour

type RegionalEntry = { time: string[]; values: number[] }

export async function fetchRegionalWeather(
  centerLat: string,
  centerLng: string,
  field: 'cloud_cover' | 'precipitation_probability',
  timezone: string,
): Promise<RegionalEntry[]> {
  const key = `cache_regional_${centerLat}_${centerLng}_${field}_${GRID_RANGE}`
  const cached = cacheService.get<RegionalEntry[]>(key)
  if (cached) return cached

  const lat = parseFloat(centerLat)
  const lng = parseFloat(centerLng)
  const lats: string[] = []
  const lngs: string[] = []
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const [pLat, pLng] = gridPoint(lat, lng, row, col)
      lats.push(pLat.toFixed(5))
      lngs.push(pLng.toFixed(5))
    }
  }

  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lngs.join(','),
    hourly: field,
    timezone,
    forecast_days: '14',
  })

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Regional weather API error ${res.status}`)
  const data = (await res.json()) as Array<{ hourly: { time: string[] } & Record<string, number[]> }>

  const result: RegionalEntry[] = data.map((loc) => ({
    time: loc.hourly.time,
    values: loc.hourly[field],
  }))

  cacheService.set(key, result, TTL)
  return result
}

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
