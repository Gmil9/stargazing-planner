import { useEffect, useRef, useState } from 'react'
import { fetchRegionalWeather } from '../services/weatherApi'
import type { ICity } from '../types'
import './RegionalHeatmap.css'

interface Props {
  location: ICity
  date: string
  time: string
  field: 'cloud_cover' | 'precipitation_probability'
}

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

export default function RegionalHeatmap({ location, date, time, field }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

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

        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        canvas.width = 7
        canvas.height = 7
        const ctx = canvas.getContext('2d')!
        const imgData = ctx.createImageData(7, 7)

        for (let i = 0; i < 49; i++) {
          const raw = data[i]?.values[idx] ?? 0
          const t = Math.max(0, Math.min(1, raw / 100))
          const [r, g, b] = field === 'cloud_cover' ? cloudColor(t) : precipColor(t)
          imgData.data[i * 4] = r
          imgData.data[i * 4 + 1] = g
          imgData.data[i * 4 + 2] = b
          imgData.data[i * 4 + 3] = 255
        }

        ctx.putImageData(imgData, 0, 0)
        if (!cancelled) setStatus('done')
      } catch (err) {
        if (!cancelled) { setErrorMsg(String(err)); setStatus('error') }
      }
    }

    load()
    return () => { cancelled = true }
  }, [location.lat, location.lng, location.timezone, date, time, field])

  const labelLow = field === 'cloud_cover' ? 'Clear' : 'No Rain'
  const labelHigh = field === 'cloud_cover' ? 'Overcast' : 'Heavy Rain'
  const barClass = field === 'cloud_cover' ? 'rh-bar--cloud' : 'rh-bar--precip'

  return (
    <div className="rh-wrap">
      <div className="rh-canvas-wrap">
        {status === 'loading' && <div className="rh-overlay">Loading map…</div>}
        {status === 'error' && <div className="rh-overlay rh-overlay--error">{errorMsg || 'Failed to load map'}</div>}
        <canvas
          ref={canvasRef}
          className="rh-canvas"
          style={{ display: status === 'done' ? 'block' : 'none' }}
        />
        {status === 'done' && (
          <svg viewBox="0 0 7 7" className="rh-marker">
            <circle cx="3.5" cy="3.5" r="0.45" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.1" />
            <line x1="3.0" y1="3.5" x2="4.0" y2="3.5" stroke="rgba(255,255,255,0.9)" strokeWidth="0.06" />
            <line x1="3.5" y1="3.0" x2="3.5" y2="4.0" stroke="rgba(255,255,255,0.9)" strokeWidth="0.06" />
          </svg>
        )}
      </div>
      <div className="rh-legend">
        <span className="rh-legend-label">{labelLow}</span>
        <div className={`rh-bar ${barClass}`} />
        <span className="rh-legend-label">{labelHigh}</span>
      </div>
    </div>
  )
}
