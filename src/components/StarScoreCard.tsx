import type { StarScoreResult } from '../utils/starScoreCalculator'
import './StarScoreCard.css'

interface StarScoreCardProps {
  starScore: StarScoreResult | null
  loading: boolean
}

function getDescription(score: number | null): string {
  if (score === null)
    return 'Select a location, date, and time to see your star score.'
  if (score >= 75)
    return 'Excellent conditions for stargazing tonight. Expect clear, dark skies with minimal interference.'
  if (score >= 50) return 'Good conditions for stargazing. Some factors may slightly reduce visibility.'
  if (score >= 25)
    return 'Fair conditions tonight. Multiple factors are limiting the quality of your session.'
  return 'Poor conditions for stargazing tonight. Consider rescheduling for a better night.'
}

export default function StarScoreCard({ starScore, loading }: StarScoreCardProps) {
  const bubble = starScore?.bubble ?? 'gray'
  const score = starScore?.score ?? null

  return (
    <div className="star-score-card">
      <div className="star-score-header">
        <span className="star-score-title">Star Score</span>
        <span className={`star-score-bubble bubble-${bubble}`} />
      </div>
      <div className="star-score-body">
        {loading ? (
          <div className="star-score-skeleton" />
        ) : (
          <>
            <span className="star-score-number">{score ?? '--'}</span>
            <p className="star-score-description">{getDescription(score)}</p>
          </>
        )}
      </div>
    </div>
  )
}
