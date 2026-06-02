import type { IBubbleColor, IInvertMetric } from '../types'

export interface ScoreResult {
  score: number
  bubble: IBubbleColor
  detail: string
}

export function bubbleFromScore(score: number): IBubbleColor {
  if (score >= 80) return 'green'
  if (score >= 60) return 'yellow'
  if (score >= 40) return 'orange'
  return 'red'
}

// Invert metrics are those where a higher raw value means worse stargazing conditions, so we invert them to get a score where higher is better.
export function scoreInvert(value: number, metric: IInvertMetric): ScoreResult {
  const score = Math.round(Math.max(0, Math.min(100, 100 - value)))
  const bubble = bubbleFromScore(score)
  const detailMap: Record<IInvertMetric, string> = {
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

export function scoreLightPollution(bortle: number): { score: number; bubble: IBubbleColor } {
  const score = Math.round(((9 - bortle) / 8) * 100)
  return { score, bubble: bubbleFromScore(score) }
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
