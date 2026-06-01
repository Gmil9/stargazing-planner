import type { BubbleColor } from '../types'

export interface ScoreResult {
  score: number
  bubble: BubbleColor
  detail: string
}

export function bubbleFromScore(score: number): BubbleColor {
  if (score >= 75) return 'green'
  if (score >= 50) return 'yellow'
  if (score >= 25) return 'orange'
  return 'red'
}

type InvertMetric = 'Moon Brightness' | 'Cloud Cover' | 'Precipitation' | 'Humidity'

export function scoreInvert(value: number, metric: InvertMetric): ScoreResult {
  const score = Math.round(Math.max(0, Math.min(100, 100 - value)))
  const bubble = bubbleFromScore(score)
  const detailMap: Record<InvertMetric, string> = {
    'Moon Brightness': `${Math.round(value)}% Illuminated`,
    'Cloud Cover': `${Math.round(value)}% Cloud Cover`,
    Precipitation: `${Math.round(value)}% Chance`,
    Humidity: `${Math.round(value)}% Humidity`,
  }
  return { score, bubble, detail: detailMap[metric] }
}

export function scorePM25(value: number): ScoreResult {
  const score = Math.max(0, Math.round(100 - value / 2))
  return { score, bubble: bubbleFromScore(score), detail: `${Math.round(value)} µg/m³` }
}
