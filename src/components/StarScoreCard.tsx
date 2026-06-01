import './StarScoreCard.css'

export default function StarScoreCard() {
  return (
    <div className="star-score-card">
      <div className="star-score-header">
        <span className="star-score-title">Star Score</span>
        <span className="star-score-bubble bubble-orange" />
      </div>
      <div className="star-score-body">
        <span className="star-score-number">40</span>
        <p className="star-score-description">
          The city of Denver has the highest light pollution. You will only see the brightest stars
          and planets. This is a super long test to see what happens.
        </p>
      </div>
    </div>
  )
}
