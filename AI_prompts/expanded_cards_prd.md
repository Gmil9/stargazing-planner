# PRD: Expanded Metric Cards

## Problem Statement

When planning a stargazing session, users see metric cards (Cloud Cover, Moon Brightness, Darkness Level, etc.) showing only a score and a one-line detail. This is not enough information to make informed decisions — a user who sees a yellow Humidity score has no way to know whether dew formation on their optics is a real risk, or what specific atmospheric factors are dragging down the Transparency score. The data exists in the APIs we already call, but it is hidden.

## Solution

Each metric card (and the Star Score card) can be expanded by tapping or clicking it. The expanded card grows from its original position to fill the metric card grid area as an overlay. It shows a richer, card-specific view: maps, diagrams, multi-field readouts, and contextual labels. Tapping the card again, clicking a collapse icon, or clicking the backdrop all close it.

## User Stories

1. As a stargazer, I want to expand a metric card to fill the card grid area, so that I can see detailed information without leaving the main view.
2. As a stargazer, I want the expanded card to animate smoothly from the card I tapped, so that the transition feels connected and not jarring.
3. As a stargazer, I want to collapse the expanded card by tapping anywhere on it, so that I can quickly return to the overview.
4. As a stargazer, I want to collapse the expanded card by clicking a backdrop behind it, so that the gesture is obvious and discoverable.
5. As a stargazer, I want a collapse icon in the corner of the expanded card, so that I know the card is interactive even before I discover tap-to-close.
6. As a stargazer, I want only one card to be expanded at a time, so that the UI stays uncluttered.
7. As a stargazer, I want the hover popups to disappear while a card is expanded, so that they do not obscure the expanded content.
8. As a stargazer, I want to expand the Star Score card to see the full content area, so that when the future map feature is added I will have space for it.
9. As a stargazer, I want a styled placeholder in the expanded Star Score card, so that the card looks intentional rather than broken while the map feature is pending.
10. As a stargazer, I want to expand the Light Pollution card to see a larger version of the light pollution map, so that I can see the pollution gradient across a wider area.
11. As a stargazer, I want to expand the Moon Brightness card to see the current moon phase image, so that I have a visual reference for how much the moon will light up the sky.
12. As a stargazer, I want the expanded Moon Brightness card to show the phase name and illumination percentage, so that I know exactly what phase I am dealing with.
13. As a stargazer, I want the expanded Moon Brightness card to show moon altitude and azimuth, so that I know where in the sky to expect the moon.
14. As a stargazer, I want the expanded Moon Brightness card to show moonrise and moonset times, so that I can plan around the moon being above the horizon.
15. As a stargazer, I want the expanded Moon Brightness card to show the next phase date and name, so that I can plan a future session around a better moon phase.
16. As a stargazer, I want NASA's Scientific Visualization Studio credited on the moon phase images, so that proper attribution is given.
17. As a stargazer, I want to expand the Cloud Cover card to see a regional heatmap, so that I can tell whether driving a short distance would put me under clearer skies.
18. As a stargazer, I want the Cloud Cover map to be centered on my selected location, so that the map is immediately relevant to where I am.
19. As a stargazer, I want to expand the Precipitation card to see a similar regional heatmap to Cloud Cover, so that I can spot nearby areas with lower rain probability.
20. As a stargazer, I want to expand the Darkness Level card to see a diagram of the sun's position relative to the horizon, so that I can visualize how deep into darkness I am.
21. As a stargazer, I want the Darkness Level diagram to show the current twilight stage label and the time until the next twilight stage, so that I can plan my setup around true darkness arriving.
22. As a stargazer, I want the Darkness Level diagram to show the time until true dark (astronomical twilight end), so that I know the exact countdown to prime conditions.
23. As a stargazer, I want to expand the Humidity card to see relative humidity, dew point, and vapour pressure deficit, so that I understand the full moisture picture.
24. As a stargazer, I want the Humidity card to show the dew point spread (temperature minus dew point), so that I know whether my optics are at risk of fogging.
25. As a stargazer, I want the Humidity card to show a subtle inline warning label when the dew point spread is below 5°F, so that I am alerted to lens/mirror fogging risk without a dramatic alarm.
26. As a stargazer, I want to expand the Smoke card to see dust concentration, aerosol optical depth, PM10, and PM2.5 readings, so that I understand how much atmospheric particulate matter is affecting sky transparency.
27. As a stargazer, I want the Smoke card to highlight aerosol optical depth as the primary astronomical metric, so that I understand which value matters most for sky transparency.
28. As a stargazer, I want to expand the Transparency card to see a breakdown of each contributing factor (cloud cover, humidity, temperature, dew point spread, visibility) with its current value and a qualitative label, so that I understand why the Transparency score is what it is.
29. As a stargazer using a phone, I want expanded cards to match the rendered size of the metric card grid on my screen, so that the overlay does not overflow or look broken on small screens.

