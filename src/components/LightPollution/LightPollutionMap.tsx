import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getTiff } from '../../services/tiffStore'
import type { ICity } from '../../types'
import './LightPollutionMap.css'

interface Props {
  location: ICity
  windowWidth?: number
  windowHeight?: number
  compact?: boolean
}

const WINDOW_HALF = 100
const LOG_MAX = Math.log1p(20)

function radianceToRGB(t: number): [number, number, number] {
  if (t < 0.25) {
    const s = t / 0.25
    return [Math.round(s * 40), 0, Math.round(s * 70)]
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25
    return [40 + Math.round(s * 180), Math.round(s * 60), 70 - Math.round(s * 70)]
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25
    return [220 + Math.round(s * 35), 60 + Math.round(s * 140), 0]
  }
  const s = (t - 0.75) / 0.25
  return [255, 200 + Math.round(s * 55), Math.round(s * 220)]
}

type MapBounds = [[number, number], [number, number]]

interface TiffEntry {
  raster: Float32Array
  w: number
  h: number
  bounds: MapBounds  // geographic extent of the loaded TIFF window
  cx: number         // pixel offset of location center (for compact crosshair)
  cy: number
}

const tiffCache = new Map<string, TiffEntry>()
const pendingCache = new Map<string, Promise<TiffEntry>>()

async function loadTiffEntry(location: ICity, wx: number, wy: number): Promise<TiffEntry> {
  const key = `${location.lat},${location.lng},${wx},${wy}`

  const existing = tiffCache.get(key)
  if (existing) return existing

  const pending = pendingCache.get(key)
  if (pending) return pending

  const promise = (async () => {
    const tiff = await getTiff()
    const image = await tiff.getImage()
    const [west, south, east, north] = image.getBoundingBox()
    const width = image.getWidth()
    const height = image.getHeight()

    const latNum = parseFloat(location.lat)
    const lngNum = parseFloat(location.lng)

    if (lngNum < west || lngNum > east || latNum < south || latNum > north) {
      throw new Error('Location outside coverage area')
    }

    const col = Math.floor(((lngNum - west) / (east - west)) * width)
    const row = Math.floor(((north - latNum) / (north - south)) * height)

    const x0 = Math.max(0, col - wx)
    const y0 = Math.max(0, row - wy)
    const x1 = Math.min(width, col + wx + 1)
    const y1 = Math.min(height, row + wy + 1)

    const rasters = await image.readRasters({ window: [x0, y0, x1, y1] })
    const raster = rasters[0] as Float32Array

    const w = x1 - x0
    const h = y1 - y0
    const cx = col - x0
    const cy = row - y0

    const lngWest = west + (x0 / width) * (east - west)
    const lngEast = west + (x1 / width) * (east - west)
    const latNorth = north - (y0 / height) * (north - south)
    const latSouth = north - (y1 / height) * (north - south)

    const entry: TiffEntry = {
      raster,
      w,
      h,
      bounds: [[latSouth, lngWest], [latNorth, lngEast]],
      cx,
      cy,
    }
    tiffCache.set(key, entry)
    pendingCache.delete(key)
    return entry
  })()

  pendingCache.set(key, promise)
  promise.catch(() => pendingCache.delete(key))
  return promise
}

export function warmCache(location: ICity, wx: number, wy: number): void {
  const key = `${location.lat},${location.lng},${wx},${wy}`
  if (!tiffCache.has(key) && !pendingCache.has(key)) {
    loadTiffEntry(location, wx, wy).catch(() => {})
  }
}

