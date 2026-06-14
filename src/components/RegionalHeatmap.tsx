import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, ImageOverlay, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRegionalWeather } from '../services/weatherApi'
import { latToRow, lngToCol } from '../utils/regionalGrid'
import type { ICity } from '../types'
import './RegionalHeatmap.css'

interface Props {
  location: ICity
  date: string
  time: string
  field: 'cloud_cover' | 'precipitation_probability'
}

type MapBounds = [[number, number], [number, number]]

function cloudColor(t: number): [number, number, number] {
  if (t < 0.5) {
    const s = t / 0.5
    return [Math.round(10 + s * 80), Math.round(15 + s * 90), Math.round(40 + s * 110)]
  }
  const s = (t - 0.5) / 0.5
  return [Math.round(90 + s * 115), Math.round(105 + s * 105), Math.round(150 + s * 60)]
}

function precipColor(t: number): [number, number, number] {
  if (t < 0.25) {
    const s = t / 0.25
    return [Math.round(s * 60), Math.round(s * 180), Math.round(s * 80)]
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25
    return [60 + Math.round(s * 195), 180 + Math.round(s * 40), Math.round(80 * (1 - s))]
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25
    return [255, Math.round(220 * (1 - s * 0.7)), 0]
  }
  const s = (t - 0.75) / 0.25
  return [255 - Math.round(s * 100), Math.round(66 * (1 - s)), 0]
}

function bilinear(grid: number[][], gx: number, gy: number): number {
  const x0 = Math.floor(gx), y0 = Math.floor(gy)
  const x1 = Math.min(x0 + 1, 6), y1 = Math.min(y0 + 1, 6)
  const fx = gx - x0, fy = gy - y0
  return (
    (1 - fx) * (1 - fy) * grid[y0][x0] +
    fx * (1 - fy) * grid[y0][x1] +
    (1 - fx) * fy * grid[y1][x0] +
    fx * fy * grid[y1][x1]
  )
}

// Renders weather data onto a 256×256 canvas sized to mapBounds, not the data grid bounds.
// Each pixel is converted to a lat/lng from the map's viewport, then to a grid coordinate.
function renderOverlay(
  grid: number[][],
  centerLat: number,
  centerLng: number,
  mapBounds: MapBounds,
  field: 'cloud_cover' | 'precipitation_probability',
): string {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(size, size)

  const [[south, west], [north, east]] = mapBounds

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const lat = north - (py / (size - 1)) * (north - south)
      const lng = west + (px / (size - 1)) * (east - west)
      const gx = Math.max(0, Math.min(6, lngToCol(centerLng, lng)))
      const gy = Math.max(0, Math.min(6, latToRow(centerLat, lat)))
      const raw = bilinear(grid, gx, gy)
      const t = Math.max(0, Math.min(1, raw / 100))
      const [r, g, b] = field === 'cloud_cover' ? cloudColor(t) : precipColor(t)
      const i = (py * size + px) * 4
      imgData.data[i] = r
      imgData.data[i + 1] = g
      imgData.data[i + 2] = b
      imgData.data[i + 3] = 255
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

  // Initial mount: ResizeObserver waits for flex layout to resolve
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

  // Location changes: update map center then re-read bounds
  useEffect(() => {
    if (map.getSize().x === 0) return
    map.setView([lat, lng], 11, { animate: false })
    const b = map.getBounds()
    onBoundsRef.current([[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]])
  }, [lat, lng, map])

  return null
}

export default function RegionalHeatmap({ location, date, time, field }: Props) {
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [weatherGrid, setWeatherGrid] = useState<number[][] | null>(null)
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null)
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null)

  const lat = parseFloat(location.lat)
  const lng = parseFloat(location.lng)

  // Effect 1: fetch weather data
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setWeatherGrid(null)
    setOverlayUrl(null)

    async function load() {
      try {
        const data = await fetchRegionalWeather(location.lat, location.lng, field, location.timezone)
        if (cancelled) return

        const [h, m] = time.split(':').map(Number)
        const rh = m >= 30 ? Math.min(h + 1, 23) : h
        const target = `${date}T${String(rh).padStart(2, '0')}:00`
        const idx = data[0].time.findIndex((t) => t === target)

        if (idx === -1) {
          if (!cancelled) { setErrorMsg('Time not found in forecast'); setStatus('error') }
          return
        }

        const grid: number[][] = Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 7 }, (_, col) => data[row * 7 + col]?.values[idx] ?? 0)
        )

        if (!cancelled) setWeatherGrid(grid)
      } catch (err) {
        if (!cancelled) { setErrorMsg(String(err)); setStatus('error') }
      }
    }

    load()
    return () => { cancelled = true }
  }, [location.lat, location.lng, location.timezone, date, time, field])

  // Effect 2: render overlay whenever data or map bounds change
  useEffect(() => {
    if (!weatherGrid || !mapBounds) return
    const url = renderOverlay(weatherGrid, lat, lng, mapBounds, field)
    setOverlayUrl(url)
    setStatus('done')
  }, [weatherGrid, mapBounds, lat, lng, field])

  const labelLow = field === 'cloud_cover' ? 'Clear' : 'No Rain'
  const labelHigh = field === 'cloud_cover' ? 'Overcast' : 'Heavy Rain'
  const barClass = field === 'cloud_cover' ? 'rh-bar--cloud' : 'rh-bar--precip'

  return (
    <div className="rh-wrap">
      <div className="rh-canvas-wrap">
        {status === 'loading' && <div className="rh-overlay">Loading map…</div>}
        {status === 'error' && <div className="rh-overlay rh-overlay--error">{errorMsg || 'Failed to load map'}</div>}
        <MapContainer
          center={[lat, lng]}
          zoom={11}
          className="rh-map"
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {overlayUrl && mapBounds && (
            <ImageOverlay url={overlayUrl} bounds={mapBounds} opacity={0.4} />
          )}
          <CircleMarker
            center={[lat, lng]}
            radius={5}
            pathOptions={{ color: '#ffffff', fillColor: '#ffffff', fillOpacity: 0.9, weight: 1.5 }}
          />
          <MapController lat={lat} lng={lng} onBounds={setMapBounds} />
        </MapContainer>
      </div>
      <div className="rh-legend">
        <span className="rh-legend-label">{labelLow}</span>
        <div className={`rh-bar ${barClass}`} />
        <span className="rh-legend-label">{labelHigh}</span>
      </div>
    </div>
  )
}
