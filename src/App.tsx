import { useState, useRef } from 'react'
import Sidebar from './components/Sidebar'
import StarScoreCard from './components/StarScoreCard'
import MetricCard from './components/MetricCard'
import LightPollutionMap from './components/LightPollutionMap'
import ExpandedCardOverlay from './components/ExpandedCardOverlay'
import { useStargazingData } from './hooks/useStargazingData'
import type { ICity } from './types'
import './App.css'

const DEFAULT_LOCATION: ICity = {
  city: 'Boulder',
  state_id: 'CO',
  lat: '40.0248',
  lng: '-105.2524',
  timezone: 'America/Denver',
}

function App() {
  const [location, setLocation] = useState<ICity>(DEFAULT_LOCATION)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>('22:00')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)

  const { metrics, starScore, loading, error, beyondForecast, rawAstronomy, rawWeather, rawAirQuality } = useStargazingData(location, date, time)

  function handleExpand(title: string, rect: DOMRect) {
    const isStarScore = title === 'Star Score'
    const containerRef = isStarScore ? mainRef : gridRef
    if (!containerRef.current) return
    setExpandedCard(title)
    setOriginRect(rect)
    setTargetRect(containerRef.current.getBoundingClientRect())
  }

  function handleClose() {
    setExpandedCard(null)
    setOriginRect(null)
    setTargetRect(null)
  }

  const showIdleBanner = !date || !time
  const showBeyondForecastBanner = !showIdleBanner && beyondForecast
  const showErrorBanner = !showIdleBanner && !beyondForecast && !!error

  return (
    <div className="page">
      <div className="container">
        <div className="sidebar-column">
          <Sidebar
            location={location}
            date={date}
            time={time}
            onLocationChange={setLocation}
            onDateChange={setDate}
            onTimeChange={setTime}
          />
          {showIdleBanner && (
            <div className="banner banner-idle">Select a date and time to load conditions.</div>
          )}
          {showBeyondForecastBanner && (
            <div className="banner banner-forecast">
              Forecast data is only available within 14 days. Showing light pollution, moon brightness, and darkness level - all other metrics require a closer date.
            </div>
          )}
          {showErrorBanner && (
            <div className="banner banner-error">API error: unable to load conditions.</div>
          )}
          <LightPollutionMap location={location} />
        </div>

        <main className="main" ref={mainRef}>
          <StarScoreCard
            starScore={starScore}
            loading={loading}
            onExpand={(rect) => handleExpand('Star Score', rect)}
          />
          <div className={`grid${expandedCard ? ' cards-expanded' : ''}`} ref={gridRef}>
            {metrics.map((m, index) => (
              <MetricCard
                key={m.title}
                title={m.title}
                score={m.score}
                bubble={m.bubble}
                details={m.details}
                description={m.description}
                status={m.status}
                popupDirection={index < 4 ? 'above' : 'below'}
                onExpand={(rect) => handleExpand(m.title, rect)}
              />
            ))}
          </div>
          {expandedCard && originRect && targetRect && (
            <ExpandedCardOverlay
              cardTitle={expandedCard}
              metric={metrics.find((m) => m.title === expandedCard) ?? null}
              starScore={starScore}
              originRect={originRect}
              targetRect={targetRect}
              onClose={handleClose}
              location={location}
              date={date}
              time={time}
              astronomy={rawAstronomy}
              weather={rawWeather}
              airQuality={rawAirQuality}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
