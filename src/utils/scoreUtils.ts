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

export function scoreTransparency(
  cloudCover: number,
  relativeHumidity: number,
  temperature: number,
  dewPoint: number,
  visibility: number,
): ScoreResult {
  if (cloudCover > 80) {
    return { score: 10, bubble: bubbleFromScore(10), detail: 'Poor' }
  }

  const cloudFactor = 1 - cloudCover / 100
  const humidityPenalty = Math.max(0, (relativeHumidity - 60) / 40)
  const humidityFactor = 1 - humidityPenalty * 0.6
  const dewFactor = Math.min(1, (temperature - dewPoint) / 10)
  const visibilityFactor = Math.min(1, visibility / 20000)

  const raw =
    cloudFactor * 0.5 +
    humidityFactor * 0.2 +
    dewFactor * 0.15 +
    visibilityFactor * 0.15

  const score = Math.round(Math.max(0, Math.min(1, raw)) * 100)
  const detail =
    score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Moderate' : 'Poor'
  return { score, bubble: bubbleFromScore(score), detail }
}
