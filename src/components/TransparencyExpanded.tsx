import type { IWeatherData } from '../types'
import './ExpandedCard.css'

interface Props {
  weather: IWeatherData
  date: string
  time: string
}

type QLevel = 'excellent' | 'good' | 'moderate' | 'poor'

function qualLabel(level: QLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function cloudQual(v: number): QLevel {
  if (v < 20) return 'excellent'
  if (v < 50) return 'good'
  if (v < 80) return 'moderate'
  return 'poor'
}

function humidityQual(v: number): QLevel {
  if (v < 60) return 'excellent'
  if (v < 75) return 'good'
  if (v < 90) return 'moderate'
  return 'poor'
}

function dewSpreadQual(spread: number): QLevel {
  if (spread > 10) return 'excellent'
  if (spread > 5) return 'good'
  if (spread > 2) return 'moderate'
  return 'poor'
}

function visibilityQual(v: number): QLevel {
  const km = v / 1000
  if (km > 20) return 'excellent'
  if (km > 10) return 'good'
  if (km > 5) return 'moderate'
  return 'poor'
}

function getIdx(times: string[], date: string, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const rh = m >= 30 ? Math.min(h + 1, 23) : h
  return times.findIndex((t) => t === `${date}T${String(rh).padStart(2, '0')}:00`)
}

export default function TransparencyExpanded({ weather, date, time }: Props) {
  const idx = getIdx(weather.hourly.time, date, time)

  if (idx === -1) {
    return <div className="ec-no-data">Data not available for selected time</div>
  }

  const cloud = weather.hourly.cloud_cover[idx] ?? 0
  const humidity = weather.hourly.relative_humidity_2m[idx] ?? 0
  const temp = weather.hourly.temperature_2m[idx] ?? 0
  const dew = weather.hourly.dew_point_2m[idx] ?? 0
  const vis = weather.hourly.visibility[idx] ?? 0
  const spread = temp - dew

  const rows: Array<{ label: string; display: string; qual?: QLevel }> = [
    { label: 'Cloud Cover', display: `${Math.round(cloud)}%`, qual: cloudQual(cloud) },
    { label: 'Humidity', display: `${Math.round(humidity)}%`, qual: humidityQual(humidity) },
    { label: 'Temperature', display: `${temp.toFixed(1)}°C` },
    { label: 'Dew Point Spread', display: `${spread.toFixed(1)}°C`, qual: dewSpreadQual(spread) },
    { label: 'Visibility', display: `${(vis / 1000).toFixed(1)} km`, qual: visibilityQual(vis) },
  ]

  return (
    <div className="ec-readout-list">
      {rows.map((row) => (
        <div key={row.label} className="ec-readout-row">
          <span className="ec-readout-label">{row.label}</span>
          <div className="ec-readout-value-wrap">
            <span className="ec-readout-value">{row.display}</span>
          </div>
          {row.qual && (
            <span className={`ec-readout-qualifier ec-readout-qualifier--${row.qual}`}>
              {qualLabel(row.qual)}
            </span>
          )}
          {!row.qual && <span className="ec-readout-qualifier" />}
        </div>
      ))}
    </div>
  )
}
