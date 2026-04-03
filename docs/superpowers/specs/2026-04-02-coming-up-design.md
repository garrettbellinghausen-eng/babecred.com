# Coming Up — Sports & Weather Suggestions Design Spec

## Overview

A new "Coming Up" section on the balance sheet that surfaces context-aware withdrawal suggestions based on the sports calendar and Boston-area weather. Sits between the commentary and regular recommendations. Only appears when there's something relevant within the next 3 days.

## Sports Calendar Engine

### Seasons (determined by current date)

| Sport | Season | Teams/Events |
|---|---|---|
| NFL | Sep 1 – Feb 15 | Patriots, plus Super Bowl |
| NBA | Oct 15 – Jun 30 | Celtics, plus March Madness (Mar 15 – Apr 8), NBA Finals |
| NHL | Oct 1 – Jun 30 | Bruins, plus Stanley Cup Finals |
| MLB | Apr 1 – Oct 31 | Red Sox |
| Golf | Apr 1 – Aug 31 | Masters (Apr), US Open (Jun), The Open (Jul), PGA Championship (May) |

### Game Day Logic

No live API. Uses day-of-week patterns per season:

- **NFL (Sep-Feb):** Sundays are game days. Also Monday nights, Thursday nights. Super Bowl Sunday (first Sunday in February).
- **NBA (Oct-Jun):** Games ~3-4 nights/week. Suggest on Tue/Wed/Fri/Sat during season. Playoffs: daily.
- **NHL (Oct-Jun):** Games ~3 nights/week. Suggest on Mon/Tue/Thu/Sat during season.
- **MLB (Apr-Oct):** Games nearly daily. Suggest on Fri/Sat/Sun (weekend series).
- **Golf majors:** Hardcoded weekends (Thu-Sun of each major).

### Tentpole Events (Hardcoded)

These are the big ones with exact-ish dates that recur annually:

| Event | Approximate Date | Cred Cost |
|---|---|---|
| Super Bowl Sunday | 1st Sunday in Feb | -80 |
| March Madness First Weekend | 3rd weekend of Mar | -40 |
| March Madness Final Four | 1st weekend of Apr | -60 |
| Masters Weekend | 2nd weekend of Apr | -30 |
| NBA Playoffs (any round) | Apr-Jun | -25 |
| Stanley Cup Finals | Jun | -30 |
| NBA Finals | Jun | -40 |
| NFL Draft Weekend | Last weekend of Apr | -25 |
| PGA Championship | 3rd weekend of May | -25 |
| US Open (Golf) | 3rd weekend of Jun | -25 |
| The Open Championship | 3rd weekend of Jul | -25 |
| NFL Season Opener | 1st Thursday of Sep | -25 |
| NFL Sundays (regular) | Every Sunday Sep-Jan | -20 |
| Celtics game night | In-season weeknights | -15 |
| Bruins game night | In-season weeknights | -15 |
| Red Sox weekend | Fri-Sun Apr-Oct | -15 |
| Patriots Monday Night | Monday in NFL season | -20 |

### Suggestion Format

Each sports suggestion includes:
- Emoji (🏈🏀🏒⚾⛳)
- Event name ("Celtics tonight", "Super Bowl Sunday", "March Madness")  
- Day ("Tonight", "Tomorrow", "Saturday")
- Cred cost
- Type: always 'withdrawal'
- Recovery rate: 2/day for regular games, 1/day for championship events

## Weather-Based Golf Suggestions

### API

Open-Meteo free API (no key required):
```
https://api.open-meteo.com/v1/forecast?latitude=42.36&longitude=-71.06&daily=temperature_2m_max,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America/New_York&forecast_days=3
```

### Logic

- Fetch on page load (cache result for 3 hours in localStorage)
- Check Saturday and Sunday forecasts
- If temp >= 60°F AND precipitation probability < 30%: surface golf suggestion
- Suggestion: "⛳ Golf weather Saturday (68°F) -25"
- Only show Fri through Sun (planning window)

### Fallback

If API fails or is unavailable, skip weather suggestions silently. No error shown to user.

## UI

### Placement

Between commentary section and "Recommended Actions" section.

### Rendering

```
[ Coming Up ]
🏀 Celtics tonight  -15  |  ⛳ Golf Sat (68°F)  -25  |  🏈 Patriots Sunday  -20
```

- Horizontal scrollable strip (same style as recommendations)
- Section header: "Coming Up" with a small calendar icon
- Each item is one-tap to log (same as recommendations — instant add, timestamp now)
- Section hidden entirely if nothing is coming up in next 3 days

### Styling

- Same `.sa-item` card style as recommendations
- Date/day shown in small text under the event name
- Section label styled like `.sa-label`

## Data Flow

1. On page load / renderBalance():
   - `ComingUp.getSportsEvents()` checks current date against season calendar and tentpole events, returns events within 3 days
   - `ComingUp.getWeatherSuggestions()` checks cached weather or fetches from Open-Meteo, returns golf suggestions if conditions met
   - Combined into the "Coming Up" strip
2. One-tap logs the entry directly (same pattern as recommendations)
3. Weather cached in localStorage for 3 hours to avoid excessive API calls

## Files

- Create: `coming-up.js` — sports calendar, weather fetch, suggestion generation
- Modify: `index.html` — add Coming Up section div
- Modify: `style.css` — add Coming Up label style (reuse existing `.sa-*` styles)
- Modify: `app.js` — render Coming Up section, bind click handlers

## Out of Scope

- Live game scores or results
- User-configurable teams (Boston-focused for now)
- Push notifications for upcoming events
- Historical sports data
