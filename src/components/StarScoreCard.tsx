import { useRef } from 'react'
import type { IStarScoreResult } from '../types'
import './StarScoreCard.css'

interface StarScoreCardProps {
  starScore: IStarScoreResult | null
  loading: boolean
  onExpand?: (rect: DOMRect) => void
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

export default function StarScoreCard({ starScore, loading, onExpand }: StarScoreCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const bubble = starScore?.bubble ?? 'gray'
  const score = starScore?.score ?? null

  function handleClick() {
    if (onExpand && cardRef.current) {
      onExpand(cardRef.current.getBoundingClientRect())
    }
  }

  return (
    <div className="star-score-card" ref={cardRef} onClick={handleClick} style={{ cursor: 'pointer' }}>
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