// Renders light pollution data onto a 256×256 canvas sized to mapBounds, not the TIFF window bounds.
// Each pixel is converted to a lat/lng from the map's viewport, then sampled from the raster.
function renderLightOverlay(entry: TiffEntry, mapBounds: MapBounds): string {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(size, size)

  const [[mapSouth, mapWest], [mapNorth, mapEast]] = mapBounds
  const [[tSouth, tWest], [tNorth, tEast]] = entry.bounds
  const { raster, w, h } = entry

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const lat = mapNorth - (py / (size - 1)) * (mapNorth - mapSouth)
      const lng = mapWest + (px / (size - 1)) * (mapEast - mapWest)

      const normX = (lng - tWest) / (tEast - tWest)
      const normY = (tNorth - lat) / (tNorth - tSouth)

      let norm = 0
      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        const rx = normX * (w - 1)
        const ry = normY * (h - 1)
        const x0 = Math.floor(rx), y0 = Math.floor(ry)
        const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1)
        const fx = rx - x0, fy = ry - y0
        const v =
          (1 - fx) * (1 - fy) * raster[y0 * w + x0] +
          fx * (1 - fy) * raster[y0 * w + x1] +
          (1 - fx) * fy * raster[y1 * w + x0] +
          fx * fy * raster[y1 * w + x1]
        if (isFinite(v) && v > 0) norm = Math.min(1, Math.log1p(v) / LOG_MAX)
      }

      const [r, g, b] = radianceToRGB(norm)
      const i = (py * size + px) * 4
      imgData.data[i] = r
      imgData.data[i + 1] = g
      imgData.data[i + 2] = b
      imgData.data[i + 3] = Math.round(norm * 255)
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL()
}

// Reads map.getBounds() and passes them up. Uses ResizeObserver on first mount to wait
// for the flex container to have real pixel dimensions before reading bounds.
function MapController({ lat, lng, onBounds }: {
  lat: number
  lng: number
  onBounds: (b: MapBounds) => void
}) {
  const map = useMap()
  const onBoundsRef = useRef(onBounds)
  onBoundsRef.current = onBounds

  useEffect(() => {
    const read = () => {
      map.invalidateSize()
      const b = map.getBounds()
      onBoundsRef.current([[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]])
    }

    const container = map.getContainer()
    if (container.clientWidth > 0) {
      read()
      return
    }

    const ro = new ResizeObserver(() => {
      if (container.clientWidth > 0) {
        ro.disconnect()
        read()
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])

  useEffect(() => {
    if (map.getSize().x === 0) return
    map.setView([lat, lng], 9, { animate: false })
    const b = map.getBounds()
    onBoundsRef.current([[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]])
  }, [lat, lng, map])

  return null
}

export default function LightPollutionMap({ location, windowWidth, windowHeight, compact }: Props) {
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [tiffEntry, setTiffEntry] = useState<TiffEntry | null>(null)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)
  const wx = windowWidth ?? WINDOW_HALF
  const wy = windowHeight ?? WINDOW_HALF

  const lat = parseFloat(location.lat)
  const lng = parseFloat(location.lng)

  // Effect 1: load TIFF raster window
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setTiffEntry(null)
    setOverlayUrl(null)

    loadTiffEntry(location, wx, wy)
      .then((entry) => { if (!cancelled) setTiffEntry(entry) })
      .catch((err) => { if (!cancelled) { setErrorMsg(String(err)); setStatus('error') } })

    return () => { cancelled = true }
  }, [location, wx, wy])

  // Effect 2: render overlay whenever raster or map bounds change
  useEffect(() => {
    if (!tiffEntry || !mapBounds) return
    const url = renderLightOverlay(tiffEntry, mapBounds)
    setOverlayUrl(url)
    setStatus('done')
  }, [tiffEntry, mapBounds])

  return (
    <div className={`lp-map${!compact ? ' lp-map--expanded' : ''}`}>
      {compact && (
        <div className="lp-map-header">
          <span className="lp-map-title">Light Pollution</span>
          <span className="lp-map-coords">
            {lat.toFixed(3)}°,&nbsp;{lng.toFixed(3)}°
          </span>
        </div>
      )}
      <div className="lp-map-canvas-wrap">
        {status === 'loading' && <div className="lp-map-overlay">Loading map…</div>}
        {status === 'error' && <div className="lp-map-overlay lp-map-overlay--error">{errorMsg}</div>}
        <MapContainer
          center={[lat, lng]}
          zoom={9}
          className="lp-map-leaflet"
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {overlayUrl && mapBounds && (
            <ImageOverlay url={overlayUrl} bounds={mapBounds} opacity={0.7} />
          )}
          <CircleMarker
            center={[lat, lng]}
            radius={5}
            pathOptions={{ color: '#ff4646', fillColor: '#ff4646', fillOpacity: 0.9, weight: 1.5 }}
          />
          <MapController lat={lat} lng={lng} onBounds={setMapBounds} />
        </MapContainer>
      </div>
      <div className="lp-map-legend">
        <span className="lp-map-legend-label">Dark</span>
        <div className="lp-map-legend-bar" />
        <span className="lp-map-legend-label">Bright</span>
      </div>
    </div>
  )
}
