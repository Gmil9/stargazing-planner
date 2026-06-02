import { useState, useEffect, useMemo } from 'react'
import { fetchAstronomy } from '../services/astronomyApi'
import { fetchWeather } from '../services/weatherApi'
import { fetchAirQuality } from '../services/airQualityApi'
import { scoreInvert, scorePM25, scoreTransparency, scoreLightPollution } from '../utils/scoreUtils'
import { calcDarkness } from '../utils/darknessCalculator'
import { calcStarScore } from '../utils/starScoreCalculator'
import { fetchLightPollution } from '../services/lightPollutionService'
import type { ICity, IMetricCard, IBubbleColor, IStarScoreResult, IAirQualityData, IFetchError, IFetchResult, ILightPollutionData, IWeatherData, IAstronomyData } from '../types'

const METRIC_TITLES = [
  'Light Pollution',
  'Moon Brightness',
  'Cloud Cover',
  'Precipitation',
  'Darkness Level',
  'Humidity',
  'Smoke',
  'Transparency',
] as const

function makeStatusMetrics(status: 'idle' | 'loading' | 'error'): IMetricCard[] {
  return METRIC_TITLES.map((title) => ({
    title,
    score: 0,
    bubble: 'gray' as IBubbleColor,
    details: [],
    status,
  }))
}

function deriveMetrics(
  date: string,
  time: string,
  astronomy: IAstronomyData,
  weather: IWeatherData,
  airQuality: IAirQualityData,
  lightPollution: ILightPollutionData,
): IMetricCard[] {
  const targetTime = `${date}T${time}`
  const idx = weather.hourly.time.findIndex((t) => t === targetTime)
  const airIdx = airQuality.hourly.time.findIndex((t) => t === targetTime)
  if (idx === -1) return makeStatusMetrics('error')

  const moonResult = scoreInvert(astronomy.moon_illumination_percentage * -1, 'Moon Brightness')
  const cloudResult = scoreInvert(weather.hourly.cloud_cover[idx] ?? 0, 'Cloud Cover')
  const precipResult = scoreInvert(
    weather.hourly.precipitation_probability[idx] ?? 0,
    'Precipitation',
  )
  const humidityResult = scoreInvert(weather.hourly.relative_humidity_2m[idx] ?? 0, 'Humidity')
  const pm25Val = airIdx !== -1 ? (airQuality.hourly.pm2_5[airIdx] ?? 0) : 0
  const pm25Result = scorePM25(pm25Val)
  const darknessResult = calcDarkness(time, astronomy)
  const transparencyResult = scoreTransparency(
    weather.hourly.cloud_cover[idx] ?? 0,
    weather.hourly.relative_humidity_2m[idx] ?? 0,
    weather.hourly.temperature_2m[idx] ?? 0,
    weather.hourly.dew_point_2m[idx] ?? 0,
    weather.hourly.visibility[idx] ?? 0,
  )
  const lpResult = scoreLightPollution(lightPollution.bortle)

  return [
    { title: 'Light Pollution', score: lpResult.score, bubble: lpResult.bubble, details: [`Bortle ${lightPollution.bortle}`, `SQM ${lightPollution.sqm.toFixed(1)}`], status: 'loaded' },
    { title: 'Moon Brightness', score: moonResult.score, bubble: moonResult.bubble, details: [moonResult.detail], status: 'loaded' },
    { title: 'Cloud Cover', score: cloudResult.score, bubble: cloudResult.bubble, details: [cloudResult.detail], status: 'loaded' },
    { title: 'Precipitation', score: precipResult.score, bubble: precipResult.bubble, details: [precipResult.detail], status: 'loaded' },
    { title: 'Darkness Level', score: darknessResult.score, bubble: darknessResult.bubble, details: [darknessResult.detail], status: 'loaded' },
    { title: 'Humidity', score: humidityResult.score, bubble: humidityResult.bubble, details: [humidityResult.detail], status: 'loaded' },
    { title: 'Smoke', score: pm25Result.score, bubble: pm25Result.bubble, details: [pm25Result.detail], status: 'loaded' },
    { title: 'Transparency', score: transparencyResult.score, bubble: transparencyResult.bubble, details: [transparencyResult.detail], status: 'loaded' },
  ]
}

export function useStargazingData(
  location: ICity,
  date: string | null,
  time: string | null,
): { metrics: IMetricCard[]; starScore: IStarScoreResult | null; loading: boolean; error: string | null } {
  const [result, setResult] = useState<IFetchResult | null>(null)
  const [fetchError, setFetchError] = useState<IFetchError | null>(null)

  // Depend on whether time is set (null vs non-null), not on its specific value.
  // Time changes re-index the cached data in useMemo without triggering a re-fetch.
  const timeSet = !!time

  useEffect(() => {
    if (!date || !timeSet) return

    const key = `${location.lat}|${location.lng}|${date}`
    let cancelled = false

    Promise.all([
      fetchAstronomy(location.lat, location.lng, date),
      fetchWeather(location.lat, location.lng, location.timezone),
      fetchAirQuality(location.lat, location.lng, location.timezone),
      fetchLightPollution(location.lat, location.lng),
    ])
      .then(([astronomy, weather, airQuality, lightPollution]) => {
        if (cancelled) return
        setResult({ key, astronomy, weather, airQuality, lightPollution })
      })
      .catch((err: Error) => {
        if (cancelled) return
        setFetchError({ key, message: err.message })
      })

    return () => {
      cancelled = true
    }
  }, [location.lat, location.lng, location.timezone, date, timeSet])

  // Derive loading and error from key comparison — avoids synchronous setState in effects.
  const currentKey = date ? `${location.lat}|${location.lng}|${date}` : null
  const isResultCurrent = result !== null && result.key === currentKey
  const isErrorCurrent = fetchError !== null && fetchError.key === currentKey && !isResultCurrent

  const loading = !!date && !!time && !isResultCurrent && !isErrorCurrent
  const error = isErrorCurrent ? fetchError.message : null

  const metrics = useMemo<IMetricCard[]>(() => {
    if (!date || !time) return makeStatusMetrics('idle')
    if (loading) return makeStatusMetrics('loading')
    if (error || !isResultCurrent || !result) return makeStatusMetrics('error')
    return deriveMetrics(date, time, result.astronomy, result.weather, result.airQuality, result.lightPollution)
  }, [date, time, loading, error, isResultCurrent, result])

  const starScore = useMemo<IStarScoreResult | null>(() => {
    const loaded = metrics.filter((m) => m.status === 'loaded')
    if (loaded.length < METRIC_TITLES.length) return null
    const scoreMap = Object.fromEntries(loaded.map((m) => [m.title, m.score]))
    return calcStarScore(scoreMap)
  }, [metrics])

  return { metrics, starScore, loading, error }
}
