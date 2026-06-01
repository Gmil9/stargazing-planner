import { fromArrayBuffer, GeoTIFF } from 'geotiff'
import tiffUrl from '../assets/VNL_npp_2025_us_vcmslcfg_v2_c202604011200.average_masked.tif?url'

// Singleton promise — download once, reuse across lightPollutionService and LightPollutionMap.
// cache: 'no-store' prevents Chrome from attempting a disk-cache write on the 72 MB response,
// which would otherwise fail with ERR_CACHE_OPERATION_NOT_SUPPORTED.
let tiffPromise: Promise<GeoTIFF> | null = null

export function getTiff(): Promise<GeoTIFF> {
  if (!tiffPromise) {
    tiffPromise = fetch(tiffUrl, { cache: 'no-store' })
      .then((r) => r.arrayBuffer())
      .then((buf) => fromArrayBuffer(buf))
  }
  return tiffPromise
}
