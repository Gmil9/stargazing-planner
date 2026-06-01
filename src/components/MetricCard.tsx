import expandIcon from '../assets/expand_icon.png'
import './MetricCard.css'

interface MetricCardProps {
  title: string
  score: number
  bubble: 'red' | 'green' | 'yellow' | 'orange'
  details: string[]
}

export default function MetricCard({ title, score, bubble, details }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <span className="metric-card-title">{title}</span>
        <span className={`metric-card-bubble bubble-${bubble}`} />
      </div>

      <div className="metric-card-score-row">
        <span className="metric-card-score">{score}</span>
        <span className="metric-card-suffix">/100</span>
      </div>

      <div className="metric-card-footer">
        <div className="metric-card-details">
          {details.map((d, i) => (
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
