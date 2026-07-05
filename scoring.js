// Scoring Algorithm Module
// Combines weather, barometric pressure, and solunar data to score hunting/fishing conditions

class HuntFishScorer {
    constructor() {
        this.solunarCalc = new SolunarCalculator();
    }

    // Main scoring function for current conditions
    scoreCurrentConditions(weatherData, latitude, longitude) {
        const now = new Date();
        
        let score = 0;
        const factors = {
            temperature: 0,
            pressure: 0,
            weather: 0,
            wind: 0,
            solunar: 0
        };

        // Temperature scoring (optimal for deer/fish in Southern Ohio)
        factors.temperature = this.scoreTemperature(weatherData.current.temperature);
        
        // Barometric pressure scoring
        factors.pressure = this.scorePressure(
            weatherData.current.pressure,
            weatherData.current.pressureTrend.trend
        );
        
        // Weather conditions scoring
        factors.weather = this.scoreWeatherConditions(
            weatherData.current.weatherCode,
            weatherData.current.precipitation
        );
        
        // Wind scoring
        factors.wind = this.scoreWind(weatherData.current.windSpeed);
        
        // Solunar scoring
        factors.solunar = this.solunarCalc.getSolunarRating(now, latitude, longitude);

        // Calculate weighted total (out of 100)
        score = (
            factors.temperature * 0.20 +  // 20% weight
            factors.pressure * 0.25 +       // 25% weight - very important
            factors.weather * 0.20 +        // 20% weight
            factors.wind * 0.15 +           // 15% weight
            factors.solunar * 0.20          // 20% weight
        );

        return {
            totalScore: Math.round(score),
            factors: factors,
            recommendation: this.getRecommendation(score),
            details: this.getDetailedAnalysis(factors, weatherData)
        };
    }

    // Score hourly conditions
    scoreHourlyConditions(hourData, date, latitude, longitude) {
        let score = 0;
        
        // Temperature scoring
        const tempScore = this.scoreTemperature(hourData.temperature);
        
        // Pressure scoring (we don't have trend for future, so just score the value)
        const pressureScore = this.scorePressureValue(hourData.pressure);
        
        // Weather conditions scoring
        const weatherScore = this.scoreWeatherConditions(
            hourData.weatherCode,
            hourData.precipitation
        );
        
        // Wind scoring
        const windScore = this.scoreWind(hourData.windSpeed);
        
        // Solunar scoring for that specific time
        const solunarScore = this.solunarCalc.getSolunarRating(date, latitude, longitude);

        // Calculate weighted total
        score = (
            tempScore * 0.20 +
            pressureScore * 0.25 +
            weatherScore * 0.20 +
            windScore * 0.15 +
            solunarScore * 0.20
        );

        return {
            totalScore: Math.round(score),
            factors: {
                temperature: Math.round(tempScore),
                pressure: Math.round(pressureScore),
                weather: Math.round(weatherScore),
                wind: Math.round(windScore),
                solunar: Math.round(solunarScore)
            },
            data: hourData
        };
    }

    // Score daily conditions (average for the day)
    scoreDailyConditions(dayData, date, latitude, longitude) {
        // Use average temperature
        const avgTemp = (dayData.tempMax + dayData.tempMin) / 2;
        const tempScore = this.scoreTemperature(avgTemp);
        
        // Weather conditions
        const weatherScore = this.scoreWeatherConditions(
            dayData.weatherCode,
            dayData.precipitationSum
        );
        
        // Wind scoring
        const windScore = this.scoreWind(dayData.windSpeedMax);
        
        // Solunar scoring for the day
        const solunarScore = this.solunarCalc.getDailySolunarQuality(date, latitude, longitude);

        // Calculate weighted total (pressure gets less weight since we don't have trend)
        const score = (
            tempScore * 0.25 +
            weatherScore * 0.25 +
            windScore * 0.20 +
            solunarScore * 0.30
        );

        return {
            totalScore: Math.round(score),
            factors: {
                temperature: Math.round(tempScore),
                weather: Math.round(weatherScore),
                wind: Math.round(windScore),
                solunar: Math.round(solunarScore)
            },
            data: dayData
        };
    }

    // Temperature scoring (optimal ranges for Southern Ohio wildlife)
    scoreTemperature(temp) {
        // Optimal ranges: 
        // Deer: 40-60°F (best), 30-70°F (good)
        // Fish: 50-70°F (best), 40-80°F (good)
        // We'll optimize for the overlap
        
        if (temp >= 45 && temp <= 65) return 100; // Perfect
        if (temp >= 35 && temp <= 75) return 85;  // Very good
        if (temp >= 25 && temp <= 85) return 65;  // Good
        if (temp >= 15 && temp <= 95) return 40;  // Fair
        return 20; // Poor (too cold or hot)
    }

