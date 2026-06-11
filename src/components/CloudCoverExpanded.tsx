import RegionalHeatmap from './RegionalHeatmap'
import type { ICity } from '../types'

interface Props {
  location: ICity
  date: string
  time: string
}

export default function CloudCoverExpanded({ location, date, time }: Props) {
  return <RegionalHeatmap location={location} date={date} time={time} field="cloud_cover" />
}
