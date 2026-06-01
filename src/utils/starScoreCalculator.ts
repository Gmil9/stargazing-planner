import { bubbleFromScore } from './scoreUtils'
import type { BubbleColor } from '../types'

export interface StarScoreResult {
  score: number
  bubble: BubbleColor
}

const WEIGHTS: Record<string, number> = {
  'Cloud Cover': 0.25,
  'Moon Brightness': 0.2,
  'Darkness Level': 0.2,
  Precipitation: 0.15,
  Humidity: 0.1,
  'PM2.5': 0.1,
}

export function calcStarScore(scores: Record<string, number>): StarScoreResult {
  let total = 0
  for (const [title, weight] of Object.entries(WEIGHTS)) {
    total += (scores[title] ?? 0) * weight
  }
  const score = Math.round(total)
  return { score, bubble: bubbleFromScore(score) }
}
