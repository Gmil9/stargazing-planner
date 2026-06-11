import type { IAstronomyData } from '../types'
import './DarknessLevelExpanded.css'

interface Props {
  astronomy: IAstronomyData
  time: string
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
  const sunset = toMins(data.sunset)

  const astroBegin = data.morning.astronomical_twilight_begin ? toMins(data.morning.astronomical_twilight_begin) : sunrise - 90
  const nautBegin = data.morning.nautical_twilight_begin ? toMins(data.morning.nautical_twilight_begin) : sunrise - 60
  const civilBegin = data.morning.civil_twilight_begin ? toMins(data.morning.civil_twilight_begin) : sunrise - 30

  const civilEnd = data.evening.civil_twilight_end ? toMins(data.evening.civil_twilight_end) : sunset + 30
  const nautEnd = data.evening.nautical_twilight_end ? toMins(data.evening.nautical_twilight_end) : sunset + 60
  const astroEnd = data.evening.astronomical_twilight_end ? toMins(data.evening.astronomical_twilight_end) : sunset + 90

  if (t < astroBegin) return -22
  if (t < nautBegin) return lerp(-18, -12, frac(astroBegin, nautBegin, t))
  if (t < civilBegin) return lerp(-12, -6, frac(nautBegin, civilBegin, t))
  if (t < sunrise) return lerp(-6, 0, frac(civilBegin, sunrise, t))
  if (t <= sunset) return 20 + lerp(0, 35, Math.sin(frac(sunrise, sunset, t) * Math.PI))
  if (t < civilEnd) return lerp(0, -6, frac(sunset, civilEnd, t))
  if (t < nautEnd) return lerp(-6, -12, frac(civilEnd, nautEnd, t))
  if (t < astroEnd) return lerp(-12, -18, frac(nautEnd, astroEnd, t))
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
  const cx = 88
  const cy = 95
  const r = 72

  const altitude = estimateAltitude(time, astronomy)
  const clampedAlt = Math.max(-22, Math.min(55, altitude))
  const altRad = (clampedAlt * Math.PI) / 180

  const currentMins = toMins(time)
  const noonMins = (toMins(astronomy.sunrise) + toMins(astronomy.sunset)) / 2
  const isRising = currentMins < noonMins
  const side = isRising ? -1 : 1

  const sunX = cx + side * r * Math.cos(altRad)
  const sunY = cy - r * Math.sin(altRad)

  // Twilight zone y-coordinates within circle
  const y6 = cy + r * Math.sin(6 * Math.PI / 180)
  const y12 = cy + r * Math.sin(12 * Math.PI / 180)
  const y18 = cy + r * Math.sin(18 * Math.PI / 180)

  // Next boundary
  const t = currentMins
  const sunset = toMins(astronomy.sunset)
  const civilEnd = astronomy.evening.civil_twilight_end ? toMins(astronomy.evening.civil_twilight_end) : sunset + 30
  const nautEnd = astronomy.evening.nautical_twilight_end ? toMins(astronomy.evening.nautical_twilight_end) : sunset + 60
  const astroEnd = astronomy.evening.astronomical_twilight_end ? toMins(astronomy.evening.astronomical_twilight_end) : sunset + 90

  let nextLabel: string | null = null
  let nextTime: string | null = null
  if (t < sunset) { nextLabel = 'Sunset'; nextTime = astronomy.sunset }
  else if (t < civilEnd && astronomy.evening.civil_twilight_end) { nextLabel = 'Nautical Twilight'; nextTime = astronomy.evening.civil_twilight_end }
  else if (t < nautEnd && astronomy.evening.nautical_twilight_end) { nextLabel = 'Astronomical Twilight'; nextTime = astronomy.evening.nautical_twilight_end }
  else if (t < astroEnd && astronomy.evening.astronomical_twilight_end) { nextLabel = 'True Dark'; nextTime = astronomy.evening.astronomical_twilight_end }

  const astroEndStr = astronomy.evening.astronomical_twilight_end
  const countdownToTrueDark = astroEndStr && t < astroEnd
    ? formatCountdown(t, astroEnd) : null

  const currentStage = altitude > 0 ? 'Daylight'
    : altitude > -6 ? 'Civil Twilight'
    : altitude > -12 ? 'Nautical Twilight'
    : altitude > -18 ? 'Astronomical Twilight'
    : 'True Dark'

  return (
    <div className="dl-expanded">
      <div className="dl-diagram-wrap">
        <svg viewBox="0 0 180 190" className="dl-svg">
          <defs>
            <clipPath id="dl-clip">
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
          </defs>

          {/* Zone fills */}
          <rect x={cx - r} y={cy - r} width={r * 2} height={r} fill="#1c3654" clipPath="url(#dl-clip)" />
          <rect x={cx - r} y={cy} width={r * 2} height={y6 - cy} fill="#112238" clipPath="url(#dl-clip)" />
          <rect x={cx - r} y={y6} width={r * 2} height={y12 - y6} fill="#091628" clipPath="url(#dl-clip)" />
          <rect x={cx - r} y={y12} width={r * 2} height={y18 - y12} fill="#060d1a" clipPath="url(#dl-clip)" />
          <rect x={cx - r} y={y18} width={r * 2} height={cy + r - y18} fill="#030609" clipPath="url(#dl-clip)" />

          {/* Circle border */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2a3a5a" strokeWidth="1.2" />

          {/* Horizon line */}
          <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#4a6a8a" strokeWidth="1" />

          {/* Twilight boundary dashes */}
          <line x1={cx - r * Math.cos(6 * Math.PI / 180)} y1={y6} x2={cx + r * Math.cos(6 * Math.PI / 180)} y2={y6}
            stroke="#2a4060" strokeDasharray="3,2.5" strokeWidth="0.7" />
          <line x1={cx - r * Math.cos(12 * Math.PI / 180)} y1={y12} x2={cx + r * Math.cos(12 * Math.PI / 180)} y2={y12}
            stroke="#1f3050" strokeDasharray="3,2.5" strokeWidth="0.7" />
          <line x1={cx - r * Math.cos(18 * Math.PI / 180)} y1={y18} x2={cx + r * Math.cos(18 * Math.PI / 180)} y2={y18}
            stroke="#162440" strokeDasharray="3,2.5" strokeWidth="0.7" />

          {/* Zone labels (right side) */}
          <text x={cx + r + 5} y={cy - 4} fill="#4a6a8a" fontSize="8" fontFamily="Inter, sans-serif">Horizon</text>
          <text x={cx + r + 5} y={(cy + y6) / 2 + 3} fill="#2a4060" fontSize="7.5" fontFamily="Inter, sans-serif">Civil</text>
          <text x={cx + r + 5} y={(y6 + y12) / 2 + 3} fill="#1f3050" fontSize="7.5" fontFamily="Inter, sans-serif">Nautical</text>
          <text x={cx + r + 5} y={(y12 + y18) / 2 + 3} fill="#162440" fontSize="7" fontFamily="Inter, sans-serif">Astro</text>

          {/* Sun glow */}
          <circle cx={sunX} cy={sunY} r={9} fill="#FFD700" opacity="0.15" />
          <circle cx={sunX} cy={sunY} r={5} fill="#FFD700" opacity="0.7" />
          <circle cx={sunX} cy={sunY} r={3.5} fill="#FFF8E0" opacity="0.95" />
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
