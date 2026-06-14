import { describe, it, expect } from 'vitest'
import { GRID_RANGE, GRID_SIZE, gridPoint, overlayBounds, pixelToGridCoord, latToRow, lngToCol } from '../regionalGrid'

const LAT = 40.7128  // NYC
const LNG = -74.006

// ---------------------------------------------------------------------------
// gridPoint
// ---------------------------------------------------------------------------

describe('gridPoint – coordinate values', () => {
  it('center (row=3, col=3) is exactly the city location', () => {
    const [lat, lng] = gridPoint(LAT, LNG, 3, 3)
    expect(lat).toBeCloseTo(LAT)
    expect(lng).toBeCloseTo(LNG)
  })

  it('row 0 is GRID_RANGE north of center', () => {
    const [lat] = gridPoint(LAT, LNG, 0, 3)
    expect(lat).toBeCloseTo(LAT + GRID_RANGE)
  })

  it('row 6 is GRID_RANGE south of center', () => {
    const [lat] = gridPoint(LAT, LNG, 6, 3)
    expect(lat).toBeCloseTo(LAT - GRID_RANGE)
  })

  it('col 0 is GRID_RANGE west of center', () => {
    const [, lng] = gridPoint(LAT, LNG, 3, 0)
    expect(lng).toBeCloseTo(LNG - GRID_RANGE)
  })

  it('col 6 is GRID_RANGE east of center', () => {
    const [, lng] = gridPoint(LAT, LNG, 3, 6)
    expect(lng).toBeCloseTo(LNG + GRID_RANGE)
  })
})

describe('gridPoint – directionality', () => {
  it('latitude decreases as row increases (north → south)', () => {
    for (let row = 0; row < 6; row++) {
      const [lat0] = gridPoint(LAT, LNG, row, 3)
      const [lat1] = gridPoint(LAT, LNG, row + 1, 3)
      expect(lat0).toBeGreaterThan(lat1)
    }
  })

  it('longitude increases as col increases (west → east)', () => {
    for (let col = 0; col < 6; col++) {
      const [, lng0] = gridPoint(LAT, LNG, 3, col)
      const [, lng1] = gridPoint(LAT, LNG, 3, col + 1)
      expect(lng1).toBeGreaterThan(lng0)
    }
  })

  it('adjacent rows are evenly spaced by GRID_RANGE/3', () => {
    const step = GRID_RANGE / 3
    for (let row = 0; row < 6; row++) {
      const [lat0] = gridPoint(LAT, LNG, row, 0)
      const [lat1] = gridPoint(LAT, LNG, row + 1, 0)
      expect(lat0 - lat1).toBeCloseTo(step)
    }
  })

  it('adjacent cols are evenly spaced by GRID_RANGE/3', () => {
    const step = GRID_RANGE / 3
    for (let col = 0; col < 6; col++) {
      const [, lng0] = gridPoint(LAT, LNG, 0, col)
      const [, lng1] = gridPoint(LAT, LNG, 0, col + 1)
      expect(lng1 - lng0).toBeCloseTo(step)
    }
  })
})

// ---------------------------------------------------------------------------
// overlayBounds
// ---------------------------------------------------------------------------

describe('overlayBounds – extent', () => {
  const [[south, west], [north, east]] = overlayBounds(LAT, LNG)

  it('south bound is GRID_RANGE south of center', () => expect(south).toBeCloseTo(LAT - GRID_RANGE))
  it('north bound is GRID_RANGE north of center', () => expect(north).toBeCloseTo(LAT + GRID_RANGE))
  it('west bound is GRID_RANGE west of center',   () => expect(west).toBeCloseTo(LNG - GRID_RANGE))
  it('east bound is GRID_RANGE east of center',   () => expect(east).toBeCloseTo(LNG + GRID_RANGE))
})

