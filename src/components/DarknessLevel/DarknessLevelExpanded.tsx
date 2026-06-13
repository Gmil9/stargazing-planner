import type { IAstronomyData } from '../../types'
import './DarknessLevelExpanded.css'

interface Props {
  astronomy: IAstronomyData
  time: string
}

// Semicircle geometry constants
const CX = 18   // left edge (flat diameter side)
const CY = 158  // vertical center
const R  = 148  // radius

function pt(angleDeg: number, radius: number = R): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)]
}

// Pie slice from center: a1 → a2, clockwise in SVG (a2 < a1 in standard angles)
function slicePath(a1: number, a2: number): string {
  const [x1, y1] = pt(a1)
  const [x2, y2] = pt(a2)
  const largeArc = (a1 - a2) > 180 ? 1 : 0
  return `M ${CX},${CY} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${R},${R},0,${largeArc},1,${x2.toFixed(2)},${y2.toFixed(2)} Z`
}

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

  if (t < astroBegin) return -22
  if (t < nautBegin)  return lerp(-18, -12, frac(astroBegin, nautBegin, t))
  if (t < civilBegin) return lerp(-12, -6,  frac(nautBegin,  civilBegin, t))
  if (t < sunrise)    return lerp(-6,  0,   frac(civilBegin, sunrise, t))
  if (t <= sunset)    return 20 + lerp(0, 35, Math.sin(frac(sunrise, sunset, t) * Math.PI))
  if (t < civilEnd)   return lerp(0,  -6,   frac(sunset,   civilEnd, t))
  if (t < nautEnd)    return lerp(-6, -12,  frac(civilEnd,  nautEnd,  t))
  if (t < astroEnd)   return lerp(-12, -18, frac(nautEnd,   astroEnd, t))
  return -22
}

