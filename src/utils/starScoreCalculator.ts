import { bubbleFromScore } from './scoreUtils'
import type { IStarScoreResult } from '../types'


const WEIGHTS: Record<string, number> = {
  'Light Pollution': 0.30,
  'Cloud Cover': 0.20,
  'Moon Brightness': 0.15,
  'Darkness Level': 0.10,
  'Precipitation': 0.10,
  'Transparency': 0.05,
  'Humidity': 0.05,
  'Smoke': 0.05,
}

export const BEYOND_FORECAST_WEIGHTS: Record<string, number> = {
  'Light Pollution': 0.60,
  'Moon Brightness': 0.15,
  'Darkness Level': 0.25,
}

export function calcStarScore(scores: Record<string, number>, weights: Record<string, number> = WEIGHTS): IStarScoreResult {
  let total = 0
  for (const [title, weight] of Object.entries(weights)) {
    total += (scores[title] ?? 0) * weight
  }
  const score = Math.round(total)
  return { score, bubble: bubbleFromScore(score) }
}
