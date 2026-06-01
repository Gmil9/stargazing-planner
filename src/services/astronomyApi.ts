import { cacheService } from './cacheService'

const API_KEY = import.meta.env.VITE_IPGEOLOCATION_API_KEY as string
const TTL = 24 * 60 * 60 * 1000

export interface TwilightPeriod {
  civil_twilight_end?: string
  nautical_twilight_end?: string
  astronomical_twilight_end?: string
  civil_twilight_begin?: string
  nautical_twilight_begin?: string
  astronomical_twilight_begin?: string
}

export interface AstronomyData {
  sunrise: string
  sunset: string
  moon_illumination_percentage: number
  evening: TwilightPeriod
  morning: TwilightPeriod
}

export async function fetchAstronomy(lat: string, lng: string, date: string): Promise<AstronomyData> {
  const key = `cache_astronomy_${lat}_${lng}_${date}`
  const cached = cacheService.get<AstronomyData>(key)
  if (cached) return cached

  const params = new URLSearchParams({ apiKey: API_KEY, lat, long: lng, date })
  const res = await fetch(`https://api.ipgeolocation.io/v3/astronomy?${params}`)
  if (!res.ok) throw new Error(`Astronomy API error ${res.status}`)
  const data = await res.json()
  const astronomyData: AstronomyData = data.astronomy  
  cacheService.set(key, astronomyData, TTL)
  return astronomyData
}