function formatCountdown(fromMins: number, toMins: number): string {
  let diff = toMins - fromMins
  if (diff < 0) diff += 24 * 60
  if (diff <= 0) return 'Now'
  const h = Math.floor(diff / 60)
  const m = Math.floor(diff % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function DarknessLevelExpanded({ astronomy, time }: Props) {
  const altitude   = estimateAltitude(time, astronomy)
  const clampedAlt = Math.max(-78, Math.min(78, altitude))
  const [sunX, sunY] = pt(clampedAlt, R * 0.70)

  // Boundary arc endpoints
  const [hx,   hy  ] = pt(0)
  const [c6x,  c6y ] = pt(-6)
  const [n12x, n12y] = pt(-12)
  const [a18x, a18y] = pt(-18)

  // Label Y at midpoint of each zone
  const labelX = CX + R + 11
  const [, labHorY ] = pt(0)
  const [, labCivY ] = pt(-3)
  const [, labNauY ] = pt(-9)
  const [, labAstY ] = pt(-15)

  // Next boundary info
  const currentMins = toMins(time)
  const sunset   = toMins(astronomy.sunset)
  const civilEnd = astronomy.evening.civil_twilight_end        ? toMins(astronomy.evening.civil_twilight_end)        : sunset + 30
  const nautEnd  = astronomy.evening.nautical_twilight_end     ? toMins(astronomy.evening.nautical_twilight_end)     : sunset + 60
  const astroEnd = astronomy.evening.astronomical_twilight_end ? toMins(astronomy.evening.astronomical_twilight_end) : sunset + 90

  let nextLabel: string | null = null
  let nextTime:  string | null = null
  const t = currentMins
  if (t < sunset)                                              { nextLabel = 'Sunset';                nextTime = astronomy.sunset }
  else if (t < civilEnd && astronomy.evening.civil_twilight_end)        { nextLabel = 'Nautical Twilight';     nextTime = astronomy.evening.civil_twilight_end }
  else if (t < nautEnd  && astronomy.evening.nautical_twilight_end)     { nextLabel = 'Astronomical Twilight'; nextTime = astronomy.evening.nautical_twilight_end }
  else if (t < astroEnd && astronomy.evening.astronomical_twilight_end) { nextLabel = 'True Dark';             nextTime = astronomy.evening.astronomical_twilight_end }

  const astroEndStr = astronomy.evening.astronomical_twilight_end
  const countdownToTrueDark = astroEndStr && t < astroEnd
    ? formatCountdown(t, astroEnd) : null

  const currentStage = altitude > 0    ? 'Daylight'
    : altitude > -6  ? 'Civil Twilight'
    : altitude > -12 ? 'Nautical Twilight'
    : altitude > -18 ? 'Astronomical Twilight'
    : 'True Dark'

  return (
    <div className="dl-expanded">
      <div className="dl-diagram-wrap">
        {/* viewBox: 0 0 300 340 — semicircle opens to the right, flat edge at x=CX */}
        <svg viewBox="0 0 300 340" className="dl-svg">

          {/* Zone fills — pie slices radiating from center */}
          <path d={slicePath(90, 0)}    fill="#4a78b2" />
          <path d={slicePath(0,  -6)}   fill="#1e3d5c" />
          <path d={slicePath(-6, -12)}  fill="#152a42" />
          <path d={slicePath(-12, -18)} fill="#0c1c2e" />
          <path d={slicePath(-18, -90)} fill="#060e1a" />

          {/* Boundary lines — radial from center at actual altitude angles */}
          <line x1={CX} y1={CY} x2={hx}   y2={hy}   stroke="#5a8ab8" strokeWidth="1.2" />
          <line x1={CX} y1={CY} x2={c6x}  y2={c6y}  stroke="#2a4a72" strokeDasharray="4,3" strokeWidth="0.9" />
          <line x1={CX} y1={CY} x2={n12x} y2={n12y} stroke="#1e3a5a" strokeDasharray="4,3" strokeWidth="0.9" />
          <line x1={CX} y1={CY} x2={a18x} y2={a18y} stroke="#142840" strokeDasharray="4,3" strokeWidth="0.9" />

          {/* Flat left edge (diameter) */}
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="#2a3a5a" strokeWidth="1.2" />

          {/* Arc border */}
          <path d={`M ${CX},${CY - R} A ${R},${R},0,0,1,${CX},${CY + R}`}
            fill="none" stroke="#2a3a5a" strokeWidth="1.2" />

          {/* Zone labels */}
          <text x={labelX} y={labHorY - 5}  fill="#6a9abf" fontSize="14" fontFamily="Inter, sans-serif">Horizon</text>
          <text x={labelX} y={labCivY + 3}  fill="#3d618a" fontSize="14" fontFamily="Inter, sans-serif">Civil</text>
          <text x={labelX} y={labNauY + 3}  fill="#2a456a" fontSize="14" fontFamily="Inter, sans-serif">Nautical</text>
          <text x={labelX} y={labAstY + 3}  fill="#1e3455" fontSize="14" fontFamily="Inter, sans-serif">Astronomical</text>
          <text x={CX + 55} y={CY + R + 18} fill="#6a8aaa" fontSize="14" fontFamily="Inter, sans-serif" textAnchor="middle">True Dark</text>

          {/* Daylight label inside upper zone */}
          <text x={CX + 62} y={CY - 62} fill="#a8ccee" fontSize="14" fontFamily="Inter, sans-serif" textAnchor="middle">Daylight</text>

          {/* Sun indicator at current altitude */}
          <circle cx={sunX} cy={sunY} r={13} fill="#FFD700" opacity="0.13" />
          <circle cx={sunX} cy={sunY} r={7}  fill="#FFD700" opacity="0.65" />
          <circle cx={sunX} cy={sunY} r={4}  fill="#FFF8E0" opacity="0.95" />
        </svg>
      </div>

      <div className="dl-info">
        <div className="dl-stage-label">{currentStage}</div>
        <div className="dl-info-rows">
          {nextLabel && nextTime && (
            <div className="dl-row">
              <span className="dl-row-label">{nextLabel} in</span>
              <span className="dl-row-value">{formatCountdown(currentMins, toMins(nextTime))}</span>
            </div>
          )}
          {nextLabel && nextTime && (
            <div className="dl-row">
              <span className="dl-row-label">{nextLabel} at</span>
              <span className="dl-row-value">{formatTime(nextTime)}</span>
            </div>
          )}
          {countdownToTrueDark && astroEndStr && (
            <div className="dl-row dl-row--truedark">
              <span className="dl-row-label">True Dark in</span>
              <span className="dl-row-value">{countdownToTrueDark}</span>
            </div>
          )}
          {countdownToTrueDark && astroEndStr && (
            <div className="dl-row">
              <span className="dl-row-label">True Dark at</span>
              <span className="dl-row-value">{formatTime(astroEndStr)}</span>
            </div>
          )}
          {!countdownToTrueDark && (
            <div className="dl-row dl-row--truedark">
              <span className="dl-row-label">Astronomical twilight</span>
              <span className="dl-row-value">Now</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
