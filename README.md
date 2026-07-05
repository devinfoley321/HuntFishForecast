# Southern Ohio Hunt & Fish Forecast

A comprehensive web application that helps hunters and fishermen determine the best times for outdoor activities in Southern Ohio. The app combines multiple factors including weather conditions, barometric pressure, and solunar theory to provide intelligent recommendations.

## Features

### 🎯 Current Conditions Analysis
- Real-time activity score (0-100) based on multiple factors
- Clear recommendations: Excellent, Good, Fair, or Poor conditions
- Detailed breakdown of current weather, pressure, moon phase, and solunar periods

### 📊 Multi-Factor Scoring System
The app analyzes and weighs the following factors:

1. **Temperature (20% weight)** - Optimal ranges for Southern Ohio wildlife
   - Best: 45-65°F
   - Good: 35-75°F
   
2. **Barometric Pressure (25% weight)** - Most important factor
   - Tracks current pressure and 3-hour trend
   - Rising pressure = excellent conditions
   - High steady pressure = very good
   - Falling pressure from high = good (pre-frontal feeding)
   
3. **Weather Conditions (20% weight)**
   - Clear to partly cloudy = best
   - Overcast = good for deer
   - Rain/storms = poor
   
4. **Wind Speed (15% weight)**
   - 5-12 mph = perfect (masks movement)
   - 0-5 mph = very good
   - 25+ mph = poor
   
5. **Solunar Theory (20% weight)**
   - Moon phase influence (New/Full moon = best)
   - Major feeding periods (moon overhead/underfoot)
   - Minor feeding periods (moonrise/moonset)

### 🌙 Solunar Period Tracking
- Displays 4 daily periods: 2 Major and 2 Minor
- Major periods: ~3 hours (1.5 hours before/after peak)
- Minor periods: ~1.5 hours (45 minutes before/after peak)
- Highlights active periods in real-time

### 📅 7-Day Forecast
- Daily activity scores
- Expandable hourly breakdown for each day
- Hour-by-hour scores showing the best times
- Visual color coding: Green (Excellent), Blue (Good), Yellow (Fair), Red (Poor)

### 🗺️ Location Flexibility
- Default: Cincinnati, OH
- Can search any Southern Ohio city
- Uses geocoding to find coordinates

## How to Use

1. **Open the App**
   - Simply open `index.html` in any modern web browser
   - No installation or server required!

2. **View Current Conditions**
   - See the overall activity score at the top
   - Read the recommendation and detailed analysis
   - Check current weather, pressure trend, moon phase, and solunar periods

3. **Check the Forecast**
   - Scroll down to see the 7-day forecast
   - Each day shows an overall score
   - Click any day to expand and see hour-by-hour breakdown

4. **Change Location**
   - Enter a different Southern Ohio city in the location input
   - Click "Update Location" or press Enter
   - Examples: "Cincinnati", "Columbus", "Portsmouth", "Athens"

## Technical Details

### Data Sources
- **Weather Data**: Open-Meteo API (free, no API key required)
  - Current conditions with barometric pressure
  - Hourly forecasts
  - 7-day daily forecasts
  
- **Solunar Calculations**: Custom algorithm based on astronomical calculations
  - Moon phase calculations
  - Moon position (transit, rise, set)
  - Major and minor period predictions

### Files Structure
```
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── weather.js      # Weather API integration
├── solunar.js      # Moon phase and solunar calculations
├── scoring.js      # Scoring algorithm
├── app.js          # Main application logic and UI updates
└── README.md       # This file
```

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on desktop, tablet, and mobile

## Understanding the Scores

### Excellent (85-100)
🟢 Prime hunting/fishing time! Multiple factors are perfectly aligned. Get out there!

### Good (70-84)
🔵 Favorable conditions. You should see decent activity. Worth the trip.

### Fair (50-69)
🟡 Mediocre conditions. Some activity possible but not ideal. Go if you have time.

### Poor (0-49)
🔴 Unfavorable conditions. Low activity expected. Better to wait or adjust strategy.

## Tips for Best Results

1. **Pay Attention to Pressure Trends**
   - Rising pressure after a storm = excellent
   - Falling pressure (storm approaching) = animals feed heavily
   
2. **Use Solunar Periods**
   - Plan your trips during Major periods when possible
   - Minor periods are secondary but still good
   
3. **Consider Multiple Factors**
   - A high score means multiple factors align
   - One negative factor may be outweighed by others
   
4. **Check Hourly Breakdown**
   - Some days have specific "golden hours"
   - Plan your timing for peak activity periods

## Southern Ohio Specific

The app is optimized for Southern Ohio's climate and wildlife:
- Temperature ranges suitable for white-tailed deer
- Fish species common in Ohio rivers and lakes
- Seasonal weather patterns of the region

## Limitations

- Solunar calculations are simplified (not full astronomical precision)
- Weather forecasts are as accurate as the API data
- Actual animal behavior varies by many factors not captured here
- Always check local hunting/fishing regulations
- Safety should always be your first priority

## Future Enhancements

Potential improvements:
- Historical data and trends
- Specific species recommendations (deer vs. fish)
- Sunrise/sunset times
- Wind direction analysis (for scent control)
- Save favorite locations
- Push notifications for excellent conditions

## License

This is a personal project created for educational and recreational purposes.

## Disclaimer

This app provides predictions based on known factors affecting wildlife activity. Actual results may vary. Always follow local regulations, practice safety, and respect wildlife and the environment.

---

**Good luck and tight lines! 🦌🎣**
