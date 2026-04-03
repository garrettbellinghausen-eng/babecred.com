// coming-up.js — Sports calendar + weather-based suggestions
// Boston-focused. No API key needed.

var ComingUp = (function () {
    var WEATHER_CACHE_KEY = 'babecred_weather';
    var WEATHER_CACHE_HOURS = 3;
    var BOSTON_LAT = 42.36;
    var BOSTON_LON = -71.06;
    var GOLF_MIN_TEMP = 60;
    var GOLF_MAX_PRECIP = 30;

    // --- Sports Seasons ---

    function getActiveSeasons(month) {
        var seasons = [];
        if (month >= 8 || month <= 1) seasons.push('nfl');
        if (month >= 9 || month <= 5) seasons.push('nba');
        if (month >= 9 || month <= 5) seasons.push('nhl');
        if (month >= 3 && month <= 9) seasons.push('mlb');
        if (month >= 3 && month <= 7) seasons.push('golf');
        if (month === 2 || (month === 3 && new Date().getDate() <= 8)) seasons.push('marchmadness');
        return seasons;
    }

    // --- Tentpole Events ---

    function getTentpoleEvents(now) {
        var year = now.getFullYear();
        var events = [];

        function withinDays(targetDate, days) {
            var diff = targetDate.getTime() - now.getTime();
            return diff >= -86400000 && diff <= days * 86400000;
        }

        function dayLabel(targetDate) {
            var diff = Math.round((targetDate.getTime() - now.getTime()) / 86400000);
            if (diff <= 0) return 'Today';
            if (diff === 1) return 'Tomorrow';
            return targetDate.toLocaleDateString('en-US', { weekday: 'long' });
        }

        // Super Bowl — 1st Sunday in Feb
        var feb1 = new Date(year, 1, 1);
        var superBowl = new Date(year, 1, 1 + (7 - feb1.getDay()) % 7);
        if (withinDays(superBowl, 3)) {
            events.push({ emoji: '🏈', name: 'Super Bowl Sunday', day: dayLabel(superBowl), val: '-80', type: 'withdrawal', value: -80, rate: 1 });
        }

        // March Madness First Weekend — 3rd Thursday of Mar
        var mmStart = new Date(year, 2, 15 + ((4 - new Date(year, 2, 15).getDay() + 7) % 7));
        if (withinDays(mmStart, 3)) {
            events.push({ emoji: '🏀', name: 'March Madness', day: dayLabel(mmStart), val: '-40', type: 'withdrawal', value: -40, rate: 2 });
        }

        // Final Four — 1st Saturday of Apr
        var apr1 = new Date(year, 3, 1);
        var finalFour = new Date(year, 3, 1 + (6 - apr1.getDay() + 7) % 7);
        if (withinDays(finalFour, 3)) {
            events.push({ emoji: '🏀', name: 'Final Four Weekend', day: dayLabel(finalFour), val: '-60', type: 'withdrawal', value: -60, rate: 1 });
        }

        // Masters — 2nd Thursday of Apr
        var mastersThur = new Date(year, 3, 8 + ((4 - new Date(year, 3, 8).getDay() + 7) % 7));
        if (withinDays(mastersThur, 3)) {
            events.push({ emoji: '⛳', name: 'The Masters', day: dayLabel(mastersThur), val: '-30', type: 'withdrawal', value: -30, rate: 2 });
        }

        // NFL Draft — last Thursday of Apr
        var draftThur = new Date(year, 3, 30);
        while (draftThur.getDay() !== 4) draftThur.setDate(draftThur.getDate() - 1);
        if (withinDays(draftThur, 3)) {
            events.push({ emoji: '🏈', name: 'NFL Draft Weekend', day: dayLabel(draftThur), val: '-25', type: 'withdrawal', value: -25, rate: 2 });
        }

        // PGA Championship — 3rd Thursday of May
        var pgaThur = new Date(year, 4, 15 + ((4 - new Date(year, 4, 15).getDay() + 7) % 7));
        if (withinDays(pgaThur, 3)) {
            events.push({ emoji: '⛳', name: 'PGA Championship', day: dayLabel(pgaThur), val: '-25', type: 'withdrawal', value: -25, rate: 2 });
        }

        // NBA Finals — ~1st Thursday of Jun
        var nbafStart = new Date(year, 5, 1 + ((4 - new Date(year, 5, 1).getDay() + 7) % 7));
        if (withinDays(nbafStart, 3)) {
            events.push({ emoji: '🏀', name: 'NBA Finals', day: dayLabel(nbafStart), val: '-40', type: 'withdrawal', value: -40, rate: 1 });
        }

        // Stanley Cup Finals — ~1st Monday of Jun
        var scfStart = new Date(year, 5, 1 + ((1 - new Date(year, 5, 1).getDay() + 7) % 7));
        if (withinDays(scfStart, 3)) {
            events.push({ emoji: '🏒', name: 'Stanley Cup Finals', day: dayLabel(scfStart), val: '-30', type: 'withdrawal', value: -30, rate: 1 });
        }

        // US Open Golf — 3rd Thursday of Jun
        var usoThur = new Date(year, 5, 15 + ((4 - new Date(year, 5, 15).getDay() + 7) % 7));
        if (withinDays(usoThur, 3)) {
            events.push({ emoji: '⛳', name: 'US Open', day: dayLabel(usoThur), val: '-25', type: 'withdrawal', value: -25, rate: 2 });
        }

        // The Open — 3rd Thursday of Jul
        var openThur = new Date(year, 6, 15 + ((4 - new Date(year, 6, 15).getDay() + 7) % 7));
        if (withinDays(openThur, 3)) {
            events.push({ emoji: '⛳', name: 'The Open', day: dayLabel(openThur), val: '-25', type: 'withdrawal', value: -25, rate: 2 });
        }

        // NFL Season Opener — 1st Thursday of Sep
        var nflOpen = new Date(year, 8, 1 + ((4 - new Date(year, 8, 1).getDay() + 7) % 7));
        if (withinDays(nflOpen, 3)) {
            events.push({ emoji: '🏈', name: 'NFL Season Opener', day: dayLabel(nflOpen), val: '-25', type: 'withdrawal', value: -25, rate: 2 });
        }

        return events;
    }

    // --- Regular Season Game Days ---

    function getSeasonalEvents(now) {
        var events = [];
        var dow = now.getDay();
        var month = now.getMonth();
        var seasons = getActiveSeasons(month);

        function dayLabel(daysFromNow) {
            if (daysFromNow === 0) return 'Tonight';
            if (daysFromNow === 1) return 'Tomorrow';
            var d = new Date(now); d.setDate(d.getDate() + daysFromNow);
            return d.toLocaleDateString('en-US', { weekday: 'long' });
        }

        for (var offset = 0; offset <= 2; offset++) {
            var checkDay = (dow + offset) % 7;
            var label = dayLabel(offset);

            if (seasons.indexOf('nfl') >= 0 && checkDay === 0) {
                events.push({ emoji: '🏈', name: 'Patriots Sunday', day: label, val: '-20', type: 'withdrawal', value: -20, rate: 2 });
            }
            if (seasons.indexOf('nfl') >= 0 && checkDay === 1) {
                events.push({ emoji: '🏈', name: 'Monday Night Football', day: label, val: '-20', type: 'withdrawal', value: -20, rate: 2 });
            }
            if (seasons.indexOf('nfl') >= 0 && checkDay === 4) {
                events.push({ emoji: '🏈', name: 'Thursday Night Football', day: label, val: '-15', type: 'withdrawal', value: -15, rate: 2 });
            }
            if (seasons.indexOf('nba') >= 0 && [2, 3, 5, 6].indexOf(checkDay) >= 0) {
                events.push({ emoji: '🏀', name: 'Celtics game', day: label, val: '-15', type: 'withdrawal', value: -15, rate: 2 });
            }
            if (seasons.indexOf('nhl') >= 0 && [1, 2, 4, 6].indexOf(checkDay) >= 0) {
                events.push({ emoji: '🏒', name: 'Bruins game', day: label, val: '-15', type: 'withdrawal', value: -15, rate: 2 });
            }
            if (seasons.indexOf('mlb') >= 0 && [0, 5, 6].indexOf(checkDay) >= 0) {
                events.push({ emoji: '⚾', name: 'Red Sox game', day: label, val: '-15', type: 'withdrawal', value: -15, rate: 2 });
            }
        }

        var seen = {};
        return events.filter(function (e) {
            if (seen[e.name]) return false;
            seen[e.name] = true;
            return true;
        });
    }

    // --- Weather for Golf ---

    function fetchWeather(callback) {
        try {
            var cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
            if (cached && (Date.now() - cached.fetchedAt) < WEATHER_CACHE_HOURS * 3600000) {
                callback(cached.data);
                return;
            }
        } catch (e) {}

        var url = 'https://api.open-meteo.com/v1/forecast'
            + '?latitude=' + BOSTON_LAT
            + '&longitude=' + BOSTON_LON
            + '&daily=temperature_2m_max,precipitation_probability_max'
            + '&temperature_unit=fahrenheit'
            + '&timezone=America/New_York'
            + '&forecast_days=3';

        fetch(url).then(function (r) { return r.json(); }).then(function (data) {
            try {
                localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data: data }));
            } catch (e) {}
            callback(data);
        }).catch(function () {
            callback(null);
        });
    }

    function getWeatherSuggestions(weatherData) {
        if (!weatherData || !weatherData.daily) return [];
        var suggestions = [];
        var temps = weatherData.daily.temperature_2m_max || [];
        var precip = weatherData.daily.precipitation_probability_max || [];
        var dates = weatherData.daily.time || [];

        for (var i = 0; i < dates.length; i++) {
            var d = new Date(dates[i] + 'T12:00:00');
            var dow = d.getDay();
            if (dow !== 5 && dow !== 6 && dow !== 0) continue;
            if (temps[i] >= GOLF_MIN_TEMP && precip[i] < GOLF_MAX_PRECIP) {
                var dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                var tempRound = Math.round(temps[i]);
                suggestions.push({
                    emoji: '⛳',
                    name: 'Golf ' + dayName,
                    day: '☀️ ' + tempRound + '°F',
                    val: '-25',
                    type: 'withdrawal',
                    value: -25,
                    rate: 2
                });
            }
        }
        return suggestions;
    }

    // --- No-work-tomorrow gaming suggestion ---

    function isUSHoliday(d) {
        var m = d.getMonth();
        var day = d.getDate();
        var dow = d.getDay();
        // Fixed dates
        if (m === 0 && day === 1) return true;   // New Year's
        if (m === 6 && day === 4) return true;   // July 4th
        if (m === 11 && day === 25) return true;  // Christmas
        // MLK: 3rd Monday of Jan
        if (m === 0 && dow === 1 && day >= 15 && day <= 21) return true;
        // Presidents Day: 3rd Monday of Feb
        if (m === 1 && dow === 1 && day >= 15 && day <= 21) return true;
        // Memorial Day: last Monday of May
        if (m === 4 && dow === 1 && day >= 25) return true;
        // Labor Day: 1st Monday of Sep
        if (m === 8 && dow === 1 && day <= 7) return true;
        // Columbus Day: 2nd Monday of Oct
        if (m === 9 && dow === 1 && day >= 8 && day <= 14) return true;
        // Veterans Day
        if (m === 10 && day === 11) return true;
        // Thanksgiving: 4th Thursday of Nov
        if (m === 10 && dow === 4 && day >= 22 && day <= 28) return true;
        // Day after Thanksgiving
        if (m === 10 && dow === 5 && day >= 23 && day <= 29) return true;
        return false;
    }

    function getGamingNight(now) {
        var tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        var tomorrowDow = tomorrow.getDay();
        // Weekend (Sat=6, Sun=0) or holiday
        if (tomorrowDow === 0 || tomorrowDow === 6 || isUSHoliday(tomorrow)) {
            return [{
                emoji: '🎮🪵',
                name: 'Gaming w/ the boys',
                day: 'No work tomorrow',
                val: '-20',
                type: 'withdrawal',
                value: -20,
                rate: 2
            }];
        }
        return [];
    }

    // --- Public API ---

    function getEvents(callback) {
        var now = new Date();
        var tentpole = getTentpoleEvents(now);
        var seasonal = getSeasonalEvents(now);
        var gaming = getGamingNight(now);

        var tentpoleSports = {};
        tentpole.forEach(function (e) { tentpoleSports[e.emoji] = true; });
        var filteredSeasonal = seasonal.filter(function (e) { return !tentpoleSports[e.emoji]; });
        var sports = tentpole.concat(filteredSeasonal);

        fetchWeather(function (data) {
            var weather = getWeatherSuggestions(data);
            callback(gaming.concat(sports).concat(weather));
        });
    }

    return { getEvents: getEvents };
})();