## Implementation Decisions

### Modules to build or modify

**ExpandedCardOverlay (new component)**
A fixed-position overlay that sits above the metric card grid. Receives the identity of the currently-expanded card and the full raw data objects from the app root. Animates in using a CSS transform transition originating from the clicked card's bounding rect. Renders a backdrop div behind itself that dismisses on click. Switches on card title to render the appropriate card-specific content component. Contains the collapse icon.

**Per-card expanded content components (new, one per card)**
Each is a self-contained component receiving only the raw data it needs:
- `StarScoreExpanded` — header + styled placeholder for future map
- `LightPollutionExpanded` — enlarged canvas using the existing light pollution map renderer
- `MoonBrightnessExpanded` — phase image, phase metadata readouts, NASA credit
- `CloudCoverExpanded` — 7×7 canvas heatmap, Open-Meteo batch coordinate request
- `PrecipitationExpanded` — same heatmap pattern as CloudCoverExpanded, precipitation_probability field
- `DarknessLevelExpanded` — SVG full-circle diagram with horizon line through center, sun dot on circumference at altitude angle, twilight stage labels and countdowns
- `HumidityExpanded` — four readout rows, dew point spread row with conditional "Dew risk" label in muted amber when spread < 5°F
- `SmokeExpanded` — four readout rows, AOD highlighted as primary metric
- `TransparencyExpanded` — five-row breakdown showing each scoreTransparency input with its live value and a qualitative label

**MetricCard (modified)**
Add an `onExpand` callback prop. The component remains stateless; it fires the callback and the parent manages state.

**StarScoreCard (modified)**
Add an `onExpand` callback prop mirroring MetricCard.

**App root (modified)**
- Holds `expandedCard: string | null` state
- Holds a ref on the metric card grid container (for target bounding rect)
- Holds a ref on the full content area container (for Star Score target rect)
- Passes `onExpand` down to each card
- Renders `ExpandedCardOverlay` conditionally
- Adds `cards-expanded` CSS class to the metric card grid when any card is open (disables all hover popups via a single CSS rule)

**Astronomy API service (modified)**
Parse and store additional moon fields from the existing IPGeolocation v3 endpoint: moon altitude, moon azimuth, moonrise, moonset, moon phase name, next phase date, next phase name. Extend `IAstronomyData` type accordingly.

**Weather API service (modified)**
Add `vapour_pressure_deficit` to the existing Open-Meteo hourly parameters. Extend `IWeatherData` type.

**Air Quality API service (modified)**
Add `dust`, `aerosol_optical_depth`, `pm10` to the existing Open-Meteo air quality parameters. Extend `IAirQualityData` type.

### Key architectural decisions

- **Overlay, not reflow** — the expanded card is a new DOM layer positioned absolutely over the grid. Underlying cards are not reflowed.
- **Dynamic animation origin** — on click, the card's `getBoundingClientRect()` is captured and stored alongside `expandedCard`. The overlay starts its CSS transform from those coordinates and transitions to the target rect.
- **Two target rects** — Star Score expands to the full content area rect; all metric cards expand to the metric card grid rect. Both rects are measured via refs at click time.
- **No new dependencies** — animation via CSS `transform` + `transition`. No Framer Motion or WAAPI.
- **Popup disable via CSS class** — a single `cards-expanded` class on the grid parent combined with one CSS descendant rule disables all hover popups. No prop threading required.
- **Raw data owned by App root** — `ExpandedCardOverlay` and its children receive raw `IAstronomyData`, `IWeatherData`, `IAirQualityData`, `ILightPollutionData`, and location coordinates directly from the app root. `IMetricCard` is not extended.
- **Cloud/Precipitation map grid** — 7×7 sample points (49 coordinates), ±1° lat/lng bounding box, single batched Open-Meteo request per render, drawn to canvas.
- **Moon phase image mapping** — derived from illumination percentage and waxing/waning direction from API. Eight phase images already present in assets.

## Out of Scope

- The map inside the expanded Star Score card (planned for a future update; this PRD covers the placeholder only)
- Interaction within the cloud cover and precipitation maps (static display only for now)
- Accessibility / keyboard navigation of expanded cards
- Any animation beyond the open/close CSS transition (no stagger, no spring physics)

## Further Notes

- The IPGeolocation v3 endpoint already returns all needed moon fields; the current parser discards them. The extended fields should be verified against a live API response during implementation.
- The card title "Smoke" (not "Dust") is the canonical name used throughout the codebase.
- Moon phase images are already present in `src/assets/MoonPhases/` with eight filenames covering the full lunar cycle.
- NASA's Scientific Visualization Studio must be credited on the moon phase images as specified in the plan.
