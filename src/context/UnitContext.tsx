import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type UnitSystem = 'metric' | 'imperial'

interface UnitContextValue {
  units: UnitSystem
  setUnits: (u: UnitSystem) => void
}

const UnitContext = createContext<UnitContextValue>({
  units: 'metric',
  setUnits: () => {},
})

export function UnitProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<UnitSystem>('metric')
  return <UnitContext.Provider value={{ units, setUnits }}>{children}</UnitContext.Provider>
}

export function useUnits(): UnitContextValue {
  return useContext(UnitContext)
}
