import { useEffect, useState } from 'react'
import type { IMetricCard, IStarScoreResult } from '../types'
import './ExpandedCardOverlay.css'

interface Props {
  cardTitle: string
  metric: IMetricCard | null
  starScore: IStarScoreResult | null
  originRect: DOMRect
  targetRect: DOMRect
  onClose: () => void
}

export default function ExpandedCardOverlay({
  cardTitle,
  metric,
  starScore,
  originRect,
  targetRect,
  onClose,
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
          <StarScoreLayout score={score} bubble={bubble} />
        ) : (
          <MetricLayout
            title={cardTitle}
            score={score}
            bubble={bubble}
            description={description}
          />
        )}

        <div className="expanded-card-content">
          {/* per-card content components rendered here in future issues */}
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
}: {
  score: number | null
  bubble: string
}) {
  return (
    <div className="expanded-star-header">
      <div className="expanded-star-title-row">
        <span className="expanded-star-title">Star Score</span>
        <span className={`expanded-star-bubble bubble-${bubble}`} />
      </div>
      <div className="expanded-star-body">
        <span className="expanded-star-score">{score ?? '--'}</span>
      </div>
    </div>
  )
}
