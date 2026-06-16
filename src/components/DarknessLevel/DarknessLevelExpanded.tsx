import { useState } from 'react'
import type { IAstronomyData } from '../../types'
import darknessLevelsPng from '../../assets/darkness_levels.png'
import './DarknessLevelExpanded.css'

interface Props {
  astronomy: IAstronomyData
  time: string
}

// PNG native size and fan geometry constants (tune if sun lands in wrong band)
const PNG_W   = 381   // PNG width in px
const PNG_H   = 337   // PNG height in px
const FAN_CX  = -80   // pivot x (off left edge of image)
const FAN_CY  = 95    // pivot y = horizon height in image (Day/Civil boundary)
const FAN_R   = 320   // distance from pivot to sun path
const MAX_ALT = 12    // clamp altitude so sun stays within the Day band

function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

function frac(start: number, end: number, curr: number): number {
  return end === start ? 0 : (curr - start) / (end - start)
}

const DARK_SETTLE_MINS = 60 // how long after astro twilight ends before sun reaches bottom

function estimateAltitude(time: string, data: IAstronomyData): number {
  const t = toMins(time)
  const sunrise = toMins(data.sunrise)
  const sunset  = toMins(data.sunset)

  const astroBegin = data.morning.astronomical_twilight_begin ? toMins(data.morning.astronomical_twilight_begin) : sunrise - 90
  const nautBegin  = data.morning.nautical_twilight_begin     ? toMins(data.morning.nautical_twilight_begin)     : sunrise - 60
  const civilBegin = data.morning.civil_twilight_begin        ? toMins(data.morning.civil_twilight_begin)        : sunrise - 30

  const civilEnd = data.evening.civil_twilight_end        ? toMins(data.evening.civil_twilight_end)        : sunset + 30
  const nautEnd  = data.evening.nautical_twilight_end     ? toMins(data.evening.nautical_twilight_end)     : sunset + 60
  const astroEnd = data.evening.astronomical_twilight_end ? toMins(data.evening.astronomical_twilight_end) : sunset + 90

  // Evening: gradually sink from -18 to -45 over DARK_SETTLE_MINS after astro twilight ends
  if (t >= astroEnd) return lerp(-18, -45, frac(astroEnd, astroEnd + DARK_SETTLE_MINS, t))

  if (t < astroBegin - DARK_SETTLE_MINS) return -45
  if (t < astroBegin) return lerp(-45, -18, frac(astroBegin - DARK_SETTLE_MINS, astroBegin, t))
  if (t < nautBegin)  return lerp(-18, -12, frac(astroBegin, nautBegin, t))
  if (t < civilBegin) return lerp(-12, -6,  frac(nautBegin,  civilBegin, t))
  if (t < sunrise)    return lerp(-6,  0,   frac(civilBegin, sunrise, t))
  if (t <= sunset)    return 20 + lerp(0, 35, Math.sin(frac(sunrise, sunset, t) * Math.PI))
  if (t < civilEnd)   return lerp(0,  -6,   frac(sunset,   civilEnd, t))
  if (t < nautEnd)    return lerp(-6, -12,  frac(civilEnd,  nautEnd,  t))
  return lerp(-12, -18, frac(nautEnd, astroEnd, t))
}

function formatCountdown(fromMins: number, toMins: number): string {
  let diff = toMins - fromMins
  if (diff < 0) diff += 24 * 60
  if (diff <= 0) return 'Now'
  const h = Math.floor(diff / 60)
  const m = Math.floor(diff % 60)
  const mStr = `${m} ${m === 1 ? 'Minute' : 'Minutes'}`
  return h > 0 ? `${h}h ${mStr}` : mStr
}

type PhaseKey = 'civil' | 'nautical' | 'astronomical' | 'truedark'

function stageToPhaseKey(stage: string): PhaseKey {
  if (stage === 'Civil Twilight') return 'civil'
  if (stage === 'Nautical Twilight') return 'nautical'
  if (stage === 'Astronomical Twilight') return 'astronomical'
  if (stage === 'True Dark') return 'truedark'
  return 'civil'
}

const PHASE_LABELS: Record<PhaseKey, string> = {
  civil: 'Civil',
  nautical: 'Nautical',
  astronomical: 'Astronomical',
  truedark: 'True Dark',
}

