import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { bubbleFromScore } from './scoreUtils'
import type { ScoreResult } from './scoreUtils'
import type { AstronomyData } from '../services/astronomyApi'

dayjs.extend(customParseFormat)

function parseTime(t: string) {
  return dayjs(t, 'HH:mm')
}

export function calcDarkness(time: string, data: AstronomyData): ScoreResult {
  const t = parseTime(time)
  const sunrise = parseTime(data.sunrise)
  const sunset = parseTime(data.sunset)
  const civilEnd = data.evening.civil_twilight_end
    ? parseTime(data.evening.civil_twilight_end)
    : sunset.add(30, 'minute')
  const nauticalEnd = data.evening.nautical_twilight_end
    ? parseTime(data.evening.nautical_twilight_end)
    : sunset.add(60, 'minute')

  // Pre-dawn: before sunrise is fully dark
  if (t.isBefore(sunrise)) {
    return { score: 100, bubble: bubbleFromScore(100), detail: 'Astronomical Dark' }
  }
  // At or after nautical twilight end: astronomical twilight or full dark
  if (!t.isBefore(nauticalEnd)) {
    return { score: 100, bubble: bubbleFromScore(100), detail: 'Astronomical Dark' }
  }
  // At or after civil twilight end: nautical twilight
  if (!t.isBefore(civilEnd)) {
    return { score: 70, bubble: bubbleFromScore(70), detail: 'Nautical Twilight' }
  }
  // At or after sunset: civil twilight
  if (!t.isBefore(sunset)) {
    return { score: 40, bubble: bubbleFromScore(40), detail: 'Civil Twilight' }
  }
  return { score: 10, bubble: bubbleFromScore(10), detail: 'Daylight' }
}
