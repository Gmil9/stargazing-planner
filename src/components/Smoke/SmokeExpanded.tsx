import type { IAirQualityData } from '../../types'
import '../ExpandedCard.css'

interface Props {
  airQuality: IAirQualityData
  date: string
  time: string
}

function getIdx(times: string[], date: string, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const rh = m >= 30 ? Math.min(h + 1, 23) : h
  return times.findIndex((t) => t === `${date}T${String(rh).padStart(2, '0')}:00`)
}

export default function SmokeExpanded({ airQuality, date, time }: Props) {
  const idx = getIdx(airQuality.hourly.time, date, time)

  if (idx === -1) {
    return <div className="ec-no-data">Data not available for selected time</div>
  }

  const dust = airQuality.hourly.dust[idx] ?? 0
  const aod = airQuality.hourly.aerosol_optical_depth[idx] ?? 0
  const pm10 = airQuality.hourly.pm10[idx] ?? 0
  const pm25 = airQuality.hourly.pm2_5[idx] ?? 0

  return (
    <div className="ec-readout-list">
      <div className="ec-readout-row ec-readout-row--primary">
        <span className="ec-readout-label">Aerosol Optical Depth</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{aod.toFixed(3)}</span>
        </div>
        <span className="ec-readout-qualifier" style={{ color: 'var(--color-grey-text)', fontSize: 11 }}>
          primary metric
        </span>
      </div>
      <div className="ec-readout-row">
        <span className="ec-readout-label">Dust</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{Math.round(dust)}</span>
          <span className="ec-readout-unit">µg/m³</span>
        </div>
        <span className="ec-readout-qualifier" />
      </div>
      <div className="ec-readout-row">
        <span className="ec-readout-label">PM10</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{Math.round(pm10)}</span>
          <span className="ec-readout-unit">µg/m³</span>
        </div>
        <span className="ec-readout-qualifier" />
      </div>
      <div className="ec-readout-row">
        <span className="ec-readout-label">PM2.5</span>
        <div className="ec-readout-value-wrap">
          <span className="ec-readout-value">{Math.round(pm25)}</span>
          <span className="ec-readout-unit">µg/m³</span>
        </div>
        <span className="ec-readout-qualifier" />
      </div>
    </div>
  )
}