describe('overlayBounds – grid corner alignment', () => {
  const [[south, west], [north, east]] = overlayBounds(LAT, LNG)

  it('NW grid corner (row=0, col=0) matches NW overlay corner', () => {
    const [lat, lng] = gridPoint(LAT, LNG, 0, 0)
    expect(lat).toBeCloseTo(north)
    expect(lng).toBeCloseTo(west)
  })

  it('NE grid corner (row=0, col=6) matches NE overlay corner', () => {
    const [lat, lng] = gridPoint(LAT, LNG, 0, 6)
    expect(lat).toBeCloseTo(north)
    expect(lng).toBeCloseTo(east)
  })

  it('SW grid corner (row=6, col=0) matches SW overlay corner', () => {
    const [lat, lng] = gridPoint(LAT, LNG, 6, 0)
    expect(lat).toBeCloseTo(south)
    expect(lng).toBeCloseTo(west)
  })

  it('SE grid corner (row=6, col=6) matches SE overlay corner', () => {
    const [lat, lng] = gridPoint(LAT, LNG, 6, 6)
    expect(lat).toBeCloseTo(south)
    expect(lng).toBeCloseTo(east)
  })
})

// ---------------------------------------------------------------------------
// pixelToGridCoord
// ---------------------------------------------------------------------------

describe('pixelToGridCoord', () => {
  const SIZE = 256

  it('pixel 0 maps to grid coord 0', () => {
    expect(pixelToGridCoord(0, SIZE)).toBe(0)
  })

  it('last pixel maps to grid coord GRID_SIZE-1', () => {
    expect(pixelToGridCoord(SIZE - 1, SIZE)).toBe(GRID_SIZE - 1)
  })

  it('middle pixel maps to grid center (3.0)', () => {
    expect(pixelToGridCoord((SIZE - 1) / 2, SIZE)).toBeCloseTo(3)
  })

  it('coord increases monotonically with pixel', () => {
    for (let px = 0; px < SIZE - 1; px++) {
      expect(pixelToGridCoord(px + 1, SIZE)).toBeGreaterThan(pixelToGridCoord(px, SIZE))
    }
  })
})

// ---------------------------------------------------------------------------
// Canvas pixel → geographic coordinate (end-to-end alignment)
// ---------------------------------------------------------------------------

describe('canvas pixel → geographic coordinate alignment', () => {
  const SIZE = 256
  const [[south, west], [north, east]] = overlayBounds(LAT, LNG)

  it('left canvas edge maps to west overlay bound', () => {
    const col = pixelToGridCoord(0, SIZE)
    const [, lng] = gridPoint(LAT, LNG, 3, col)
    expect(lng).toBeCloseTo(west)
  })

  it('right canvas edge maps to east overlay bound', () => {
    const col = pixelToGridCoord(SIZE - 1, SIZE)
    const [, lng] = gridPoint(LAT, LNG, 3, col)
    expect(lng).toBeCloseTo(east)
  })

  it('top canvas edge maps to north overlay bound', () => {
    const row = pixelToGridCoord(0, SIZE)
    const [lat] = gridPoint(LAT, LNG, row, 3)
    expect(lat).toBeCloseTo(north)
  })

  it('bottom canvas edge maps to south overlay bound', () => {
    const row = pixelToGridCoord(SIZE - 1, SIZE)
    const [lat] = gridPoint(LAT, LNG, row, 3)
    expect(lat).toBeCloseTo(south)
  })

  it('center canvas pixel maps to the city coordinates', () => {
    const mid = (SIZE - 1) / 2
    const [lat, lng] = gridPoint(LAT, LNG, pixelToGridCoord(mid, SIZE), pixelToGridCoord(mid, SIZE))
    expect(lat).toBeCloseTo(LAT)
    expect(lng).toBeCloseTo(LNG)
  })

  it('longitude increases left→right across the canvas', () => {
    const lngs = [0, 64, 128, 192, 255].map(
      (px) => gridPoint(LAT, LNG, 3, pixelToGridCoord(px, SIZE))[1]
    )
    for (let i = 0; i < lngs.length - 1; i++) {
      expect(lngs[i + 1]).toBeGreaterThan(lngs[i])
    }
  })

  it('latitude decreases top→bottom down the canvas', () => {
    const lats = [0, 64, 128, 192, 255].map(
      (py) => gridPoint(LAT, LNG, pixelToGridCoord(py, SIZE), 3)[0]
    )
    for (let i = 0; i < lats.length - 1; i++) {
      expect(lats[i + 1]).toBeLessThan(lats[i])
    }
  })
})

