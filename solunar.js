// Solunar Calculations Module
// Calculates moon phases, positions, and major/minor feeding periods

class SolunarCalculator {
    constructor() {
        this.lunarCycle = 29.530588853; // Average lunar cycle in days
        this.knownNewMoon = new Date('2000-01-06T18:14:00Z'); // Reference new moon
    }

    // Calculate moon phase for a given date
    getMoonPhase(date) {
        const totalSeconds = (date - this.knownNewMoon) / 1000;
        const totalDays = totalSeconds / (24 * 60 * 60);
        const phase = (totalDays % this.lunarCycle) / this.lunarCycle;
        
        return {
            phase: phase,
            illumination: this.getIllumination(phase),
            phaseName: this.getPhaseName(phase),
            emoji: this.getMoonEmoji(phase)
        };
    }

    // Calculate illumination percentage
    getIllumination(phase) {
        // Illumination peaks at 50% (full moon) and is 0 at 0% and 100% (new moon)
        if (phase <= 0.5) {
            return phase * 2; // Waxing
        } else {
            return (1 - phase) * 2; // Waning
        }
    }

    // Get descriptive phase name
    getPhaseName(phase) {
        if (phase < 0.03 || phase > 0.97) return 'New Moon';
        if (phase < 0.22) return 'Waxing Crescent';
        if (phase < 0.28) return 'First Quarter';
        if (phase < 0.47) return 'Waxing Gibbous';
        if (phase < 0.53) return 'Full Moon';
        if (phase < 0.72) return 'Waning Gibbous';
        if (phase < 0.78) return 'Last Quarter';
        return 'Waning Crescent';
    }

    // Get moon emoji
    getMoonEmoji(phase) {
        if (phase < 0.03 || phase > 0.97) return '🌑';
        if (phase < 0.22) return '🌒';
        if (phase < 0.28) return '🌓';
        if (phase < 0.47) return '🌔';
        if (phase < 0.53) return '🌕';
        if (phase < 0.72) return '🌖';
        if (phase < 0.78) return '🌗';
        return '🌘';
    }

    // Calculate moon position (simplified) and solunar periods
    getSolunarPeriods(date, latitude, longitude) {
        // Calculate moon transit (when moon is overhead or underfoot)
        const moonData = this.calculateMoonPosition(date, latitude, longitude);
        
        // Major periods: when moon is overhead (transit) or underfoot (opposite)
        // Minor periods: when moon is rising or setting
        const periods = {
            major1: this.getMajorPeriod(moonData.transit),
            major2: this.getMajorPeriod(moonData.opposite),
            minor1: this.getMinorPeriod(moonData.moonrise),
            minor2: this.getMinorPeriod(moonData.moonset)
        };

        return {
            periods,
            moonrise: moonData.moonrise,
            moonset: moonData.moonset,
            transit: moonData.transit
        };
    }

    // Simplified moon position calculation
    calculateMoonPosition(date, latitude, longitude) {
        const day = this.daysSinceJ2000(date);
        
        // Simplified lunar calculations (based on mean anomaly)
        const meanAnomaly = (134.963 + 13.064993 * day) % 360;
        const meanLongitude = (218.316 + 13.176396 * day) % 360;
        
        // Calculate moon transit time (when it crosses the meridian)
        // This is a simplification - real calculations are more complex
        const transitHour = ((meanLongitude - longitude) / 15 + 12) % 24;
        
        // Moonrise is approximately 50 minutes earlier than transit
        const moonriseHour = (transitHour - 0.83 + 24) % 24;
        
        // Moonset is approximately 50 minutes after transit
        const moonsetHour = (transitHour + 0.83) % 24;
        
        // Calculate opposite (when moon is underfoot) - 12 hours from transit
        const oppositeHour = (transitHour + 12) % 24;
        
        return {
            transit: this.createTimeString(date, transitHour),
            opposite: this.createTimeString(date, oppositeHour),
            moonrise: this.createTimeString(date, moonriseHour),
            moonset: this.createTimeString(date, moonsetHour)
        };
    }

    // Create a time string for a given hour on a date
    createTimeString(date, hour) {
        const newDate = new Date(date);
        newDate.setHours(Math.floor(hour));
        newDate.setMinutes(Math.round((hour % 1) * 60));
        newDate.setSeconds(0);
        return newDate;
    }

    // Get major period (2-3 hours around the time)
    getMajorPeriod(centerTime) {
        const start = new Date(centerTime.getTime() - 90 * 60000); // 1.5 hours before
        const end = new Date(centerTime.getTime() + 90 * 60000); // 1.5 hours after
        return { start, end, type: 'major' };
    }

    // Get minor period (1-2 hours around the time)
    getMinorPeriod(centerTime) {
        const start = new Date(centerTime.getTime() - 45 * 60000); // 45 minutes before
        const end = new Date(centerTime.getTime() + 45 * 60000); // 45 minutes after
        return { start, end, type: 'minor' };
    }

    // Calculate days since J2000 epoch
    daysSinceJ2000(date) {
        const j2000 = new Date('2000-01-01T12:00:00Z');
        return (date - j2000) / (24 * 60 * 60 * 1000);
    }

    // Check if current time is within a solunar period
    isInPeriod(currentTime, period) {
        return currentTime >= period.start && currentTime <= period.end;
    }

    // Format period time for display
    formatPeriodTime(period) {
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        const startStr = period.start.toLocaleTimeString('en-US', options);
        const endStr = period.end.toLocaleTimeString('en-US', options);
        return `${startStr} - ${endStr}`;
    }

    // Get solunar rating (0-100) based on moon phase and current period
    getSolunarRating(date, latitude, longitude) {
        const moonPhase = this.getMoonPhase(date);
        const periods = this.getSolunarPeriods(date, latitude, longitude);
        
        let rating = 50; // Base rating
        
        // Moon phase influence (New Moon and Full Moon are best)
        const phaseInfluence = Math.abs(moonPhase.phase - 0.5);
        rating += (0.5 - phaseInfluence) * 40; // +20 for new/full moon, 0 for quarters
        
        // Check if we're in a solunar period
        const now = date;
        let inMajor = false;
        let inMinor = false;
        
        // Check all periods
        Object.values(periods.periods).forEach(period => {
            if (this.isInPeriod(now, period)) {
                if (period.type === 'major') {
                    inMajor = true;
                } else {
                    inMinor = true;
                }
            }
        });
        
        // Add bonus for being in a period
        if (inMajor) rating += 30;
        else if (inMinor) rating += 15;
        
        return Math.min(100, Math.max(0, rating));
    }

    // Get daily solunar quality (average for the day)
    getDailySolunarQuality(date, latitude, longitude) {
        const moonPhase = this.getMoonPhase(date);
        const periods = this.getSolunarPeriods(date, latitude, longitude);
        
        // Base quality on moon phase
        let quality = 50;
        const phaseInfluence = Math.abs(moonPhase.phase - 0.5);
        quality += (0.5 - phaseInfluence) * 50; // Better during new/full moon
        
        return Math.min(100, Math.max(0, quality));
    }
}
