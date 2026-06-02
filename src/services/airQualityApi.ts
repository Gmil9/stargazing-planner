import { cacheService } from './cacheService'
import type { IAirQualityData } from '../types'

const TTL = 60 * 60 * 1000 // 1 hour  

export async function fetchAirQuality(lat: string, lng: string, timezone: string): Promise<IAirQualityData> {
  const key = `cache_airquality_${lat}_${lng}`
  const cached = cacheService.get<IAirQualityData>(key)
  if (cached) return cached

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    hourly: 'pm2_5',
    timezone,
    forecast_days: '7',
  })
  const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`)
  if (!res.ok) throw new Error(`Air quality API error ${res.status}`)
  const data = (await res.json()) as IAirQualityData
  cacheService.set(key, data, TTL)
  return data
}
