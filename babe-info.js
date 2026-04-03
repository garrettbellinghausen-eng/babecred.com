// babe-info.js — Babe Profile: key dates that feed into Coming Up warnings
// Stored in localStorage.

var BabeInfo = (function () {
    var STORAGE_KEY = 'babecred_babeinfo';

    // Fixed holidays (month is 0-indexed)
    function getValentinesDay(year) { return new Date(year, 1, 14); }
    function getMothersDay(year) {
        // 2nd Sunday of May
        var may1 = new Date(year, 4, 1);
        var firstSun = (7 - may1.getDay()) % 7;
        return new Date(year, 4, firstSun + 8);
    }

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) { return {}; }
    }

    function save(info) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    }

    function getInfo() { return load(); }

    function setInfo(info) { save(info); }

    // Get upcoming babe-related events within the next N days
    function getUpcoming(daysAhead) {
        var info = load();
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var events = [];

        function checkDate(name, emoji, monthDay, credCost, warnDays) {
            if (!monthDay) return;
            var parts = monthDay.split('-'); // MM-DD format
            var m = parseInt(parts[0]) - 1;
            var d = parseInt(parts[1]);
            // Check this year and next year
            for (var y = now.getFullYear(); y <= now.getFullYear() + 1; y++) {
                var target = new Date(y, m, d);
                var diff = Math.round((target - today) / 86400000);
                if (diff >= 0 && diff <= daysAhead) {
                    var dayLabel = diff === 0 ? 'TODAY' : diff === 1 ? 'Tomorrow' : 'In ' + diff + ' days';
                    var urgency = diff <= 3 ? '🚨' : diff <= 7 ? '⚠️' : '📅';
                    events.push({
                        emoji: urgency + emoji,
                        name: name,
                        day: dayLabel,
                        val: diff === 0 ? 'TODAY!' : (diff <= 3 ? 'URGENT' : diff + ' days'),
                        type: 'warning',
                        daysOut: diff,
                        credCost: credCost
                    });
                    break;
                }
            }
        }

        // Anniversary
        if (info.anniversary) {
            checkDate('Anniversary', '💍', info.anniversary, -100, daysAhead);
        }

        // Her birthday
        if (info.birthday) {
            checkDate('Her Birthday', '🎂', info.birthday, -80, daysAhead);
        }

        // Valentine's Day (Feb 14)
        checkDate("Valentine's Day", '❤️', '02-14', -60, daysAhead);

        // Mother's Day
        var md = getMothersDay(now.getFullYear());
        if (md < today) md = getMothersDay(now.getFullYear() + 1);
        var mdDiff = Math.round((md - today) / 86400000);
        if (mdDiff >= 0 && mdDiff <= daysAhead) {
            var mdLabel = mdDiff === 0 ? 'TODAY' : mdDiff === 1 ? 'Tomorrow' : 'In ' + mdDiff + ' days';
            var mdUrg = mdDiff <= 3 ? '🚨' : mdDiff <= 7 ? '⚠️' : '📅';
            events.push({
                emoji: mdUrg + '👩',
                name: "Mother's Day",
                day: mdLabel,
                val: mdDiff === 0 ? 'TODAY!' : (mdDiff <= 3 ? 'URGENT' : mdDiff + ' days'),
                type: 'warning',
                daysOut: mdDiff,
                credCost: -60
            });
        }

        // Custom dates
        if (info.custom && info.custom.length > 0) {
            info.custom.forEach(function (c) {
                checkDate(c.name, '📌', c.date, c.cost || -50, daysAhead);
            });
        }

        // Sort by soonest first
        events.sort(function (a, b) { return a.daysOut - b.daysOut; });
        return events;
    }

    // Kids decay multiplier — more kids = faster deposit decay
    function getKidsMultiplier() {
        var info = load();
        var kids = parseInt(info.kids) || 0;
        if (kids === 0) return 1;
        if (kids === 1) return 0.9;
        if (kids === 2) return 0.75;
        if (kids === 3) return 0.6;
        return 0.5; // 4+ kids
    }

    // Check if profile has been set up
    function isConfigured() {
        var info = load();
        return !!(info.anniversary || info.birthday || (info.custom && info.custom.length > 0));
    }

    return {
        getInfo: getInfo,
        setInfo: setInfo,
        getUpcoming: getUpcoming,
        getKidsMultiplier: getKidsMultiplier,
        isConfigured: isConfigured
    };
})();
