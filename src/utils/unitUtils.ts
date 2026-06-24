export function cToF(c: number): number {
  return c * 9 / 5 + 32
}

// For temperature differences (spreads), no offset — just scale
export function deltaCToF(delta: number): number {
  return delta * 9 / 5
}

export function mToMi(m: number): number {
  return m / 1609.344
}
