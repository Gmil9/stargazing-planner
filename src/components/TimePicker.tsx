import { useState, useRef, useEffect } from 'react'
import './TimePicker.css'

interface TimePickerProps {
  value: string | null // HH:mm 24-hour
  onChange: (time: string | null) => void
}

const MINUTE_STEPS = [0, 15, 30, 45]

function parseTime(value: string | null): { hour: number; minute: number; period: 'AM' | 'PM' } {
  if (!value) return { hour: 12, minute: 0, period: 'AM' }
  const parts = value.split(':')
  const h = parseInt(parts[0], 10)
  const rawMinute = parseInt(parts[1] ?? '0', 10)
  const minute = MINUTE_STEPS.reduce((prev, cur) =>
    Math.abs(cur - rawMinute) < Math.abs(prev - rawMinute) ? cur : prev,
  )
  if (h === 0) return { hour: 12, minute, period: 'AM' }
  if (h < 12) return { hour: h, minute, period: 'AM' }
  if (h === 12) return { hour: 12, minute, period: 'PM' }
  return { hour: h - 12, minute, period: 'PM' }
}

function toHHmm(hour: number, minute: number, period: 'AM' | 'PM'): string {
  let h: number
  if (period === 'AM') {
    h = hour === 12 ? 0 : hour
  } else {
    h = hour === 12 ? 12 : hour + 12
  }
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState(() => parseTime(value).hour)
  const [minute, setMinute] = useState(() => parseTime(value).minute)
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => parseTime(value).period)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { hour: h, minute: m, period: p } = parseTime(value)
    setHour(h)
    setMinute(m)
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
    const nextPeriod = hour === 11 ? (period === 'AM' ? 'PM' : 'AM') : period
    setHour(next)
    setPeriod(nextPeriod)
    onChange(toHHmm(next, minute, nextPeriod))
  }

  function decrementHour() {
    const next = hour === 1 ? 12 : hour - 1
    const nextPeriod = hour === 12 ? (period === 'AM' ? 'PM' : 'AM') : period
    setHour(next)
    setPeriod(nextPeriod)
    onChange(toHHmm(next, minute, nextPeriod))
  }

  function incrementMinute() {
    const next = (minute + 15) % 60
    setMinute(next)
    if (next === 0) {
      // rolled over 45 → 00, advance the hour
      const nextHour = hour === 12 ? 1 : hour + 1
      const nextPeriod = hour === 11 ? (period === 'AM' ? 'PM' : 'AM') : period
      setHour(nextHour)
      setPeriod(nextPeriod)
      onChange(toHHmm(nextHour, next, nextPeriod))
    } else {
      onChange(toHHmm(hour, next, period))
    }
  }

  function decrementMinute() {
    const next = (minute - 15 + 60) % 60
    setMinute(next)
    if (next === 45) {
      // rolled back 00 → 45, retreat the hour
      const nextHour = hour === 1 ? 12 : hour - 1
      const nextPeriod = hour === 12 ? (period === 'AM' ? 'PM' : 'AM') : period
      setHour(nextHour)
      setPeriod(nextPeriod)
      onChange(toHHmm(nextHour, next, nextPeriod))
    } else {
      onChange(toHHmm(hour, next, period))
    }
  }

  function togglePeriod() {
    const next = period === 'AM' ? 'PM' : 'AM'
    setPeriod(next)
    onChange(toHHmm(hour, minute, next))
  }

  const displayText = value ? `${hour}:${String(minute).padStart(2, '0')} ${period}` : null

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

            {/* Colon separator */}
            <div className="timepicker-col timepicker-col-static">
              <span className="timepicker-colon">:</span>
            </div>

            {/* Minute column */}
            <div className="timepicker-col">
              <button className="timepicker-arrow" onClick={incrementMinute}>▲</button>
              <span className="timepicker-value">{String(minute).padStart(2, '0')}</span>
              <button className="timepicker-arrow" onClick={decrementMinute}>▼</button>
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
