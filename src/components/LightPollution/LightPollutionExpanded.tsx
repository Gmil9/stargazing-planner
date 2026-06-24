import LightPollutionMap from './LightPollutionMap'
import type { ICity } from '../../types'

interface Props {
  location: ICity
}

export default function LightPollutionExpanded({ location }: Props) {
  return (
    <div style={{ flex: 1, overflow: 'hidden', padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <LightPollutionMap location={location} windowWidth={425} windowHeight={250} />
    </div>
  )
}
