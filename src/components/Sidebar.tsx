import calendarIcon from '../assets/calendar_icon.png'
import LocationSearch from './LocationSearch'
import type { CityRecord } from '../types'
import './Sidebar.css'

interface SidebarProps {
  location: CityRecord
  date: string | null
  time: string | null
  onLocationChange: (city: CityRecord) => void
  onDateChange: (date: string | null) => void
  onTimeChange: (time: string | null) => void
}

export default function Sidebar({
  location,
  date,
  time,
  onLocationChange,
  onDateChange,
  onTimeChange,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <span className="sidebar-label">Location</span>
        <LocationSearch value={location} onChange={onLocationChange} />
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-label">Date</span>
        <div className="sidebar-date">
          <input
            type="date"
            className="sidebar-date-input"
            value={date ?? ''}
            onChange={(e) => onDateChange(e.target.value || null)}
          />
          <img src={calendarIcon} className="sidebar-icon-date" alt="" />
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-label">Time</span>
        <div className="sidebar-time">
          <input
            type="time"
            className="sidebar-time-input"
            value={time ?? ''}
            onChange={(e) => onTimeChange(e.target.value || null)}
          />
        </div>
      </div>
    </div>
  )
}
