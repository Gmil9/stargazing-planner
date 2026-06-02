import { cacheService } from './cacheService'
import type { IAstronomyData } from '../types'

const API_KEY = import.meta.env.VITE_IPGEOLOCATION_API_KEY as string
const TTL = 24 * 60 * 60 * 1000 // 24 hours


export async function fetchAstronomy(lat: string, lng: string, date: string): Promise<IAstronomyData> {
  const key = `cache_astronomy_${lat}_${lng}_${date}`
  const cached = cacheService.get<IAstronomyData>(key)
  if (cached) return cached

  const params = new URLSearchParams({ apiKey: API_KEY, lat, long: lng, date })
  const res = await fetch(`https://api.ipgeolocation.io/v3/astronomy?${params}`)
  if (!res.ok) throw new Error(`Astronomy API error ${res.status}`)
  const data = await res.json()
  const astronomyData: IAstronomyData = data.astronomy  
  cacheService.set(key, astronomyData, TTL)
  return astronomyData
}