    // Pressure scoring with trend
    scorePressure(pressure, trend) {
        let score = this.scorePressureValue(pressure);
        
        // Trend is crucial for hunting/fishing
        // Rising pressure (high pressure moving in) = excellent
        // Steady high pressure = very good
        // Falling pressure (storm approaching) = can be good (pre-frontal feeding)
        // Steady low pressure = poor
        
        if (trend === 'rising') {
            score = Math.min(100, score + 20); // Big bonus for rising
        } else if (trend === 'falling') {
            // Falling can be good (feeding before storm) but depends on current pressure
            if (pressure > 1015) {
                score = Math.min(100, score + 10); // Falling from high is good
            }
        }
        
        return score;
    }

    // Score just the pressure value (no trend)
    scorePressureValue(pressure) {
        // Optimal pressure: 1020-1030 hPa
        // Good: 1010-1020 or 1030-1040
        // Fair: 1000-1010 or 1040+
        // Poor: below 1000
        
        if (pressure >= 1020 && pressure <= 1030) return 100;
        if (pressure >= 1015 && pressure <= 1035) return 85;
        if (pressure >= 1010 && pressure <= 1040) return 70;
        if (pressure >= 1005 && pressure <= 1045) return 50;
        if (pressure >= 1000 && pressure <= 1050) return 35;
        return 20;
    }

    // Weather conditions scoring
    scoreWeatherConditions(weatherCode, precipitation) {
        // Clear to partly cloudy = best
        // Overcast = good (deer often move on overcast days)
        // Light rain/drizzle = can be okay
        // Heavy rain, storms, snow = poor
        
        if (weatherCode === 0 || weatherCode === 1) return 95; // Clear
        if (weatherCode === 2) return 100; // Partly cloudy (best for hunting)
        if (weatherCode === 3) return 85; // Overcast (good for deer)
        if (weatherCode >= 45 && weatherCode <= 48) return 60; // Fog
        if (weatherCode >= 51 && weatherCode <= 55) return 70; // Drizzle
        if (weatherCode === 61) return 60; // Light rain
        if (weatherCode === 63 || weatherCode === 65) return 30; // Moderate/heavy rain
        if (weatherCode >= 71 && weatherCode <= 77) return 25; // Snow
        if (weatherCode >= 80 && weatherCode <= 86) return 35; // Showers
        if (weatherCode >= 95) return 10; // Thunderstorms
        
        return 50; // Default
    }

    // Wind scoring
    scoreWind(windSpeed) {
        // Light wind (5-15 mph) = best for hunting (masks sound/scent)
        // Calm or very light (0-5 mph) = good
        // Moderate (15-25 mph) = fair (difficult for hunting)
        // Strong (25+ mph) = poor
        
        if (windSpeed >= 5 && windSpeed <= 12) return 100; // Perfect
        if (windSpeed >= 0 && windSpeed <= 5) return 85; // Very good (but too calm can be bad)
        if (windSpeed >= 12 && windSpeed <= 18) return 70; // Good
        if (windSpeed >= 18 && windSpeed <= 25) return 45; // Fair
        if (windSpeed >= 25 && windSpeed <= 35) return 25; // Poor
        return 10; // Very poor (dangerous)
    }

    // Get recommendation based on score
    getRecommendation(score) {
        if (score >= 85) {
            return {
                title: 'Excellent Conditions! 🎯',
                description: 'Prime time for hunting and fishing! Multiple factors are aligned in your favor. This is an ideal time to be in the field or on the water.',
                rating: 'excellent'
            };
        } else if (score >= 70) {
            return {
                title: 'Good Conditions 👍',
                description: 'Favorable conditions for outdoor activities. You should see decent animal activity. Good chance of success.',
                rating: 'good'
            };
        } else if (score >= 50) {
            return {
                title: 'Fair Conditions ⚠️',
                description: 'Conditions are mediocre. Activity may be reduced, but it\'s still worth going out if you have the time. Patience will be key.',
                rating: 'fair'
            };
        } else {
            return {
                title: 'Poor Conditions ❌',
                description: 'Conditions are not favorable. Animal activity is likely to be low. Consider waiting for better conditions or adjust your strategy.',
                rating: 'poor'
            };
        }
    }

    // Get detailed analysis of factors
    getDetailedAnalysis(factors, weatherData) {
        const analysis = [];
        
        // Temperature analysis
        if (factors.temperature >= 85) {
            analysis.push('🌡️ Temperature is in the optimal range for wildlife activity.');
        } else if (factors.temperature >= 65) {
            analysis.push('🌡️ Temperature is good, though not ideal.');
        } else {
            analysis.push('🌡️ Temperature may reduce animal activity.');
        }
        
        // Pressure analysis
        const trend = weatherData.current.pressureTrend.trend;
        if (factors.pressure >= 85) {
            analysis.push(`📊 Excellent barometric pressure (${trend}). Animals should be active.`);
        } else if (factors.pressure >= 70) {
            analysis.push(`📊 Good pressure conditions (${trend}).`);
        } else if (trend === 'falling') {
            analysis.push(`📊 Falling pressure - animals may feed before weather change.`);
        } else {
            analysis.push(`📊 Pressure conditions are less than ideal.`);
        }
        
        // Weather analysis
        if (factors.weather >= 85) {
            analysis.push('☀️ Weather conditions are favorable.');
        } else if (factors.weather >= 60) {
            analysis.push('☁️ Weather is acceptable for outdoor activities.');
        } else {
            analysis.push('🌧️ Weather may hinder activity and visibility.');
        }
        
        // Wind analysis
        if (factors.wind >= 85) {
            analysis.push('💨 Wind conditions are excellent for concealment.');
        } else if (factors.wind >= 60) {
            analysis.push('💨 Wind is manageable.');
        } else {
            analysis.push('💨 High winds may make conditions difficult.');
        }
        
        // Solunar analysis
        if (factors.solunar >= 80) {
            analysis.push('🌙 Peak solunar period! Moon position favors feeding activity.');
        } else if (factors.solunar >= 60) {
            analysis.push('🌙 Good moon phase and position for activity.');
        } else {
            analysis.push('🌙 Moon influence is neutral or slightly negative.');
        }
        
        return analysis;
    }

