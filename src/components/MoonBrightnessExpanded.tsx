import type { IAstronomyData } from '../types'
import phaseNew from '../assets/MoonPhases/phase_new.png'
import phaseWaxingCrescent from '../assets/MoonPhases/phase_waxing_crescent.png'
import phaseFirstQuarter from '../assets/MoonPhases/phase_first_quarter.png'
import phaseWaxingGibbous from '../assets/MoonPhases/phase_waxing_gibbous.png'
import phaseFull from '../assets/MoonPhases/phase_full.png'
import phaseWaningGibbous from '../assets/MoonPhases/phase_waning_gibbous.png'
import phaseThirdQuarter from '../assets/MoonPhases/phase_third_quarter.png'
import phaseWaningCrescent from '../assets/MoonPhases/phase_waning_crescent.png'
import './MoonBrightnessExpanded.css'

interface Props {
  astronomy: IAstronomyData
}

const PHASE_MAP: Record<string, string> = {
  'new moon': phaseNew,
  'waxing crescent': phaseWaxingCrescent,
  'first quarter': phaseFirstQuarter,
  'waxing gibbous': phaseWaxingGibbous,
  'full moon': phaseFull,
  'waning gibbous': phaseWaningGibbous,
  'third quarter': phaseThirdQuarter,
  'waning crescent': phaseWaningCrescent,
}

function getPhaseImage(phase: string | undefined): string {
  if (!phase) return phaseNew
  const key = phase.toLowerCase().replace(/[_-]+/g, ' ').trim()
  return PHASE_MAP[key] ?? phaseNew
}

function formatTime(t: string | undefined): string {
  if (!t) return '--'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${ampm}`
}

function formatDate(d: string | undefined): string {
  if (!d) return '--'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

export default function MoonBrightnessExpanded({ astronomy }: Props) {
  const img = getPhaseImage(astronomy.moon_phase)
  const illumination = Math.round(Math.abs(astronomy.moon_illumination_percentage))

  return (
    <div className="mb-expanded">
      <div className="mb-image-col">
        <img src={img} alt={astronomy.moon_phase ?? 'Moon phase'} className="mb-phase-img" />
        <span className="mb-nasa-credit">Image: NASA Scientific Visualization Studio</span>
      </div>
      <div className="mb-meta-col">
        {astronomy.moon_phase && (
          <div className="mb-row mb-row--phase">
            <span className="mb-row-label">Phase</span>
            <span className="mb-row-value mb-row-value--phase">{astronomy.moon_phase}</span>
          </div>
        )}
        <div className="mb-row">
          <span className="mb-row-label">Illumination</span>
          <span className="mb-row-value">{illumination}<span className="mb-row-unit">%</span></span>
        </div>
        {astronomy.moon_altitude !== undefined && (
          <div className="mb-row">
            <span className="mb-row-label">Altitude</span>
            <span className="mb-row-value">{astronomy.moon_altitude.toFixed(1)}<span className="mb-row-unit">°</span></span>
          </div>
        )}
        {astronomy.moon_azimuth !== undefined && (
          <div className="mb-row">
            <span className="mb-row-label">Azimuth</span>
            <span className="mb-row-value">{astronomy.moon_azimuth.toFixed(1)}<span className="mb-row-unit">°</span></span>
          </div>
        )}
        {astronomy.moonrise && (
          <div className="mb-row">
            <span className="mb-row-label">Moonrise</span>
            <span className="mb-row-value">{formatTime(astronomy.moonrise)}</span>
          </div>
        )}
        {astronomy.moonset && (
          <div className="mb-row">
            <span className="mb-row-label">Moonset</span>
            <span className="mb-row-value">{formatTime(astronomy.moonset)}</span>
          </div>
        )}
        {astronomy.next_moon_phase_name && astronomy.next_moon_phase_date && (
          <div className="mb-row">
            <span className="mb-row-label">Next Phase</span>
            <span className="mb-row-value mb-row-value--next">
              {astronomy.next_moon_phase_name}
              <span className="mb-row-date"> — {formatDate(astronomy.next_moon_phase_date)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
