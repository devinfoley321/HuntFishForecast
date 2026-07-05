// Weather API Module
// Using Open-Meteo API (free, no API key required) for weather data

class WeatherAPI {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
        this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
    }

    // Get coordinates for a city name
    async getCoordinates(cityName) {
        try {
            const response = await fetch(`${this.geocodingUrl}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                throw new Error('City not found');
            }
            
            return {
                latitude: data.results[0].latitude,
                longitude: data.results[0].longitude,
                name: data.results[0].name,
                state: data.results[0].admin1 || ''
            };
        } catch (error) {
            console.error('Error getting coordinates:', error);
            throw error;
        }
    }

    // Get current weather and forecast data
    async getWeatherData(latitude, longitude) {
        try {
            const params = new URLSearchParams({
                latitude: latitude,
                longitude: longitude,
                current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m',
                hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,cloud_cover',
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
                temperature_unit: 'fahrenheit',
                wind_speed_unit: 'mph',
                precipitation_unit: 'inch',
                timezone: 'America/New_York',
                forecast_days: 7
            });

            const response = await fetch(`${this.baseUrl}?${params}`);
            const data = await response.json();
            
            return this.processWeatherData(data);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    }

    // Process and format weather data
    processWeatherData(data) {
        const current = {
            temperature: Math.round(data.current.temperature_2m),
            feelsLike: Math.round(data.current.apparent_temperature),
            humidity: data.current.relative_humidity_2m,
            precipitation: data.current.precipitation,
            weatherCode: data.current.weather_code,
            weatherDescription: this.getWeatherDescription(data.current.weather_code),
            pressure: data.current.surface_pressure,
            windSpeed: Math.round(data.current.wind_speed_10m),
            windDirection: data.current.wind_direction_10m,
            time: new Date(data.current.time)
        };

        const hourly = this.processHourlyData(data.hourly);
        const daily = this.processDailyData(data.daily);

        // Calculate pressure trend (comparing current hour with 3 hours ago)
        const pressureTrend = this.calculatePressureTrend(data.hourly.surface_pressure);

        return {
            current: { ...current, pressureTrend },
            hourly,
            daily,
            timezone: data.timezone
        };
    }

    // Process hourly forecast data
    processHourlyData(hourly) {
        const hours = [];
        const now = new Date();
        
        for (let i = 0; i < hourly.time.length; i++) {
            const time = new Date(hourly.time[i]);
            
            hours.push({
                time: time,
                temperature: Math.round(hourly.temperature_2m[i]),
                humidity: hourly.relative_humidity_2m[i],
                precipitationProb: hourly.precipitation_probability[i] || 0,
                precipitation: hourly.precipitation[i] || 0,
                weatherCode: hourly.weather_code[i],
                weatherDescription: this.getWeatherDescription(hourly.weather_code[i]),
                pressure: hourly.surface_pressure[i],
                windSpeed: Math.round(hourly.wind_speed_10m[i]),
                cloudCover: hourly.cloud_cover[i]
            });
        }
        
        return hours;
    }

    // Process daily forecast data
    processDailyData(daily) {
        const days = [];
        
        for (let i = 0; i < daily.time.length; i++) {
            days.push({
                date: new Date(daily.time[i]),
                weatherCode: daily.weather_code[i],
                weatherDescription: this.getWeatherDescription(daily.weather_code[i]),
                tempMax: Math.round(daily.temperature_2m_max[i]),
                tempMin: Math.round(daily.temperature_2m_min[i]),
                precipitationSum: daily.precipitation_sum[i] || 0,
                precipitationProb: daily.precipitation_probability_max[i] || 0,
                windSpeedMax: Math.round(daily.wind_speed_10m_max[i])
            });
        }
        
        return days;
    }

    // Calculate pressure trend (rising, falling, or steady)
    calculatePressureTrend(pressureArray) {
        if (!pressureArray || pressureArray.length < 4) {
            return { trend: 'steady', change: 0 };
        }

        const current = pressureArray[0];
        const threeHoursAgo = pressureArray[3];
        const change = current - threeHoursAgo;

        let trend = 'steady';
        if (change > 1.5) trend = 'rising';
        else if (change < -1.5) trend = 'falling';

        return { trend, change: change.toFixed(2) };
    }

    // Get weather description from WMO weather code
    getWeatherDescription(code) {
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };

        return weatherCodes[code] || 'Unknown';
    }

    // Get weather icon/emoji
    getWeatherEmoji(code) {
        if (code === 0 || code === 1) return '☀️';
        if (code === 2) return '⛅';
        if (code === 3) return '☁️';
        if (code >= 45 && code <= 48) return '🌫️';
        if (code >= 51 && code <= 67) return '🌧️';
        if (code >= 71 && code <= 77) return '❄️';
        if (code >= 80 && code <= 82) return '🌦️';
        if (code >= 85 && code <= 86) return '🌨️';
        if (code >= 95) return '⛈️';
        return '🌤️';
    }
}
