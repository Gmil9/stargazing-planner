export type BubbleColor = 'red' | 'yellow' | 'orange' | 'green' | 'gray'
export type CardStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface CityRecord {
  city: string
  state_id: string
  lat: string
  lng: string
  timezone: string
}

export interface MetricData {
  title: string
  score: number
  bubble: BubbleColor
  details: string[]
  status: CardStatus
}
