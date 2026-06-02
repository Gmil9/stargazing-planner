import { useState, useMemo } from 'react'
import searchIcon from '../assets/search_icon.png'
import type { ICity } from '../types'
import './LocationSearch.css'

interface LocationSearchProps {
  value: ICity
  onChange: (city: ICity) => void
}

import citiesRaw from '../assets/uscities.json'
const cities = citiesRaw as unknown as ICity[]

export default function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const suggestions = useMemo(() => {
    if (query.length < 2) return []
    const lower = query.toLowerCase()
    return cities.filter((c) => c.city.toLowerCase().startsWith(lower)).slice(0, 10)
  }, [query])

  function handleSelect(city: ICity) {
    onChange(city as ICity)
    setQuery('')
    setIsOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
      setQuery('')
    }, 150)
  }

  const displayValue = isOpen ? query : `${value.city}, ${value.state_id}`

  return (
    <div className="location-search">
      <img src={searchIcon} className="sidebar-icon" alt="" />
      <input
        className="location-search-input"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder="Search city..."
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="location-search-dropdown">
          {suggestions.map((city) => (
            <li
              key={`${city.city}-${city.state_id}-${city.lat}`}
              onMouseDown={() => handleSelect(city)}
              className="location-search-option"
            >
              {city.city}, {city.state_id}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
