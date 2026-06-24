// 7×7 grid of weather points centered on a location.
// Row 0 = northernmost, col 0 = westernmost.
export const GRID_SIZE = 7
export const GRID_RANGE = 0.5 // degrees from center to edge — must cover map viewport at zoom 11

const STEP = GRID_RANGE / 3 // spacing between adjacent points

// [lat, lng] for grid point (row 0 = north, col 0 = west)
export function gridPoint(
  centerLat: number,
  centerLng: number,
  row: number,
  col: number,
): [number, number] {
  return [
    centerLat + (3 - row) * STEP,
    centerLng + (col - 3) * STEP,
  ]
}

// Leaflet ImageOverlay bounds: [[south, west], [north, east]]
export function overlayBounds(
  centerLat: number,
  centerLng: number,
): [[number, number], [number, number]] {
  return [
    [centerLat - GRID_RANGE, centerLng - GRID_RANGE],
    [centerLat + GRID_RANGE, centerLng + GRID_RANGE],
  ]
}

// Convert a geographic coordinate to a fractional grid row (0 = north, 6 = south)
export function latToRow(centerLat: number, lat: number): number {
  return 3 - (lat - centerLat) / STEP
}

// Convert a geographic coordinate to a fractional grid col (0 = west, 6 = east)
export function lngToCol(centerLng: number, lng: number): number {
  return 3 + (lng - centerLng) / STEP
}

// Maps a canvas pixel index (0..size-1) to a grid coordinate (0..GRID_SIZE-1)
export function pixelToGridCoord(pixel: number, size: number): number {
  return (pixel / (size - 1)) * (GRID_SIZE - 1)
}
