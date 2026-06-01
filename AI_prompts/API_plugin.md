## Initial API Setup

This update is adding in 2 API endpoints to supply the data for the Metric Cards.

Endpoint 1
Documentation: https://ipgeolocation.io/documentation/astronomy-api.html
Api key is listed in .env - IPGEOLOCATION_API_KEY
This should be updated and cached once per day.
Metric Cards
- Moon Brightness (listed as moon_illumination_percentage in the api response)
- Darkness Level (inferred from when time input lands in evening response object)



Endpoint 2
Documentation: https://open-meteo.com/en/docs
Doesn't require an api key
This should be updated and cached hourly.
Dust is in the Air quality api while the rest are in the weather forecast.
Metric Cards
- Cloud Cover (using cloud_cover)
- Precipitation (using precipitation_probability)
- Dust (using dust)
- Humidity (using relative_humidity_2m)