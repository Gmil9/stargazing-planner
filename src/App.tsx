import { useState } from 'react'
import Sidebar from './components/Sidebar'
import StarScoreCard from './components/StarScoreCard'
import MetricCard from './components/MetricCard'
import LightPollutionMap from './components/LightPollutionMap'
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

  const { metrics, starScore, loading, error, beyondForecast } = useStargazingData(location, date, time)

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

        <main className="main">
          <StarScoreCard starScore={starScore} loading={loading} />
          <div className="grid">
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
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
