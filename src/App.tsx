import { useState } from 'react'
import Sidebar from './components/Sidebar'
import StarScoreCard from './components/StarScoreCard'
import MetricCard from './components/MetricCard'
import { useStargazingData } from './hooks/useStargazingData'
import type { CityRecord } from './types'
import './App.css'

const DEFAULT_LOCATION: CityRecord = {
  city: 'Boulder',
  state_id: 'CO',
  lat: '40.0248',
  lng: '-105.2524',
  timezone: 'America/Denver',
}

function App() {
  const [location, setLocation] = useState<CityRecord>(DEFAULT_LOCATION)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const { metrics, starScore, loading, error } = useStargazingData(location, date, time)

  const showIdleBanner = !date || !time
  const showErrorBanner = !showIdleBanner && !!error

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
          {showErrorBanner && (
            <div className="banner banner-error">API error: unable to load conditions.</div>
          )}
        </div>

        <main className="main">
          <StarScoreCard starScore={starScore} loading={loading} />
          <div className="grid">
            <MetricCard
              title="Light Pollution"
              score={5}
              bubble="red"
              details={['Bortle 9', 'SQM 21.3']}
            />
            {metrics.map((m) => (
              <MetricCard
                key={m.title}
                title={m.title}
                score={m.score}
                bubble={m.bubble}
                details={m.details}
                status={m.status}
              />
            ))}
            <MetricCard title="Transparency" score={50} bubble="orange" details={['High']} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
