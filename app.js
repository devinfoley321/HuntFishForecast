// Main Application Module
// Coordinates all modules and handles UI updates

class HuntFishApp {
    constructor() {
        this.weatherAPI = new WeatherAPI();
        this.solunarCalc = new SolunarCalculator();
        this.scorer = new HuntFishScorer();
        
        this.currentLocation = {
            city: 'Cincinnati',
            latitude: 39.1031,
            longitude: -84.5120
        };
        
        this.weatherData = null;
        
        this.init();
    }

    async init() {
        // Set up event listeners
        document.getElementById('updateLocation').addEventListener('click', () => {
            this.updateLocation();
        });

        // Allow Enter key in location input
        document.getElementById('locationInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.updateLocation();
            }
        });

        // Load initial data
        await this.loadData();

        // Refresh data every 15 minutes
        setInterval(() => this.loadData(), 15 * 60 * 1000);
    }

    async updateLocation() {
        const cityInput = document.getElementById('locationInput').value.trim();
        
        if (!cityInput) {
            alert('Please enter a city name');
            return;
        }

        this.showLoading();

        try {
            const coords = await this.weatherAPI.getCoordinates(cityInput);
            this.currentLocation = {
                city: `${coords.name}${coords.state ? ', ' + coords.state : ''}`,
                latitude: coords.latitude,
                longitude: coords.longitude
            };

            await this.loadData();
        } catch (error) {
            console.error('Error updating location:', error);
            alert('Could not find location. Please try a different city name.');
            this.hideLoading();
        }
    }

    async loadData() {
        this.showLoading();

        try {
            // Fetch weather data
            this.weatherData = await this.weatherAPI.getWeatherData(
                this.currentLocation.latitude,
                this.currentLocation.longitude
            );

            // Update UI
            this.updateCurrentConditions();
            this.updateForecast();

            this.hideLoading();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading weather data. Please try again.');
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('currentData').classList.add('hidden');
        document.getElementById('forecastData').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('currentData').classList.remove('hidden');
        document.getElementById('forecastData').classList.remove('hidden');
    }

    updateCurrentConditions() {
        const score = this.scorer.scoreCurrentConditions(
            this.weatherData,
            this.currentLocation.latitude,
            this.currentLocation.longitude
        );

        const moonData = this.solunarCalc.getMoonPhase(new Date());
        const solunarPeriods = this.solunarCalc.getSolunarPeriods(
            new Date(),
            this.currentLocation.latitude,
            this.currentLocation.longitude
        );

        // Update score display with tooltip
        const scoreElement = document.getElementById('currentScore');
        scoreElement.textContent = score.totalScore;
        scoreElement.className = `score-value score-${score.recommendation.rating}`;
        
        // Add tooltip to score circle
        const scoreCircle = scoreElement.parentElement;
        if (!scoreCircle.classList.contains('tooltip-container')) {
            scoreCircle.classList.add('tooltip-container');
        }
        
        // Remove old tooltip if exists
        const oldTooltip = scoreCircle.querySelector('.tooltip');
        if (oldTooltip) {
            oldTooltip.remove();
        }
        
        // Add new tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = this.scorer.generateCurrentTooltip(score);
        scoreCircle.appendChild(tooltip);

        // Update recommendation
        document.getElementById('recommendationTitle').textContent = score.recommendation.title;
        document.getElementById('recommendationText').textContent = score.recommendation.description;

        // Update weather info
        document.getElementById('temperature').textContent = 
            `${this.weatherData.current.temperature}°F`;
        document.getElementById('weatherDesc').textContent = 
            `${this.weatherAPI.getWeatherEmoji(this.weatherData.current.weatherCode)} ${this.weatherData.current.weatherDescription}`;

        // Update pressure info
        document.getElementById('pressure').textContent = 
            `${this.weatherData.current.pressure.toFixed(1)} hPa`;
        const trendIcon = this.weatherData.current.pressureTrend.trend === 'rising' ? '📈' : 
                         this.weatherData.current.pressureTrend.trend === 'falling' ? '📉' : '➡️';
        document.getElementById('pressureTrend').textContent = 
            `${trendIcon} ${this.weatherData.current.pressureTrend.trend} (${this.weatherData.current.pressureTrend.change} hPa/3h)`;

        // Update moon info
        document.getElementById('moonPhase').textContent = 
            `${moonData.emoji} ${moonData.phaseName}`;
        document.getElementById('moonIllumination').textContent = 
            `${(moonData.illumination * 100).toFixed(0)}% illuminated`;

        // Update solunar periods
        const periodsHTML = this.formatSolunarPeriods(solunarPeriods);
        document.getElementById('solunarPeriods').innerHTML = periodsHTML;
    }

    formatSolunarPeriods(solunarData) {
        const now = new Date();
        let html = '';

        const periods = [
            { name: 'Major 1', period: solunarData.periods.major1 },
            { name: 'Minor 1', period: solunarData.periods.minor1 },
            { name: 'Major 2', period: solunarData.periods.major2 },
            { name: 'Minor 2', period: solunarData.periods.minor2 }
        ];

        // Sort periods by start time
        periods.sort((a, b) => a.period.start - b.period.start);

        periods.forEach(item => {
            const isActive = this.solunarCalc.isInPeriod(now, item.period);
            const timeStr = this.solunarCalc.formatPeriodTime(item.period);
            const activeClass = isActive ? ' active' : '';
            const icon = item.period.type === 'major' ? '🔴' : '🟡';
            
            html += `<div class="solunar-period${activeClass}">${icon} <strong>${item.name}:</strong> ${timeStr}</div>`;
        });

        return html;
    }

    updateForecast() {
        const container = document.getElementById('forecastData');
        container.innerHTML = '';

        this.weatherData.daily.forEach((day, index) => {
            const dayElement = this.createForecastDay(day, index);
            container.appendChild(dayElement);
        });
    }

    createForecastDay(dayData, index) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'forecast-day';

        // Calculate daily score (now returns object with details)
        const dailyScoreResult = this.scorer.scoreDailyConditions(
            dayData,
            dayData.date,
            this.currentLocation.latitude,
            this.currentLocation.longitude
        );

        const dailyScore = dailyScoreResult.totalScore;
        const scoreClass = this.scorer.getScoreClass(dailyScore);
        const dailyTooltip = this.scorer.generateDailyTooltip(dailyScoreResult);

        // Format date
        const dateStr = index === 0 ? 'Today' : 
                       index === 1 ? 'Tomorrow' : 
                       dayData.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        // Get moon phase for this day
        const moonData = this.solunarCalc.getMoonPhase(dayData.date);

        dayDiv.innerHTML = `
            <div class="forecast-header">
                <div class="forecast-date">
                    <h3>${dateStr}</h3>
                    <p>${dayData.weatherDescription} ${this.weatherAPI.getWeatherEmoji(dayData.weatherCode)}</p>
                </div>
                <div class="forecast-score tooltip-container">
                    <div class="forecast-score-value score-${scoreClass}">${dailyScore}</div>
                    <div class="forecast-score-label">Activity Score</div>
                    <div class="tooltip">${dailyTooltip}</div>
                </div>
                <div class="forecast-summary">
                    <div class="summary-item">
                        <span>🌡️ ${dayData.tempMin}° - ${dayData.tempMax}°F</span>
                    </div>
                    <div class="summary-item">
                        <span>${moonData.emoji} ${moonData.phaseName}</span>
                    </div>
                    <div class="summary-item">
                        <span>💨 ${dayData.windSpeedMax} mph</span>
                    </div>
                </div>
                <div class="expand-icon">▼</div>
            </div>
            <div class="hourly-forecast">
                <h4>Hourly Breakdown</h4>
                <div class="hourly-grid" id="hourly-${index}">
                    <!-- Hourly data will be inserted here -->
                </div>
            </div>
        `;

        // Add click handler to expand/collapse
        const header = dayDiv.querySelector('.forecast-header');
        header.addEventListener('click', () => {
            dayDiv.classList.toggle('expanded');
            if (dayDiv.classList.contains('expanded') && !dayDiv.dataset.loaded) {
                this.loadHourlyData(dayDiv, dayData.date, index);
                dayDiv.dataset.loaded = 'true';
            }
        });

        return dayDiv;
    }

    loadHourlyData(dayElement, date, dayIndex) {
        const hourlyContainer = dayElement.querySelector(`#hourly-${dayIndex}`);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Filter hourly data for this day
        const dayHours = this.weatherData.hourly.filter(hour => {
            return hour.time >= startOfDay && hour.time <= endOfDay;
        });

        // Create hour cards
        dayHours.forEach(hour => {
            const hourScoreResult = this.scorer.scoreHourlyConditions(
                hour,
                hour.time,
                this.currentLocation.latitude,
                this.currentLocation.longitude
            );

            const hourScore = hourScoreResult.totalScore;
            const scoreClass = this.scorer.getScoreClass(hourScore);
            const hourTooltip = this.scorer.generateHourlyTooltip(hourScoreResult);
            const timeStr = hour.time.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                hour12: true 
            });

            const hourCard = document.createElement('div');
            hourCard.className = `hour-card bg-${scoreClass} tooltip-container`;
            hourCard.innerHTML = `
                <div class="hour-time">${timeStr}</div>
                <div class="hour-score score-${scoreClass}">${hourScore}</div>
                <div class="hour-temp">${hour.temperature}°F</div>
                <div class="hour-temp" style="font-size: 0.8em;">${this.weatherAPI.getWeatherEmoji(hour.weatherCode)}</div>
                <div class="tooltip">${hourTooltip}</div>
            `;

            hourlyContainer.appendChild(hourCard);
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HuntFishApp();
});
