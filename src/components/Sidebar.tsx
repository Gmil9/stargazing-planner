import { useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dayjs from 'dayjs'
import calendarIcon from '../assets/calendar_icon.png'
import LocationSearch from './LocationSearch/LocationSearch'
import TimePicker from './TimePicker/TimePicker'
import { useUnits } from '../context/UnitContext'
import type { ICity } from '../types'
import './Sidebar.css'

interface SidebarProps {
  location: ICity
  date: string | null
  time: string | null
  onLocationChange: (city: ICity) => void
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
  const datePickerRef = useRef<DatePicker>(null)
  const selectedDate = date ? dayjs(date).toDate() : null
  const { units, setUnits } = useUnits()

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
          <DatePicker
            ref={datePickerRef}
            selected={selectedDate}
            onChange={(d: Date | null) => onDateChange(d ? dayjs(d).format('YYYY-MM-DD') : null)}
            dateFormat="MM-dd-yyyy"
            placeholderText="mm-dd-yyyy"
            minDate={new Date()}
            maxDate={dayjs().add(1, 'year').toDate()}
            className="sidebar-date-input"
            calendarClassName="sidebar-datepicker-calendar"
          />
          <img
            src={calendarIcon}
            className="sidebar-icon-date"
            alt=""
            onClick={() => datePickerRef.current?.setOpen(true)}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-label">Time</span>
        <TimePicker value={time} onChange={onTimeChange} />
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <span className="sidebar-label">Units</span>
        <div className="sidebar-unit-toggle">
          <button
            className={`sidebar-unit-btn${units === 'metric' ? ' sidebar-unit-btn--active' : ''}`}
            onClick={() => setUnits('metric')}
          >
            Metric
          </button>
          <button
            className={`sidebar-unit-btn${units === 'imperial' ? ' sidebar-unit-btn--active' : ''}`}
            onClick={() => setUnits('imperial')}
          >
            Imperial
          </button>
        </div>
      </div>
    </div>
  )
}
