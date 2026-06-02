import { useEffect, useRef, useState } from 'react'
import { getTiff } from '../services/tiffStore'
import type { ICity } from '../types'
import './LightPollutionMap.css'

interface Props {
  location: ICity
}

const WINDOW_HALF = 100
// Fixed log scale max: ~20 nW/cm²/sr covers Bortle 1–8 range well
const LOG_MAX = Math.log1p(20)

function radianceToRGB(t: number): [number, number, number] {
  // Earth-at-night palette: black → indigo → dark orange → yellow → white
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

export default function LightPollutionMap({ location }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    async function render() {
      try {
        const tiff = await getTiff()
        const image = await tiff.getImage()
        const [west, south, east, north] = image.getBoundingBox()
        const width = image.getWidth()
        const height = image.getHeight()

        const latNum = parseFloat(location.lat)
        const lngNum = parseFloat(location.lng)

        if (lngNum < west || lngNum > east || latNum < south || latNum > north) {
          if (!cancelled) { setErrorMsg('Location outside coverage area'); setStatus('error') }
          return
        }

        const col = Math.floor(((lngNum - west) / (east - west)) * width)
        const row = Math.floor(((north - latNum) / (north - south)) * height)

        const x0 = Math.max(0, col - WINDOW_HALF)
        const y0 = Math.max(0, row - WINDOW_HALF)
        const x1 = Math.min(width, col + WINDOW_HALF + 1)
        const y1 = Math.min(height, row + WINDOW_HALF + 1)

        const rasters = await image.readRasters({ window: [x0, y0, x1, y1] })
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return

        const w = x1 - x0
        const h = y1 - y0
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')!
        const imgData = ctx.createImageData(w, h)
        const data = rasters[0] as Float32Array

        for (let i = 0; i < data.length; i++) {
          const v = data[i]
          const norm = isFinite(v) && v > 0
            ? Math.min(1, Math.log1p(v) / LOG_MAX)
            : 0
          const [r, g, b] = radianceToRGB(norm)
          imgData.data[i * 4] = r
          imgData.data[i * 4 + 1] = g
          imgData.data[i * 4 + 2] = b
          imgData.data[i * 4 + 3] = 255
        }

        ctx.putImageData(imgData, 0, 0)

        // Draw crosshair at selected pixel
        const cx = col - x0
        const cy = row - y0
        ctx.strokeStyle = 'rgba(255, 70, 70, 0.95)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cx - 12, cy)
        ctx.lineTo(cx + 12, cy)
        ctx.moveTo(cx, cy - 12)
        ctx.lineTo(cx, cy + 12)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx, cy, 9, 0, Math.PI * 2)
        ctx.stroke()

        if (!cancelled) setStatus('done')
      } catch (err) {
        if (!cancelled) { setErrorMsg(String(err)); setStatus('error') }
      }
    }

    render()
    return () => { cancelled = true }
  }, [location])

  return (
    <div className="lp-map">
      <div className="lp-map-header">
        <span className="lp-map-title">Light Pollution</span>
        <span className="lp-map-coords">
          {parseFloat(location.lat).toFixed(3)}°,&nbsp;{parseFloat(location.lng).toFixed(3)}°
        </span>
      </div>

      <div className="lp-map-canvas-wrap">
        {status === 'loading' && (
          <div className="lp-map-overlay">Loading map…</div>
        )}
        {status === 'error' && (
          <div className="lp-map-overlay lp-map-overlay--error">{errorMsg}</div>
        )}
        <canvas
          ref={canvasRef}
          className="lp-map-canvas"
          style={{ display: status === 'done' ? 'block' : 'none' }}
        />
      </div>

      <div className="lp-map-legend">
        <span className="lp-map-legend-label">Dark</span>
        <div className="lp-map-legend-bar" />
        <span className="lp-map-legend-label">Bright</span>
      </div>
    </div>
  )
}