const HIGHLIGHT_PHRASES = ['Civil Twilight', 'Nautical Twilight', 'Astronomical Twilight', 'True Darkness']
const HIGHLIGHT_RE = new RegExp(`(${HIGHLIGHT_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')

function highlightDesc(text: string) {
  return text.split(HIGHLIGHT_RE).map((part, i) =>
    HIGHLIGHT_PHRASES.includes(part)
      ? <span key={i} className="dl-description-highlight">{part}</span>
      : part
  )
}

const PHASE_DESCRIPTIONS: Record<PhaseKey, string> = {
  civil: 'Civil Twilight is the brightest form of twilight.  Artificial light may not be required to carry out outdoor activities and only the brightest celestial objects can be observed by the naked eye during this time.  Several countries use this definition of civil twilight to make laws related to aviation, hunting, and the usage of headlights and street lamps.',
  nautical: 'Nautical Twilight dates back to the time when sailors used the stars to navigate the seas. During this time, most stars can be easily seen with the naked eye, and the horizon is also visible in clear weather conditions.',
  astronomical: 'During Astronomical Twilight, most celestial objects can be observed in the sky. However, the atmosphere still scatters and refracts a small amount of sunlight, and that may make it difficult for astronomers to view the faintest objects.',
  truedark: 'At True Darkness, no residual afterglow from the Sun exists. The sky achieves maximum darkness, making it the ideal time for deep space astronomical observations and viewing the faintest stars.',
}

export default function DarknessLevelExpanded({ astronomy, time }: Props) {
  const altitude   = estimateAltitude(time, astronomy)
  const clampedAlt = Math.max(-90, Math.min(MAX_ALT, altitude))
  const rad  = (clampedAlt * Math.PI) / 180
  const sunX = FAN_CX + FAN_R * Math.cos(rad)
  const sunY = FAN_CY - FAN_R * Math.sin(rad)

  const currentMins = toMins(time)
  const sunriseMins = toMins(astronomy.sunrise)
  const sunsetMins  = toMins(astronomy.sunset)
  const isMorning   = currentMins < sunriseMins

  const civilEnd = astronomy.evening.civil_twilight_end        ? toMins(astronomy.evening.civil_twilight_end)        : sunsetMins + 30
  const nautEnd  = astronomy.evening.nautical_twilight_end     ? toMins(astronomy.evening.nautical_twilight_end)     : sunsetMins + 60
  const astroEnd = astronomy.evening.astronomical_twilight_end ? toMins(astronomy.evening.astronomical_twilight_end) : sunsetMins + 90

  const currentStage = altitude > 0    ? 'Daylight'
    : altitude > -6  ? 'Civil Twilight'
    : altitude > -12 ? 'Nautical Twilight'
    : altitude > -18 ? 'Astronomical Twilight'
    : 'True Dark'

  const [selectedPhase, setSelectedPhase] = useState<PhaseKey>(() => stageToPhaseKey(currentStage))

  const altDegrees = Math.abs(Math.round(altitude))
  const aboveBelow = altitude >= 0 ? 'above' : 'below'

  type StatRow = { bold: string; suffix: string }
  let row2: StatRow | null = null
  let row3: StatRow | null = null

  if (currentStage === 'True Dark') {
    row2 = { bold: formatCountdown(currentMins, sunriseMins), suffix: 'until Sunrise' }
  } else if (currentStage === 'Astronomical Twilight') {
    row2 = isMorning
      ? { bold: formatCountdown(currentMins, sunriseMins), suffix: 'until Sunrise' }
      : { bold: formatCountdown(currentMins, astroEnd), suffix: 'until True Dark' }
  } else if (isMorning) {
    row2 = { bold: formatCountdown(currentMins, sunriseMins), suffix: 'until Sunrise' }
  } else if (currentStage === 'Nautical Twilight') {
    row2 = { bold: formatCountdown(currentMins, nautEnd), suffix: 'until Astronomical Twilight' }
    row3 = { bold: formatCountdown(currentMins, astroEnd), suffix: 'until True Dark' }
  } else if (currentStage === 'Civil Twilight') {
    row2 = { bold: formatCountdown(currentMins, civilEnd), suffix: 'until Nautical Twilight' }
    row3 = { bold: formatCountdown(currentMins, astroEnd), suffix: 'until True Dark' }
  } else {
    row2 = { bold: formatCountdown(currentMins, sunsetMins), suffix: 'until Sunset' }
    row3 = { bold: formatCountdown(currentMins, astroEnd), suffix: 'until True Dark' }
  }

  return (
    <div className="dl-expanded">
      <div className="dl-diagram-wrap">
        <div className="dl-png-wrap">
          <img src={darknessLevelsPng} alt="Darkness levels diagram" className="dl-diagram-img" />
          <svg
            viewBox={`0 0 ${PNG_W} ${PNG_H}`}
            className="dl-sun-overlay"
          >
            <circle cx={sunX} cy={sunY} r={24} fill="#FFD700" opacity="0.13" />
            <circle cx={sunX} cy={sunY} r={13} fill="#FFD700" opacity="0.65" />
            <circle cx={sunX} cy={sunY} r={7}  fill="#FFF8E0" opacity="0.95" />
          </svg>
        </div>
      </div>

      <div className="dl-info">
        <div className="dl-info-top">
          <div className="dl-phase-header">
            <div className="dl-current-phase-label">Current Phase</div>
            <div className="dl-phase-name">{currentStage}</div>
          </div>

          <div className="dl-stats">
            <div className="dl-stat">
              Sun is <span className="dl-stat-purple">{altDegrees} Degrees</span> {aboveBelow} horizon
            </div>
            {row2 && (
              <div className="dl-stat">
                <span className="dl-stat-purple">{row2.bold}</span> {row2.suffix}
              </div>
            )}
            {row3 && (
              <div className="dl-stat">
                <span className="dl-stat-purple">{row3.bold}</span> {row3.suffix}
              </div>
            )}
          </div>
        </div>

        <div className="dl-descriptions-section">
          <div className="dl-descriptions-label">Descriptions</div>
          <div className="dl-phase-buttons">
            {(Object.keys(PHASE_LABELS) as PhaseKey[]).map((key) => (
              <button
                key={key}
                className={`dl-phase-btn${selectedPhase === key ? ' dl-phase-btn--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setSelectedPhase(key) }}
              >
                {PHASE_LABELS[key]}
              </button>
            ))}
          </div>
          {PHASE_DESCRIPTIONS[selectedPhase] && (
            <p className="dl-description-text">{highlightDesc(PHASE_DESCRIPTIONS[selectedPhase])}</p>
          )}
        </div>
      </div>
    </div>
  )
}