    // Get score class for styling
    getScoreClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'fair';
        return 'poor';
    }

    // Generate tooltip HTML for current conditions
    generateCurrentTooltip(scoreResult) {
        const { totalScore, factors } = scoreResult;
        
        return `
            <div class="tooltip-title">Score Breakdown (${totalScore}/100)</div>
            <div class="tooltip-section">
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">🌡️ Temperature (20%):</span>
                    <span class="tooltip-factor-score">${factors.temperature}/100</span>
                </div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">📊 Pressure (25%):</span>
                    <span class="tooltip-factor-score">${Math.round(factors.pressure)}/100</span>
                </div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">☁️ Weather (20%):</span>
                    <span class="tooltip-factor-score">${Math.round(factors.weather)}/100</span>
                </div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">💨 Wind (15%):</span>
                    <span class="tooltip-factor-score">${Math.round(factors.wind)}/100</span>
                </div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">🌙 Solunar (20%):</span>
                    <span class="tooltip-factor-score">${Math.round(factors.solunar)}/100</span>
                </div>
            </div>
        `;
    }

    // Generate tooltip HTML for daily forecast
    generateDailyTooltip(scoreResult) {
        const { totalScore, factors, data } = scoreResult;
        const avgTemp = Math.round((data.tempMax + data.tempMin) / 2);
        
        return `
            <div class="tooltip-title">Daily Score: ${totalScore}/100</div>
            <div class="tooltip-section">
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">🌡️ Temperature (25%):</span>
                    <span class="tooltip-factor-score">${factors.temperature}/100</span>
                </div>
                <div style="font-size: 0.85em; color: #ccc; margin-left: 10px;">Avg: ${avgTemp}°F (${data.tempMin}°-${data.tempMax}°)</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">☁️ Weather (25%):</span>
                    <span class="tooltip-factor-score">${factors.weather}/100</span>
                </div>
                <div style="font-size: 0.85em; color: #ccc; margin-left: 10px;">${data.weatherDescription}</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">💨 Wind (20%):</span>
                    <span class="tooltip-factor-score">${factors.wind}/100</span>
                </div>
                <div style="font-size: 0.85em; color: #ccc; margin-left: 10px;">Max: ${data.windSpeedMax} mph</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">🌙 Solunar (30%):</span>
                    <span class="tooltip-factor-score">${factors.solunar}/100</span>
                </div>
            </div>
            <div class="tooltip-divider"></div>
            <div style="font-size: 0.85em; color: #ccc; font-style: italic;">
                Weighted average of all factors for the day
            </div>
        `;
    }

    // Generate tooltip HTML for hourly forecast
    generateHourlyTooltip(scoreResult) {
        const { totalScore, factors, data } = scoreResult;
        
        return `
            <div class="tooltip-title">Hour Score: ${totalScore}/100</div>
            <div class="tooltip-section">
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">🌡️ Temp (20%):</span>
                    <span class="tooltip-factor-score">${factors.temperature}/100</span>
                </div>
                <div style="font-size: 0.8em; color: #ccc; margin-left: 10px;">${data.temperature}°F</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">📊 Press (25%):</span>
                    <span class="tooltip-factor-score">${factors.pressure}/100</span>
                </div>
                <div style="font-size: 0.8em; color: #ccc; margin-left: 10px;">${data.pressure.toFixed(1)} hPa</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">☁️ Weather (20%):</span>
                    <span class="tooltip-factor-score">${factors.weather}/100</span>
                </div>
                <div style="font-size: 0.8em; color: #ccc; margin-left: 10px;">${data.weatherDescription}</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">💨 Wind (15%):</span>
                    <span class="tooltip-factor-score">${factors.wind}/100</span>
                </div>
                <div style="font-size: 0.8em; color: #ccc; margin-left: 10px;">${data.windSpeed} mph</div>
                <div class="tooltip-factor">
                    <span class="tooltip-factor-name">🌙 Solunar (20%):</span>
                    <span class="tooltip-factor-score">${factors.solunar}/100</span>
                </div>
            </div>
        `;
    }
}
