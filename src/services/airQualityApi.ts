import { cacheService } from './cacheService'

const TTL = 60 * 60 * 1000

export interface AirQualityData {
  hourly: {
    time: string[]
    pm2_5: number[]
  }
}

export async function fetchAirQuality(lat: string, lng: string, timezone: string): Promise<AirQualityData> {
  const key = `cache_airquality_${lat}_${lng}`
  const cached = cacheService.get<AirQualityData>(key)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    hourly: 'pm2_5',
    timezone,
    forecast_days: '14',
  })
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`)
  if (!res.ok) throw new Error(`Air quality API error ${res.status}`)
  const data = (await res.json()) as AirQualityData
  cacheService.set(key, data, TTL)
  return data
}
