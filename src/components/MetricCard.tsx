import { useRef } from 'react'
import expandIcon from '../assets/expand_icon.png'
import type { IMetricCard } from '../types'
import './MetricCard.css'

type IMetricCardProps = IMetricCard & {
  popupDirection?: 'above' | 'below'
  onExpand?: (rect: DOMRect) => void
}

export default function MetricCard({
  title,
  score,
  bubble,
  details,
  description,
  status = 'loaded',
  popupDirection = 'above',
  onExpand,
}: IMetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  function handleClick() {
    if (onExpand && cardRef.current) {
      onExpand(cardRef.current.getBoundingClientRect())
    }
  }

  const popup = description ? (
    <div className={`metric-card-popup metric-card-popup--${popupDirection}`}>
      <span className="metric-card-popup-title">{description}</span>
    </div>
  ) : null

  if (status === 'loading') {
    return (
      <div className="metric-card-wrapper">
        {popup}
        <div className="metric-card" ref={cardRef} onClick={handleClick}>
          <div className="metric-card-header">
            <span className="metric-card-title">{title}</span>
            <span className="metric-card-bubble bubble-gray" />
          </div>
          <div className="metric-card-skeleton" />
        </div>
      </div>
    )
  }

  if (status === 'unavailable') {
    return (
      <div className="metric-card-wrapper">
        {popup}
        <div className="metric-card" ref={cardRef} onClick={handleClick}>
          <div className="metric-card-header">
            <span className="metric-card-title">{title}</span>
            <span className="metric-card-bubble bubble-gray" />
          </div>
          <div className="metric-card-score-row">
            <span className="metric-card-score metric-card-score--empty">--</span>
          </div>
          <div className="metric-card-footer">
            <div className="metric-card-details">
              <span className="metric-card-detail">No forecast data</span>
            </div>
            <img src={expandIcon} className="metric-card-expand" alt="" />
          </div>
        </div>
      </div>
    )
  }

  const showData = status === 'loaded'

  return (
    <div className="metric-card-wrapper">
      {popup}
      <div className="metric-card" ref={cardRef} onClick={handleClick}>
        <div className="metric-card-header">
          <span className="metric-card-title">{title}</span>
          <span className={`metric-card-bubble bubble-${bubble}`} />
        </div>

        <div className="metric-card-score-row">
          {showData ? (
            <>
              <span className="metric-card-score">{score}</span>
              <span className="metric-card-suffix">/100</span>
            </>
          ) : (
            <span className="metric-card-score metric-card-score--empty">--</span>
          )}
        </div>

        <div className="metric-card-footer">
          <div className="metric-card-details">
            {showData &&
              details.map((d, i) => (
                <span key={i} className="metric-card-detail">
                  {d}
                </span>
              ))}
          </div>
          <img src={expandIcon} className="metric-card-expand" alt="" />
        </div>
      </div>
    </div>
  )
}
