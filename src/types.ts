export type IBubbleColor = 'red' | 'yellow' | 'orange' | 'green' | 'gray'
export type ICardStatus = 'idle' | 'loading' | 'loaded' | 'error'
export type IInvertMetric = 'Moon Brightness' | 'Cloud Cover' | 'Precipitation' | 'Humidity'

export type ICity = {
  city: string
  state_id: string
  lat: string
  lng: string
  timezone: string
}

export type IMetricCard = {
  title: string
  score: number
  bubble: IBubbleColor
  details: string[]
  status?: ICardStatus
}

export type IStarScoreResult = {
  score: number
  bubble: IBubbleColor
}

export type IAirQualityData = {
  hourly: {
    time: string[]
    pm2_5: number[]
  }
}

export type ITwilightPeriod = {
  civil_twilight_end?: string
  nautical_twilight_end?: string
  astronomical_twilight_end?: string
  civil_twilight_begin?: string
  nautical_twilight_begin?: string
  astronomical_twilight_begin?: string
}

export type IAstronomyData = {
  sunrise: string
  sunset: string
  moon_illumination_percentage: number
  evening: ITwilightPeriod
  morning: ITwilightPeriod
}

export type ILightPollutionData = {
  radiance: number
  sqm: number
  bortle: number
}

export type IWeatherData = {
  hourly: {
    time: string[]
    cloud_cover: number[]
    precipitation_probability: number[]
    relative_humidity_2m: number[]
    temperature_2m: number[]
    dew_point_2m: number[]
    visibility: number[]
  }
}

export type IFetchResult = {
  key: string
  astronomy: IAstronomyData
  weather: IWeatherData
  airQuality: IAirQualityData
  lightPollution: ILightPollutionData
}

export type IFetchError = {
  key: string
  message: string
}