// ---------------------------------------------------------------------------
// latToRow / lngToCol — inverse of gridPoint
// ---------------------------------------------------------------------------

describe('latToRow', () => {
  it('center lat maps to row 3', () => {
    expect(latToRow(LAT, LAT)).toBeCloseTo(3)
  })

  it('northernmost lat (center + GRID_RANGE) maps to row 0', () => {
    expect(latToRow(LAT, LAT + GRID_RANGE)).toBeCloseTo(0)
  })

  it('southernmost lat (center − GRID_RANGE) maps to row 6', () => {
    expect(latToRow(LAT, LAT - GRID_RANGE)).toBeCloseTo(6)
  })

  it('row increases as lat decreases (north→south)', () => {
    for (let row = 0; row < 6; row++) {
      const [lat0] = gridPoint(LAT, LNG, row, 3)
      const [lat1] = gridPoint(LAT, LNG, row + 1, 3)
      expect(latToRow(LAT, lat0)).toBeCloseTo(row)
      expect(latToRow(LAT, lat1)).toBeCloseTo(row + 1)
    }
  })

  it('is the inverse of gridPoint latitude', () => {
    for (let row = 0; row <= 6; row++) {
      const [lat] = gridPoint(LAT, LNG, row, 3)
      expect(latToRow(LAT, lat)).toBeCloseTo(row)
    }
  })
})

describe('lngToCol', () => {
  it('center lng maps to col 3', () => {
    expect(lngToCol(LNG, LNG)).toBeCloseTo(3)
  })

  it('westernmost lng (center − GRID_RANGE) maps to col 0', () => {
    expect(lngToCol(LNG, LNG - GRID_RANGE)).toBeCloseTo(0)
  })

  it('easternmost lng (center + GRID_RANGE) maps to col 6', () => {
    expect(lngToCol(LNG, LNG + GRID_RANGE)).toBeCloseTo(6)
  })

  it('col increases as lng increases (west→east)', () => {
    for (let col = 0; col < 6; col++) {
      const [, lng0] = gridPoint(LAT, LNG, 3, col)
      const [, lng1] = gridPoint(LAT, LNG, 3, col + 1)
      expect(lngToCol(LNG, lng0)).toBeCloseTo(col)
      expect(lngToCol(LNG, lng1)).toBeCloseTo(col + 1)
    }
  })

  it('is the inverse of gridPoint longitude', () => {
    for (let col = 0; col <= 6; col++) {
      const [, lng] = gridPoint(LAT, LNG, 3, col)
      expect(lngToCol(LNG, lng)).toBeCloseTo(col)
    }
  })
})

// ---------------------------------------------------------------------------
// renderOverlay coordinate chain: map pixel → lat/lng → grid coord
// These tests verify that the overlay-fills-map approach correctly maps
// pixels at the map's viewport edges to the corresponding grid coordinates.
// ---------------------------------------------------------------------------

describe('renderOverlay coordinate chain', () => {
  const SIZE = 256
  // Simulate a map viewport that is smaller than the data grid (typical at zoom 11)
  const MAP_HALF = GRID_RANGE * 0.5 // map shows half the data range in each direction
  const mapBounds: [[number, number], [number, number]] = [
    [LAT - MAP_HALF, LNG - MAP_HALF],
    [LAT + MAP_HALF, LNG + MAP_HALF],
  ]
  const [[south, west], [north, east]] = mapBounds

  const pixelToGeo = (px: number, py: number) => ({
    lat: north - (py / (SIZE - 1)) * (north - south),
    lng: west  + (px / (SIZE - 1)) * (east  - west),
  })

  it('top-left pixel maps to a grid coord within the valid range', () => {
    const { lat, lng } = pixelToGeo(0, 0)
    const gy = latToRow(LAT, lat)
    const gx = lngToCol(LNG, lng)
    expect(gy).toBeGreaterThanOrEqual(0)
    expect(gy).toBeLessThanOrEqual(6)
    expect(gx).toBeGreaterThanOrEqual(0)
    expect(gx).toBeLessThanOrEqual(6)
  })

  it('center pixel maps to grid center (row=3, col=3)', () => {
    const mid = (SIZE - 1) / 2
    const { lat, lng } = pixelToGeo(mid, mid)
    expect(latToRow(LAT, lat)).toBeCloseTo(3)
    expect(lngToCol(LNG, lng)).toBeCloseTo(3)
  })

  it('longitude increases left→right across pixels', () => {
    const lngs = [0, 64, 128, 192, 255].map((px) => pixelToGeo(px, 128).lng)
    for (let i = 0; i < lngs.length - 1; i++) {
      expect(lngs[i + 1]).toBeGreaterThan(lngs[i])
    }
  })

  it('latitude decreases top→bottom across pixels', () => {
    const lats = [0, 64, 128, 192, 255].map((py) => pixelToGeo(128, py).lat)
    for (let i = 0; i < lats.length - 1; i++) {
      expect(lats[i + 1]).toBeLessThan(lats[i])
    }
  })

  it('col increases left→right', () => {
    const cols = [0, 64, 128, 192, 255].map((px) => lngToCol(LNG, pixelToGeo(px, 128).lng))
    for (let i = 0; i < cols.length - 1; i++) {
      expect(cols[i + 1]).toBeGreaterThan(cols[i])
    }
  })

  it('row increases top→bottom', () => {
    const rows = [0, 64, 128, 192, 255].map((py) => latToRow(LAT, pixelToGeo(128, py).lat))
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i + 1]).toBeGreaterThan(rows[i])
    }
  })
})

