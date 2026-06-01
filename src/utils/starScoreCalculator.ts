import { bubbleFromScore } from './scoreUtils'
import type { BubbleColor } from '../types'

export interface StarScoreResult {
  score: number
  bubble: BubbleColor
}

const WEIGHTS: Record<string, number> = {
  'Cloud Cover': 0.20,
  'Moon Brightness': 0.20,
  'Darkness Level': 0.20,
  Precipitation: 0.15,
  Transparency: 0.10,
  Humidity: 0.10,
  Smoke: 0.05,
}

export function calcStarScore(scores: Record<string, number>): StarScoreResult {
  let total = 0
  for (const [title, weight] of Object.entries(WEIGHTS)) {
    total += (scores[title] ?? 0) * weight
  }
  const score = Math.round(total)
  return { score, bubble: bubbleFromScore(score) }
}
