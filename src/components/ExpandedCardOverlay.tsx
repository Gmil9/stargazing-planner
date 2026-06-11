import { useEffect, useState } from 'react'
import type { IMetricCard, IStarScoreResult, IAstronomyData, IWeatherData, IAirQualityData, ICity } from '../types'
import StarScoreExpanded from './StarScoreExpanded'
import LightPollutionExpanded from './LightPollutionExpanded'
import CloudCoverExpanded from './CloudCoverExpanded'
import PrecipitationExpanded from './PrecipitationExpanded'
import DarknessLevelExpanded from './DarknessLevelExpanded'
import TransparencyExpanded from './TransparencyExpanded'
import HumidityExpanded from './HumidityExpanded'
import SmokeExpanded from './SmokeExpanded'
import MoonBrightnessExpanded from './MoonBrightnessExpanded'
import './ExpandedCardOverlay.css'

interface Props {
  cardTitle: string
  metric: IMetricCard | null
  starScore: IStarScoreResult | null
  originRect: DOMRect
  targetRect: DOMRect
  onClose: () => void
  location: ICity
  date: string | null
  time: string | null
  astronomy: IAstronomyData | null
  weather: IWeatherData | null
  airQuality: IAirQualityData | null
}

function getStarDescription(score: number | null): string | null {
  if (score === null) return null
  if (score >= 75) return 'Excellent conditions for stargazing tonight. Expect clear, dark skies with minimal interference.'
  if (score >= 50) return 'Good conditions for stargazing. Some factors may slightly reduce visibility.'
  if (score >= 25) return 'Fair conditions tonight. Multiple factors are limiting the quality of your session.'
  return 'Poor conditions for stargazing tonight. Consider rescheduling for a better night.'
}

export default function ExpandedCardOverlay({
  cardTitle,
  metric,
  starScore,
  originRect,
  targetRect,
  onClose,
  location,
  date,
  time,
  astronomy,
  weather,
  airQuality,
}: Props) {
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setClosing(true)
    setEntered(false)
  }

  const dx = originRect.left - targetRect.left
  const dy = originRect.top - targetRect.top
  const sx = originRect.width / targetRect.width
  const sy = originRect.height / targetRect.height

  const overlayStyle: React.CSSProperties = {
    left: targetRect.left,
    top: targetRect.top,
    width: targetRect.width,
    height: targetRect.height,
    transform: entered ? 'none' : `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
  }

  const isStarScore = cardTitle === 'Star Score'
  const bubble = isStarScore ? (starScore?.bubble ?? 'gray') : (metric?.bubble ?? 'gray')
  const score = isStarScore ? (starScore?.score ?? null) : (metric?.score ?? null)
  const description = !isStarScore ? (metric?.description ?? null) : null

  return (
    <>
      <div className="expanded-card-backdrop" onClick={handleClose} />
      <div
        className={`expanded-card-overlay${isStarScore ? ' expanded-card-overlay--star' : ''}`}
        style={overlayStyle}
        onClick={handleClose}
        onTransitionEnd={() => { if (closing) onClose() }}
      >
        {isStarScore ? (
          <StarScoreLayout score={score} bubble={bubble} description={getStarDescription(score)} />
        ) : (
          <MetricLayout
            title={cardTitle}
            score={score}
            bubble={bubble}
            description={description}
          />
        )}

        <div className="expanded-card-content">
          {cardTitle === 'Star Score' && <StarScoreExpanded />}
          {cardTitle === 'Light Pollution' && (
            <LightPollutionExpanded location={location} />
          )}
          {cardTitle === 'Cloud Cover' && date && time && (
            <CloudCoverExpanded location={location} date={date} time={time} />
          )}
          {cardTitle === 'Precipitation' && date && time && (
            <PrecipitationExpanded location={location} date={date} time={time} />
          )}
          {cardTitle === 'Darkness Level' && astronomy && time && (
            <DarknessLevelExpanded astronomy={astronomy} time={time} />
          )}
          {cardTitle === 'Transparency' && weather && date && time && (
            <TransparencyExpanded weather={weather} date={date} time={time} />
          )}
          {cardTitle === 'Humidity' && weather && date && time && (
            <HumidityExpanded weather={weather} date={date} time={time} />
          )}
          {cardTitle === 'Smoke' && airQuality && date && time && (
            <SmokeExpanded airQuality={airQuality} date={date} time={time} />
          )}
          {cardTitle === 'Moon Brightness' && astronomy && (
            <MoonBrightnessExpanded astronomy={astronomy} />
          )}
        </div>

        <button
          className="expanded-card-collapse"
          onClick={(e) => { e.stopPropagation(); handleClose() }}
          aria-label="Collapse"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 13L8 8M3 13H7M3 13V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 3L8 8M13 3H9M13 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  )
}

function MetricLayout({
  title,
  score,
  bubble,
  description,
}: {
  title: string
  score: number | null
  bubble: string
  description: string | null
}) {
  return (
    <div className="expanded-metric-header">
      <div className="expanded-metric-title-group">
        <span className="expanded-metric-title">{title}</span>
        <span className={`expanded-metric-bubble bubble-${bubble}`} />
      </div>
      {score !== null && (
        <div className="expanded-metric-score-group">
          <span className="expanded-metric-score">{score}</span>
          <span className="expanded-metric-suffix">/100</span>
        </div>
      )}
      {description && (
        <p className="expanded-metric-description">{description}</p>
      )}
    </div>
  )
}

function StarScoreLayout({
  score,
  bubble,
  description,
}: {
  score: number | null
  bubble: string
  description: string | null
}) {
  return (
    <div className="expanded-star-header">
      <div className="expanded-star-left">
        <div className="expanded-star-title-row">
          <span className="expanded-star-title">Star Score</span>
          <span className={`expanded-star-bubble bubble-${bubble}`} />
        </div>
        <span className="expanded-star-score">{score ?? '--'}</span>
      </div>
      {description && (
        <p className="expanded-star-description">{description}</p>
      )}
    </div>
  )
}
