import expandIcon from '../assets/expand_icon.png'
import type { IMetricCard } from '../types'
import './MetricCard.css'

export default function MetricCard({
  title,
  score,
  bubble,
  details,
  status = 'loaded',
}: IMetricCard) {

  if (status === 'loading') {
    return (
      <div className="metric-card">
        <div className="metric-card-header">
          <span className="metric-card-title">{title}</span>
          <span className="metric-card-bubble bubble-gray" />
        </div>
        <div className="metric-card-skeleton" />
      </div>
    )
  }

  const showData = status === 'loaded'

  return (
    <div className="metric-card">
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
  )
}
