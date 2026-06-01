# PRD 2: Live API Integration for Metric Cards

## Problem Statement

The Stargazing Planner currently displays static, hardcoded data for all metric cards. Users have no way to see actual sky conditions for their location and planned observing session. 

## Solution

Integrate two external APIs — IPGeolocation Astronomy and Open-Meteo (Forecast + Air Quality) — to populate six of the eight metric cards with live, location and time-aware data. The Sidebar's Location, Date, and Time inputs become interactive controls that drive all data fetching. Results are cached in localStorage to avoid redundant network requests. The overall Star Score is computed as a weighted average of the six live metrics.


## Implementation Decisions

### Modules

- **Cache Service** — a deep module responsible for reading and writing JSON payloads to localStorage with a TTL. Exposes a simple `get(key)` / `set(key, payload, ttlMs)` interface. All API modules depend on this; nothing else knows about localStorage directly.

- **Astronomy API module** — encapsulates all communication with the IPGeolocation Astronomy API. Cache key includes latitude, longitude, and date; TTL is 24 hours. Returns raw twilight timestamps and moon illumination percentage.

- **Weather Forecast API module** — encapsulates all communication with the Open-Meteo Forecast API. Requests `cloud_cover`, `precipitation_probability`, and `relative_humidity_2m` as hourly arrays. Cache key includes latitude and longitude; TTL is 1 hour. Returns the full multi-day hourly response; callers index into it by the selected date and hour.

- **Air Quality API module** — encapsulates all communication with the Open-Meteo Air Quality API. Requests `pm2_5` as an hourly array. Cache key includes latitude and longitude; TTL is 1 hour. Returns the full multi-day hourly response.

- **Score Utilities** — pure functions with no side effects or I/O. One function per metric converts a raw API value into a `{ score: number, bubble: 'red'|'yellow'|'orange'|'green' }` object. Bubble and score thresholds: ≥75 green, 50–74 yellow, 25–49 orange, <25 red.
  - Cloud Cover, Precipitation, Humidity, Moon Brightness: `score = 100 - value` (percentage inversion)
  - PM2.5: banded — 0–50 maps to 75–100, 50–100 to 50–74, 100–150 to 25–49, 150+ to 0–24
  - Darkness Level: delegated to the Darkness Calculator

- **Darkness Calculator** — pure function that accepts a selected time (HH:MM) and the twilight timestamps from the Astronomy API response, and returns a stepped score: astronomical twilight or later = 100, nautical twilight zone = 70, civil twilight zone = 40, before civil twilight / before sunset = 10.

- **Star Score Calculator** — pure function that accepts the six live metric scores and returns a single weighted average score and bubble color. Weights: Cloud Cover 25%, Moon Brightness 20%, Darkness Level 20%, Precipitation 15%, Humidity 10%, PM2.5 10%.

- **`useStargazingData` hook** — orchestration layer. Accepts the selected location (lat, lng), date, and time. Fires both API groups (astronomy and weather/air quality) when location, date, and time are all non-null. Exposes `{ metrics, starScore, loading, error }`. Time changes are handled client-side without re-fetching.

- **Location Search component** — controlled input that filters `uscities.json` by city name prefix (case-insensitive) and renders a dropdown of up to 10 results formatted as "City, ST". The dropdown only appears after at least 2 characters have been typed. On selection, emits the full city record (including lat, lng, timezone). No external search library; filtering runs in-memory on the imported JSON.

- **Metric Card Detail Text** — the gray detail line on each API-driven card displays the raw API value in a human-readable format rather than the derived score. Each metric has a defined label format: Cloud Cover shows "75% Cloud Cover", Precipitation shows "20% Chance", Humidity shows "65% Humidity", Moon Brightness shows "15% Illuminated", PM2.5 shows "42 µg/m³", and Darkness Level shows the twilight phase name (e.g., "Astronomical Twilight"). Score Utilities are responsible for returning this formatted string alongside the score and bubble color.

- **Sidebar** (modified) — integrates the Location Search component and replaces the static Date and Time displays with custom-styled native `<input type="date">` and `<input type="time">` elements. Lifts selected location, date, and time state up to App.

### API Configuration

- The IPGeolocation API key is stored in the environment variable `VITE_IPGEOLOCATION_API_KEY`. The `.env` file key is renamed from `IPGEOLOCATION_API_KEY` to match.
- Open-Meteo requires no API key.
- The Open-Meteo Forecast and Air Quality APIs are separate base URLs and are fetched independently, each with their own cache entry.

### UI States for API-Driven Cards

- **Pre-fetch** (date or time not yet selected): score displays "--", bubble is gray; a banner below the sidebar reads "Select a date and time to load conditions."
- **Loading**: card body replaced with a static skeleton (no animation).
- **Error**: score displays "--", bubble is gray; a banner below the sidebar describes the API error.
- **Loaded**: normal score and bubble color rendered.

### Score & Color Thresholds (all metrics and Star Score)

| Score range | Bubble color |
|---|---|
| 75–100 | green |
| 50–74 | yellow |
| 25–49 | orange |
| 0–24 | red |


## Out of Scope

- Light Pollution metric API integration
- Transparency metric API integration
- Internationalization or non-US city support
- Backend/server-side caching or rate limiting
- User accounts or saved sessions
- Push notifications or background refresh
- Mobile-responsive layout changes
- Dark mode

## Further Notes

- The `uscities.json` asset is large (~2.8M tokens). The Location Search component should avoid re-running the full filter on every keystroke if performance becomes an issue; debouncing or a `useMemo` boundary are the natural mitigations.
- The Open-Meteo hourly arrays are indexed by hour-of-day. The selected time must be parsed to an integer hour to index correctly; the selected date must be matched against the `time` array entries (ISO 8601 strings) to find the correct day offset.
- IPGeolocation twilight fields to use for Darkness Level: `astronomical_twilight_begin`, `nautical_twilight_begin`, `civil_twilight_begin`, `sun_set` (and their evening counterparts). Confirm exact field names against the live API response before implementation.
