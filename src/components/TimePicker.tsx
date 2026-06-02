import { useState, useRef, useEffect } from 'react'
import './TimePicker.css'

interface TimePickerProps {
  value: string | null // HH:mm 24-hour
  onChange: (time: string | null) => void
}

function parseTime(value: string | null): { hour: number; period: 'AM' | 'PM' } {
  if (!value) return { hour: 12, period: 'AM' }
  const h = parseInt(value.split(':')[0], 10)
  if (h === 0) return { hour: 12, period: 'AM' }
  if (h < 12) return { hour: h, period: 'AM' }
  if (h === 12) return { hour: 12, period: 'PM' }
  return { hour: h - 12, period: 'PM' }
}

function toHHmm(hour: number, period: 'AM' | 'PM'): string {
  let h: number
  if (period === 'AM') {
    h = hour === 12 ? 0 : hour
  } else {
    h = hour === 12 ? 12 : hour + 12
  }
  return `${String(h).padStart(2, '0')}:00`
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(() => parseTime(value).hour)
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => parseTime(value).period)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { hour: h, period: p } = parseTime(value)
    setHour(h)
    setPeriod(p)
  }, [value])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function incrementHour() {
    const next = hour === 12 ? 1 : hour + 1
    // 11 → 12 crosses the AM/PM boundary
    const nextPeriod = hour === 11 ? (period === 'AM' ? 'PM' : 'AM') : period
    setHour(next)
    setPeriod(nextPeriod)
    onChange(toHHmm(next, nextPeriod))
  }

  function decrementHour() {
    const next = hour === 1 ? 12 : hour - 1
    // 12 → 11 crosses the AM/PM boundary
    const nextPeriod = hour === 12 ? (period === 'AM' ? 'PM' : 'AM') : period
    setHour(next)
    setPeriod(nextPeriod)
    onChange(toHHmm(next, nextPeriod))
  }

  function togglePeriod() {
    const next = period === 'AM' ? 'PM' : 'AM'
    setPeriod(next)
    onChange(toHHmm(hour, next))
  }

  const displayText = value ? `${hour}:00 ${period}` : null

  return (
    <div className="timepicker-wrapper" ref={wrapperRef}>
      <div className="sidebar-time" onClick={() => setOpen((o) => !o)}>
        {displayText ? (
          <span className="sidebar-time-display">{displayText}</span>
        ) : (
          <span className="sidebar-time-display sidebar-time-placeholder">hh:mm am</span>
        )}
      </div>

      {open && (
        <div className="timepicker-popup">
          <div className="timepicker-grid">
            {/* Hour column */}
            <div className="timepicker-col">
              <button className="timepicker-arrow" onClick={incrementHour}>▲</button>
              <span className="timepicker-value">{String(hour).padStart(2, '0')}</span>
              <button className="timepicker-arrow" onClick={decrementHour}>▼</button>
            </div>

            {/* Colon + minutes (no controls) */}
            <div className="timepicker-col timepicker-col-static">
              <span className="timepicker-colon">:</span>
              <span className="timepicker-value timepicker-minutes">00</span>
            </div>

            {/* AM/PM column */}
            <div className="timepicker-col">
              <button className="timepicker-arrow" onClick={togglePeriod}>▲</button>
              <span className="timepicker-value timepicker-period">{period}</span>
              <button className="timepicker-arrow" onClick={togglePeriod}>▼</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
