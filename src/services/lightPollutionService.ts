import { getTiff } from './tiffStore'
import { cacheService } from './cacheService'

const TTL = 30 * 24 * 60 * 60 * 1000

export interface LightPollutionData {
  radiance: number
  sqm: number
  bortle: number
}

export async function fetchLightPollution(lat: string, lng: string): Promise<LightPollutionData> {
  const key = `cache_lightpollution_${lat}_${lng}`
  const cached = cacheService.get<LightPollutionData>(key)
  if (cached) return cached

  const tiff = await getTiff()
  const image = await tiff.getImage()

  const [west, south, east, north] = image.getBoundingBox()
  const width = image.getWidth()
  const height = image.getHeight()
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  if (lngNum < west || lngNum > east || latNum < south || latNum > north) {
    throw new Error('Location outside coverage area')
  }

  const col = Math.floor(((lngNum - west) / (east - west)) * width)
  const row = Math.floor(((north - latNum) / (north - south)) * height)

  const rasters = await image.readRasters({ window: [col, row, col + 1, row + 1] })
  const radiance = Number((rasters[0] as Float32Array)[0])

  if (!isFinite(radiance) || radiance < 0) throw new Error('No data at location')

  const naturalSkyBrightness = 0.171168465
  const total = radiance + naturalSkyBrightness
  const sqm = 21.58 - (2.5 * Math.log10(total))

  let bortle: number
  if (sqm >= 21.76) bortle = 1
  else if (sqm >= 21.6) bortle = 2
  else if (sqm >= 21.3) bortle = 3
  else if (sqm >= 20.8) bortle = 4
  else if (sqm >= 20.3) bortle = 5
  else if (sqm >= 19.1) bortle = 6
  else if (sqm >= 18.0) bortle = 7
  else if (sqm >= 17.0) bortle = 8
  else bortle = 9

  const data: LightPollutionData = { radiance, sqm, bortle }
  cacheService.set(key, data, TTL)
  return data
}
