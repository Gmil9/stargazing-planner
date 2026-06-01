import Sidebar from './components/Sidebar'
import StarScoreCard from './components/StarScoreCard'
import MetricCard from './components/MetricCard'
import './App.css'

type BubbleColor = 'red' | 'green' | 'yellow' | 'orange'

interface Metric {
  title: string
  score: number
  bubble: BubbleColor
  details: string[]
}

const metrics: Metric[] = [
  { title: 'Light Pollution', score: 5, bubble: 'red', details: ['Bortle 9', 'SQM. 21.3'] },
  { title: 'Moon Brightness', score: 2, bubble: 'red', details: ['Full Moon'] },
  { title: 'Cloud Cover', score: 90, bubble: 'green', details: ['Clear'] },
  { title: 'Precipitation', score: 90, bubble: 'green', details: ['5% Chance'] },
  { title: 'Darkness Level', score: 60, bubble: 'yellow', details: ['Twilight 5.5'] },
  { title: 'Humidity', score: 90, bubble: 'green', details: ['20%'] },
  { title: 'Dust', score: 50, bubble: 'orange', details: ['Hazy'] },
  { title: 'Transparency', score: 50, bubble: 'orange', details: ['High'] },
]

function App() {
  return (
    <div className="page">
      <div className="container">
        <Sidebar />
        <main className="main">
          <StarScoreCard />
          <div className="grid">
            {metrics.map((m) => (
              <MetricCard
                key={m.title}
                title={m.title}
                score={m.score}
                bubble={m.bubble}
                details={m.details}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
