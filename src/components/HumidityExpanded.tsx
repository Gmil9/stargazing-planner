import type { IWeatherData } from '../types'
import './ExpandedCard.css'

interface Props {
  weather: IWeatherData
  date: string
  time: string
}

function getIdx(times: string[], date: string, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const rh = m >= 30 ? Math.min(h + 1, 23) : h
  return times.findIndex((t) => t === `${date}T${String(rh).padStart(2, '0')}:00`)
}

export default function HumidityExpanded({ weather, date, time }: Props) {
  const idx = getIdx(weather.hourly.time, date, time)

  if (idx === -1) {
    return <div className="ec-no-data">Data not available for selected time</div>
  }

  const humidity = weather.hourly.relative_humidity_2m[idx] ?? 0
  const dew = weather.hourly.dew_point_2m[idx] ?? 0
  const vpd = weather.hourly.vapour_pressure_deficit[idx] ?? 0
  const temp = weather.hourly.temperature_2m[idx] ?? 0
  const spreadC = temp - dew
  // 5°F = 5 × 5/9 ≈ 2.78°C
  const dewRisk = spreadC < 2.78

  return (
    <div className="ec-readout-list">
      <div className="ec-readout-row">
        <span className="ec-readout-label">Relative Humidity</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{Math.round(humidity)}</span>
          <span className="ec-readout-unit">%</span>
        </div>
        <span className="ec-readout-qualifier" />
      </div>
      <div className="ec-readout-row">
        <span className="ec-readout-label">Dew Point</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{dew.toFixed(1)}</span>
          <span className="ec-readout-unit">°C</span>
        </div>
        <span className="ec-readout-qualifier" />
      </div>
      <div className="ec-readout-row">
        <span className="ec-readout-label">Vapour Pressure Deficit</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{vpd.toFixed(2)}</span>
          <span className="ec-readout-unit">kPa</span>
        </div>
        <span className="ec-readout-qualifier" />
      </div>
      <div className="ec-readout-row">
        <span className="ec-readout-label">Dew Point Spread</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{spreadC.toFixed(1)}</span>
          <span className="ec-readout-unit">°C</span>
        </div>
        {dewRisk ? (
          <span className="ec-dew-risk">Dew risk</span>
        ) : (
          <span className="ec-readout-qualifier" />
        )}
      </div>
    </div>
  )
}
