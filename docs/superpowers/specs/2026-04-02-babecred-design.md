# BabeCred.com — Design Spec

## Overview

BabeCred.com is a single-page web app that combines a **personal Babe Cred balance sheet** with a **live community chatroom**. The core concept: doing nice things for your significant other earns you credit ("deposits"), and doing things she hates burns it ("withdrawals"). The system is asymmetrically punishing — deposits decay over time, withdrawals decay much slower — so the only way to win is to **plan ahead**.

The site presents itself with deadpan seriousness, as if Babe Cred is a real financial institution. The humor comes from the absurd formality applied to relationship dynamics.

## The Babe Cred System

### Core Mechanics

The balance is a **running net calculation** of all deposits and withdrawals in the ledger, computed in real-time based on decay.

**Deposits (positive entries):**
- Decay via **half-life** (exponential)
- Each deposit type has its own half-life based on gesture magnitude
- Small gestures decay fast, big gestures linger longer
- Current value = `original_value * (0.5 ^ (days_elapsed / half_life))`

**Withdrawals (negative entries):**
- Decay via **linear recovery** at a fixed rate (default: +2 cred/day)
- A -80 boys' weekend takes ~40 days to fully clear on its own
- Current value = `min(0, original_value + (days_elapsed * daily_recovery_rate))`

### Preset Deposits

| Action | Cred Value | Half-Life |
|---|---|---|
| 📱 Liked her post | +1 | 3 days |
| 🗑️ Took out trash (unasked) | +25 | 7 days |
| 🧹 Cleaned the house | +10 | 7 days |
| 🍳 Made breakfast | +12 | 7 days |
| 💐 Flowers (no reason) | +15 | 10 days |
| 🍽️ Cooked dinner | +12 | 7 days |
| 💬 Actually listened | +8 | 5 days |
| ✨ Surprise date night | +30 | 14 days |
| 👶 Took the kids (gave her alone time) | +40 | 14 days |
| ✈️ Planned a trip | +60 | 28 days |

### Preset Withdrawals

| Action | Cred Value | Linear Recovery |
|---|---|---|
| 🎮 "One more game" | -20 | +2/day (10 days to clear) |
| 🍺 Boys' night out | -30 | +2/day (15 days) |
| ⛳ Golf day | -25 | +2/day (12.5 days) |
| 🏈 Boys' weekend | -80 | +2/day (40 days) |
| 📅 Forgot anniversary | -150 | +1/day (150 days) |
| 😐 "You look fine" | -10 | +2/day (5 days) |

### Custom Entries

Users can also add custom deposits and withdrawals:
- **Custom deposit:** user enters description, cred value, and selects a half-life tier (fast/medium/slow → 5/10/21 days)
- **Custom withdrawal:** user enters description and cred value. Linear recovery at +2/day.

### Balance Calculation

The displayed balance is recalculated in real-time:

```
balance = sum(each deposit's current decayed value) + sum(each withdrawal's current decayed value)
```

Where:
- Deposit current value: `original * 0.5^(days / half_life)` (approaches zero)
- Withdrawal current value: `min(0, original + days * recovery_rate)` (approaches zero from below)

### Key System Insight

**You are almost always negative.** The system is designed so that:
- Deposits rot — last week's flowers are worth half as much today
- Withdrawals stick — last month's boys' night is still dragging you down
- The only winning strategy is **planning ahead** for big withdrawals

## Goal Planner (The Killer Feature)

The goal planner lets you set a future event (a big withdrawal) and shows you what you need to do between now and then to survive it.

### How It Works

1. **Set the event:** Name it (e.g., "Fantasy Draft Weekend"), set the date, set the cred cost (-80)
2. **The planner calculates:**
   - Your current balance (with all decay applied)
   - What your balance will be on the event date if you do nothing (existing deposits continue decaying, existing withdrawals continue recovering)
   - The **target balance** you need on the event date to land at zero after the hit (i.e., you need to be at +80 minimum)
   - But since deposits decay, you actually need to **overshoot** — banking +80 today doesn't mean you'll have +80 in 6 weeks
   - A **daily cred pace** — how much you need to deposit per day to hit the target, accounting for decay
3. **Visual progress bar** showing how close you are to being "covered"

### Multiple Goals

Users can set multiple upcoming events. Each shows independently in the goal planner section with its own progress bar and countdown.

## Layout — Split Screen 50/50

### Top Bar
- Dark background (#1A1108)
- BabeCred logo (left)
- Tagline: "The system your relationship already runs on."
- User's screen name and mini balance display (right)

### Mustard Marquee Strip
- Scrolling ticker with deadpan notices
- Examples: "gas station flowers = 50% penalty", "forgot anniversary = -999", "'you look fine' has been downgraded from compliment to citation"

### Left Half — Personal Balance Sheet
From top to bottom:
1. **Balance display** — big number, current cred balance, weekly trend
2. **Quick-add buttons** — preset deposits and withdrawals, plus custom entry
3. **Goal planner** — upcoming events with progress bars, daily pace needed, countdowns
4. **Transaction ledger** — scrollable list of all entries showing original value, current decayed value, date, and running balance

### Right Half — Community Chat (The Lobby)
- Chat header with room name and online count
- Scrollable message area with timestamped, color-coded usernames
- System messages from BabeCredBot (deadpan style)
- Text input with send button
- Screen name display

### Footer
- Dark bar with copyright: "A very serious financial institution"

## Data Storage

### Personal Data (localStorage)
All balance sheet data is stored locally in the browser:
- Transaction ledger (array of entries with: type, description, original_value, half_life or recovery_rate, timestamp)
- Goal planner events (name, date, cred_cost)
- Screen name
- No accounts, no server-side storage for personal data

### Chat (Firebase Realtime Database)
- Messages stored in Firebase (name, text, timestamp)
- Presence tracking for online user count
- Screen name persisted via cookie

## Design Language

### From the Original .md File
- **Primary BG:** #FFF8E7 (cream)
- **Accent 1:** #E8A317 (mustard)
- **Accent 2:** #CC5500 (burnt orange)
- **Text:** #3B1F0B (deep brown)
- **Secondary Text:** #6B6B3C (olive)
- **Pop:** #FF6B8A (pink)
- **Display Font:** Anybody (900 weight, headlines)
- **Serif Font:** Playfair Display (italic subheads)
- **Body Font:** DM Mono (monospace, retro feel)

### Tone
- Finance language: deposits, withdrawals, balance, ledger, transactions, interest, decay, portfolio
- Presented completely straight-faced
- The humor comes from the content, not the design
- Deadpan notices in the marquee and system messages

## Tech Stack

- **Single HTML file** with embedded CSS and JS (or small set of static files: index.html, style.css, app.js)
- **Firebase Realtime Database** for live chat and presence
- **localStorage** for personal balance sheet data
- **No build tools, no framework** — pure HTML/CSS/JS
- **Hosting:** Static files on Vercel (free tier), DNS pointed from babecred.com

## Out of Scope (for v1)

- User accounts / server-side data storage
- Multiple chat rooms
- Sharing your balance sheet with others
- Mobile app
- Blog / content pages (can be added later)
- Configurable decay rates (use sensible defaults)