// ---------------------------------------------------------------------------
// Bilinear interpolation (inline, mirrors RegionalHeatmap implementation)
// ---------------------------------------------------------------------------

function bilinear(grid: number[][], gx: number, gy: number): number {
  const x0 = Math.floor(gx), y0 = Math.floor(gy)
  const x1 = Math.min(x0 + 1, 6), y1 = Math.min(y0 + 1, 6)
  const fx = gx - x0, fy = gy - y0
  return (
    (1 - fx) * (1 - fy) * grid[y0][x0] +
    fx       * (1 - fy) * grid[y0][x1] +
    (1 - fx) * fy       * grid[y1][x0] +
    fx       * fy       * grid[y1][x1]
  )
}

const zeros = Array.from({ length: 7 }, () => Array<number>(7).fill(0))
const full  = Array.from({ length: 7 }, () => Array<number>(7).fill(100))

describe('bilinear interpolation', () => {
  it('uniform zero grid returns 0 everywhere', () => {
    expect(bilinear(zeros, 0, 0)).toBe(0)
    expect(bilinear(zeros, 3, 3)).toBe(0)
    expect(bilinear(zeros, 2.5, 4.7)).toBe(0)
  })

  it('uniform 100 grid returns 100 everywhere', () => {
    expect(bilinear(full, 0, 0)).toBe(100)
    expect(bilinear(full, 6, 6)).toBe(100)
    expect(bilinear(full, 1.1, 2.9)).toBe(100)
  })

  it('returns exact corner values at integer grid positions', () => {
    const grid = Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 7 }, (_, col) => row * 10 + col)
    )
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        expect(bilinear(grid, col, row)).toBe(row * 10 + col)
      }
    }
  })

  it('midpoint between two adjacent values is their average', () => {
    const grid = Array.from({ length: 7 }, () => Array<number>(7).fill(0))
    grid[0][0] = 0
    grid[0][1] = 100
    expect(bilinear(grid, 0.5, 0)).toBeCloseTo(50)
  })

  it('values are bounded by surrounding grid points', () => {
    const grid = Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 7 }, (_, col) => (row + col) * 10)
    )
    for (let gy = 0; gy <= 6; gy += 0.5) {
      for (let gx = 0; gx <= 6; gx += 0.5) {
        const val = bilinear(grid, gx, gy)
        const x0 = Math.floor(gx), y0 = Math.floor(gy)
        const x1 = Math.min(x0 + 1, 6), y1 = Math.min(y0 + 1, 6)
        const min = Math.min(grid[y0][x0], grid[y0][x1], grid[y1][x0], grid[y1][x1])
        const max = Math.max(grid[y0][x0], grid[y0][x1], grid[y1][x0], grid[y1][x1])
        expect(val).toBeGreaterThanOrEqual(min)
        expect(val).toBeLessThanOrEqual(max)
      }
    }
  })
})
