# PRD: Static Dashboard UI — Stargazing Planner

## Problem Statement

The app currently renders a blank scaffold with placeholder assets.

## Solution

Implement a static pixel-faithful recreation of the reference dashboard design. The UI shows a left sidebar with location, date, and time context alongside a main content area with a star score hero card and an 8-card metric grid. All values are hardcoded for this phase — no API calls, no user interaction, no dynamic state.


## Implementation Decisions

- **Component architecture**: Three components — `Sidebar`, `StarScoreCard`, and `MetricCard` — plus the top-level `App` layout. Each has its own CSS module.
- **Styling**: Plain CSS modules using the existing scaffold files. No Tailwind or CSS-in-JS.
- **Color palette**: Defined as CSS custom properties on `:root` — white (`#F3F3F3`), grey (`#EFEFEF`), primary (`#1E2B58`), secondary (`#48459A`), grey-text (`#989898`), gradient start (`#2D2359`), gradient end (`#353283`), and four bubble colors (red `#BF0000`, green `#2A9E00`, yellow `#E0E400`, orange `#D67900`).
- **Typography**: Newsreader (serif) for the Star Score numeral and large metric numbers; Inter (sans-serif) for all labels, detail text, and body copy. Both loaded via Google Fonts in `index.html`.
- **Layout**: Percentage-based widths with `max-width: 1240px` and `min-width: 900px` on the outer container, horizontally centered. Sidebar is a fixed-width column; right content fills the remainder.
- **Metric data**: A static typed array defined in `App.tsx`, each entry containing title, score, bubble color, detail strings, and an expand icon flag. The array is mapped over `MetricCard`. Bubble colors are hardcoded per entry.
- **Sidebar elements**: Static `<div>` elements styled to resemble inputs. No `<input>` elements — avoids browser-native widget styling conflicts.
- **Expand icon**: Rendered as a non-interactive `<img>` using `expand_icon.png` from the assets folder. No click handler.
- **Metric grid**: 4-column CSS Grid, 2 rows, matching the reference layout order (Light Pollution, Moon Brightness, Cloud Cover, Precipitation / Darkness Level, Humidity, Dust, Transparency).


## Out of Scope

- Dynamic data fetching from any weather or astronomy API
- User interactions (clicking expand icons, changing location/date/time)
- Responsive design below 900px viewport width
- Bubble color derivation logic (score thresholds, per-metric directionality)
- Accessibility audit (ARIA labels, keyboard navigation)
- Dark/light mode toggling
- Any animation or transition effects

## Further Notes

- The reference image (`src/assets/reference_image.jpg`) is the source of truth for all layout proportions, spacing, and visual hierarchy. When in doubt, match the image.
- The design is sized for a 14" MacBook Pro (1512×982 CSS pixels) but should remain intact at any width above the 900px minimum.
- The three provided icon assets are: `search_icon.png` (sidebar), `calendar_icon.png` (sidebar), `expand_icon.png` (metric cards).
- All static values in the data array are taken directly from the reference image (Denver, CO / 5/31/26 / 10:00 PM / scores as shown).
