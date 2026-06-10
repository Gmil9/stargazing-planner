## Plan Overview

This update I want to add the feature of expanding the metric cards in order to see more details.
All 8 will be able to expand, covering the entire area of the metric cards.
The star score card can also expand, covering all the metric cards.

2 Reference Images have been added, one for the star score card and one for the metric cards.


## To Do
- Add expanded view for all the cards
    - Includes the name, color bubble, score, and a description at the top
- Animates from small to large card, as if its growing or shrinking to each size.
- Tapping/Clicking anywhere on the card can expand it or shrink it.
- The description for the expanded metric cards is the same as the popups. The popups should be disabled while expanded.



## Content
- Star Score
    - Future update: add a placeholder for a map to be added that fills the main content space.
- Light Pollution
    - Larger version of the current pollution map.
    - Size is whatever fits in the expanded view. Could change based on screen size.
- Moon Brightness (All information in IPGeolocation API)
    - Image of the current moon phase. (Assets contain all moon phase images)
    - Title of the moon phase
    - moon altitude
    - moon azimuth
    - moon rise and set times
    - illumination percentage
    - next phase date and next phase title
    - Give credit for the image sources to this: NASA's Scientific Visualization Studio
- Cloud Cover
    - Create a cloud cover map.
    - Static map based around coordinates from location and time. No interaction enabled yet.
    - Data is from open-meteo api
        - you can batch call a chunk of coordinates, Open-Meteo supports comma-separated lat/lng arrays in a single request 
- Precipitation
    - same as cloud cover except using precipitation_probability
- Darkness Level
    - Visual of the horizon, where the sun is at, and the angle degrees below horizon
    - Title of the current twilight level
    - Time until next level
    - Time until True dark
- Humidity
    - no map, detailed readouts
    - relative_humidity_2m — the standard %, hourly
    - dewpoint_2m — arguably more useful for stargazing (dew point tells you when optics will fog)
    - vapour_pressure_deficit — how "thirsty" the air is; low VPD = humid, high = dry
    - The dew point spread (temperature minus dew point) is the key derived metric — if that spread is less than ~5°F you're at real risk of dew forming on your lenses/mirror. 
- Dust
    - no map, detailed readouts
    - dust — Saharan dust in μg/m³, at surface level (most relevant)
    - aerosol_optical_depth — total atmospheric particle load, which directly affects sky transparency for stargazing
    - pm10 / pm2_5 — general particulate matter, less specific to dust
    - aerosol_optical_depth (AOD) is actually the most astronomically meaningful one — it's what astronomers use to quantify how much light is scattered before it reaches you. Low AOD = transparent sky.
- Transparency
    - Detailed version of what the popup is
    - explaining the combination of humidity, temperature, dew point, visibility, and cloud cover and what those current values are.