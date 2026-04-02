# BabeCred.com Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page web app with a personal Babe Cred balance sheet (deposits with half-life decay, withdrawals with linear recovery, goal planner) and a live Firebase community chatroom, side by side.

**Architecture:** Pure static HTML/CSS/JS — no frameworks or build tools. The balance sheet engine (`cred-engine.js`) handles all decay math and localStorage persistence. The chat module (`chat.js`) handles Firebase real-time messaging and presence. The UI layer (`app.js`) wires the engine and chat to the DOM. Styles live in `style.css`. Single `index.html` entry point.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript (ES6+), Firebase Realtime Database (v10 compat SDK), localStorage, Google Fonts (Anybody, Playfair Display, DM Mono).

---

## File Structure

```
babecred.com/
├── index.html          # Page structure, all HTML
├── style.css           # All styles (layout, balance sheet, chat, modals)
├── cred-engine.js      # Decay math, localStorage CRUD, balance calc, goal planner logic
├── chat.js             # Firebase init, message send/receive, presence tracking
├── app.js              # DOM wiring, UI event handlers, render loops
└── firebase-config.js  # Firebase config object (separate for easy swapping)
```

- **`cred-engine.js`** — zero DOM dependencies. Pure data: add/remove entries, calculate decayed values, compute balance, project future balance, compute goal pace. All localStorage read/write. Testable in isolation.
- **`chat.js`** — Firebase only. Exports `initChat(config, callbacks)`. Calls back on new message, presence change. No DOM.
- **`app.js`** — the glue. Imports engine + chat, binds to DOM elements, renders UI, handles clicks. Owns the render loop that recalculates decayed balance.
- **`firebase-config.js`** — just the config object. User fills in their own Firebase credentials.

---

### Task 1: Firebase Config and Project Scaffold

**Files:**
- Create: `firebase-config.js`
- Create: `index.html` (skeleton only — head, scripts, empty body structure)

- [ ] **Step 1: Create `firebase-config.js`**

```js
// firebase-config.js
// Replace these values with your Firebase project config.
// Setup: https://console.firebase.google.com → Create project → Realtime Database → Get config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

- [ ] **Step 2: Create skeleton `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BabeCred — The System Your Relationship Runs On</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anybody:wght@400;700;900&family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- NAME MODAL -->
    <div id="name-modal" class="modal-overlay">
        <div class="modal">
            <div class="modal-brand">Babe<span>Cred</span></div>
            <p class="modal-sub">The system your relationship already runs on.</p>
            <label for="name-input">Choose a screen name:</label>
            <input type="text" id="name-input" maxlength="24" placeholder="xX_GoodBoyfriend_Xx" autocomplete="off">
            <button id="name-submit">Sign On</button>
            <p class="modal-fine">By entering you acknowledge Babe Cred as real and binding.</p>
        </div>
    </div>

    <!-- MAIN APP -->
    <div id="main-app" class="hidden">
        <!-- TOP BAR -->
        <header class="topbar">
            <div class="topbar-left">
                <div class="logo">Babe<span>Cred</span></div>
                <div class="topbar-tagline">The system your relationship already runs on.</div>
            </div>
            <div class="topbar-right">
                <span class="topbar-name" id="topbar-name"></span>
                <span class="topbar-balance" id="topbar-balance">0</span>
            </div>
        </header>

        <!-- MARQUEE -->
        <div class="marquee-bar">
            <span class="marquee-text">✦ BABE CRED ✦ "I was going to do it" does not count ✦ gas station flowers = 50% penalty ✦ forgot anniversary = -999 ✦ trash unasked = +25 ✦ "you look fine" downgraded from compliment to citation ✦ BABE CRED ✦ "I was going to do it" does not count ✦ gas station flowers = 50% penalty ✦ forgot anniversary = -999 ✦ trash unasked = +25 ✦ "you look fine" downgraded from compliment to citation ✦</span>
        </div>

        <!-- MAIN SPLIT -->
        <div class="main-split">
            <!-- LEFT: BALANCE SHEET -->
            <div class="balance-side">
                <div class="balance-header">
                    <div class="balance-label">Current Babe Cred Balance</div>
                    <div class="balance-number" id="balance-number">0</div>
                    <div class="balance-sub" id="balance-sub"></div>
                </div>

                <div class="quick-adds" id="quick-adds">
                    <!-- Rendered by app.js -->
                </div>

                <div class="goals-section" id="goals-section">
                    <!-- Rendered by app.js -->
                </div>

                <div class="ledger" id="ledger">
                    <div class="ledger-header">
                        <span>Recent Transactions</span>
                        <span>Value</span>
                    </div>
                    <div class="ledger-rows" id="ledger-rows">
                        <!-- Rendered by app.js -->
                    </div>
                </div>
            </div>

            <!-- RIGHT: CHAT -->
            <div class="chat-side">
                <div class="chat-header">
                    <div class="chat-room-name">The Lobby</div>
                    <div class="chat-online"><span class="online-dot"></span><span id="online-count">0</span> online</div>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="sys-msg"><b>BabeCredBot:</b> Welcome to the Lobby. All cred is final. No refunds. No appeals.</div>
                </div>
                <div class="chat-input-area">
                    <form id="chat-form" class="chat-form">
                        <input type="text" id="chat-input" placeholder="say something..." maxlength="500" autocomplete="off">
                        <button type="submit">Send</button>
                    </form>
                    <div class="chat-who">chatting as: <b id="chat-name"></b></div>
                </div>
            </div>
        </div>

        <!-- FOOTER -->
        <footer class="bottom-bar">
            &copy; 2025 BabeCred.com ✦ A very serious financial institution ✦ All cred reserved ✦ Data stored locally
        </footer>
    </div>

    <!-- CUSTOM ENTRY MODAL -->
    <div id="custom-modal" class="modal-overlay hidden">
        <div class="modal modal-custom">
            <div class="modal-custom-title" id="custom-modal-title">Custom Deposit</div>
            <label for="custom-desc">What did you do?</label>
            <input type="text" id="custom-desc" maxlength="60" placeholder="e.g. Fixed the leaky faucet" autocomplete="off">
            <label for="custom-value">Cred value:</label>
            <input type="number" id="custom-value" min="1" max="500" placeholder="15">
            <div id="custom-halflife-section">
                <label for="custom-halflife">How long will she remember?</label>
                <select id="custom-halflife">
                    <option value="5">A few days (5-day half-life)</option>
                    <option value="10" selected>A week or two (10-day half-life)</option>
                    <option value="21">A long time (21-day half-life)</option>
                </select>
            </div>
            <div class="modal-custom-btns">
                <button id="custom-cancel" class="btn-secondary">Cancel</button>
                <button id="custom-confirm" class="btn-primary">Add Entry</button>
            </div>
        </div>
    </div>

    <!-- GOAL MODAL -->
    <div id="goal-modal" class="modal-overlay hidden">
        <div class="modal modal-custom">
            <div class="modal-custom-title">Plan a Withdrawal</div>
            <label for="goal-name">What's the event?</label>
            <input type="text" id="goal-name" maxlength="40" placeholder="e.g. Fantasy Draft Weekend" autocomplete="off">
            <label for="goal-date">When is it?</label>
            <input type="date" id="goal-date">
            <label for="goal-cost">How much cred will it cost?</label>
            <input type="number" id="goal-cost" min="1" max="500" placeholder="80">
            <div class="modal-custom-btns">
                <button id="goal-cancel" class="btn-secondary">Cancel</button>
                <button id="goal-confirm" class="btn-primary">Set Goal</button>
            </div>
        </div>
    </div>

    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
    <script src="firebase-config.js"></script>
    <script src="cred-engine.js"></script>
    <script src="chat.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Commit scaffold**

```bash
git add index.html firebase-config.js
git commit -m "feat: scaffold index.html and firebase config"
```

---

### Task 2: Cred Engine — Data Model and localStorage

**Files:**
- Create: `cred-engine.js`

This is the core math and data engine. Zero DOM dependencies. All state in localStorage.

- [ ] **Step 1: Create `cred-engine.js` with data model and storage**

```js
// cred-engine.js — Babe Cred balance engine
// No DOM dependencies. Pure data + localStorage.

const CredEngine = (function () {
    const STORAGE_KEY = 'babecred_ledger';
    const GOALS_KEY = 'babecred_goals';
    const MS_PER_DAY = 86400000;

    // --- Presets ---

    const DEPOSIT_PRESETS = [
        { emoji: '📱', desc: 'Liked her post',         value: 1,  halfLife: 3  },
        { emoji: '💬', desc: 'Actually listened',       value: 8,  halfLife: 5  },
        { emoji: '🧹', desc: 'Cleaned the house',      value: 10, halfLife: 7  },
        { emoji: '🍳', desc: 'Made breakfast',          value: 12, halfLife: 7  },
        { emoji: '🍽️', desc: 'Cooked dinner',          value: 12, halfLife: 7  },
        { emoji: '💐', desc: 'Flowers (no reason)',     value: 15, halfLife: 10 },
        { emoji: '🗑️', desc: 'Trash (unasked)',        value: 25, halfLife: 7  },
        { emoji: '✨', desc: 'Surprise date night',     value: 30, halfLife: 14 },
        { emoji: '👶', desc: 'Took the kids',           value: 40, halfLife: 14 },
        { emoji: '✈️', desc: 'Planned a trip',          value: 60, halfLife: 28 },
    ];

    const WITHDRAWAL_PRESETS = [
        { emoji: '😐', desc: '"You look fine"',     value: -10,  recoveryRate: 2 },
        { emoji: '🎮', desc: '"One more game"',     value: -20,  recoveryRate: 2 },
        { emoji: '⛳', desc: 'Golf day',             value: -25,  recoveryRate: 2 },
        { emoji: '🍺', desc: "Boys' night out",     value: -30,  recoveryRate: 2 },
        { emoji: '🏈', desc: "Boys' weekend",       value: -80,  recoveryRate: 2 },
        { emoji: '📅', desc: 'Forgot anniversary',  value: -150, recoveryRate: 1 },
    ];

    // --- Decay Math ---

    function daysElapsed(timestamp) {
        return Math.max(0, (Date.now() - timestamp) / MS_PER_DAY);
    }

    function depositCurrentValue(entry) {
        const days = daysElapsed(entry.timestamp);
        return entry.value * Math.pow(0.5, days / entry.halfLife);
    }

    function withdrawalCurrentValue(entry) {
        const days = daysElapsed(entry.timestamp);
        return Math.min(0, entry.value + (days * entry.recoveryRate));
    }

    function entryCurrentValue(entry) {
        if (entry.type === 'deposit') return depositCurrentValue(entry);
        if (entry.type === 'withdrawal') return withdrawalCurrentValue(entry);
        return 0;
    }

    // --- Projected value at a future date ---

    function depositValueAtDate(entry, futureDate) {
        const days = Math.max(0, (futureDate - entry.timestamp) / MS_PER_DAY);
        return entry.value * Math.pow(0.5, days / entry.halfLife);
    }

    function withdrawalValueAtDate(entry, futureDate) {
        const days = Math.max(0, (futureDate - entry.timestamp) / MS_PER_DAY);
        return Math.min(0, entry.value + (days * entry.recoveryRate));
    }

    function entryValueAtDate(entry, futureDate) {
        if (entry.type === 'deposit') return depositValueAtDate(entry, futureDate);
        if (entry.type === 'withdrawal') return withdrawalValueAtDate(entry, futureDate);
        return 0;
    }

    // --- Storage ---

    function loadLedger() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveLedger(ledger) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
    }

    function loadGoals() {
        try {
            return JSON.parse(localStorage.getItem(GOALS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveGoals(goals) {
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }

    // --- Ledger Operations ---

    function addDeposit(desc, emoji, value, halfLife) {
        const ledger = loadLedger();
        ledger.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: 'deposit',
            desc: desc,
            emoji: emoji,
            value: value,
            halfLife: halfLife,
            timestamp: Date.now()
        });
        saveLedger(ledger);
    }

    function addWithdrawal(desc, emoji, value, recoveryRate) {
        const ledger = loadLedger();
        ledger.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: 'withdrawal',
            desc: desc,
            emoji: emoji,
            value: value,
            recoveryRate: recoveryRate || 2,
            timestamp: Date.now()
        });
        saveLedger(ledger);
    }

    function deleteEntry(id) {
        const ledger = loadLedger().filter(e => e.id !== id);
        saveLedger(ledger);
    }

    // --- Balance ---

    function calculateBalance() {
        const ledger = loadLedger();
        let total = 0;
        for (const entry of ledger) {
            total += entryCurrentValue(entry);
        }
        return Math.round(total * 10) / 10;
    }

    function calculateBalanceAtDate(futureDate) {
        const ledger = loadLedger();
        let total = 0;
        for (const entry of ledger) {
            total += entryValueAtDate(entry, futureDate);
        }
        return Math.round(total * 10) / 10;
    }

    // --- Ledger with current values (for display) ---

    function getLedgerWithValues() {
        const ledger = loadLedger();
        return ledger
            .map(entry => ({
                ...entry,
                currentValue: Math.round(entryCurrentValue(entry) * 10) / 10
            }))
            .filter(entry => Math.abs(entry.currentValue) >= 0.1)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    // --- Goal Planner ---

    function addGoal(name, dateStr, credCost) {
        const goals = loadGoals();
        goals.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name,
            date: new Date(dateStr).getTime(),
            cost: Math.abs(credCost) * -1
        });
        saveGoals(goals);
    }

    function deleteGoal(id) {
        const goals = loadGoals().filter(g => g.id !== id);
        saveGoals(goals);
    }

    function getGoalsWithStatus() {
        const goals = loadGoals();
        const now = Date.now();

        return goals
            .filter(g => g.date > now)
            .map(goal => {
                const daysAway = Math.ceil((goal.date - now) / MS_PER_DAY);
                const balanceAtEvent = calculateBalanceAtDate(goal.date);
                const balanceAfterHit = balanceAtEvent + goal.cost;
                const credNeeded = Math.max(0, -balanceAfterHit);
                const currentBalance = calculateBalance();
                const targetBalance = Math.abs(goal.cost);
                const progress = Math.max(0, Math.min(1,
                    (currentBalance + targetBalance) / (targetBalance * 2)
                ));
                const dailyPace = daysAway > 0 ? Math.round((credNeeded / daysAway) * 10) / 10 : credNeeded;

                return {
                    ...goal,
                    daysAway: daysAway,
                    balanceAtEvent: balanceAtEvent,
                    balanceAfterHit: Math.round(balanceAfterHit * 10) / 10,
                    credNeeded: Math.round(credNeeded * 10) / 10,
                    dailyPace: dailyPace,
                    progress: progress
                };
            })
            .sort((a, b) => a.date - b.date);
    }

    // --- Weekly trend ---

    function weeklyTrend() {
        const ledger = loadLedger();
        const oneWeekAgo = Date.now() - (7 * MS_PER_DAY);
        let depositsThisWeek = 0;
        let withdrawalsThisWeek = 0;
        for (const entry of ledger) {
            if (entry.timestamp >= oneWeekAgo) {
                if (entry.type === 'deposit') depositsThisWeek += entry.value;
                else withdrawalsThisWeek += entry.value;
            }
        }
        return { depositsThisWeek, withdrawalsThisWeek, net: depositsThisWeek + withdrawalsThisWeek };
    }

    // --- Public API ---

    return {
        DEPOSIT_PRESETS,
        WITHDRAWAL_PRESETS,
        addDeposit,
        addWithdrawal,
        deleteEntry,
        calculateBalance,
        calculateBalanceAtDate,
        getLedgerWithValues,
        addGoal,
        deleteGoal,
        getGoalsWithStatus,
        weeklyTrend,
        entryCurrentValue
    };
})();
```

- [ ] **Step 2: Verify the file loads without errors**

Open `index.html` in a browser. Open the console and type:
```
CredEngine.calculateBalance()
```
Expected: `0` (empty ledger).

Then test adding an entry:
```
CredEngine.addDeposit('Test', '🧪', 50, 7)
CredEngine.calculateBalance()
```
Expected: `50` (just added, no decay yet).

- [ ] **Step 3: Commit**

```bash
git add cred-engine.js
git commit -m "feat: cred engine with decay math, localStorage, goal planner"
```

---

### Task 3: Chat Module

**Files:**
- Create: `chat.js`

Firebase real-time chat and presence. No DOM — communicates via callbacks.

- [ ] **Step 1: Create `chat.js`**

```js
// chat.js — Firebase chat and presence module
// No DOM dependencies. Uses callbacks.

const Chat = (function () {
    let messagesRef;
    let presenceRef;
    let myPresenceRef;
    const MAX_MESSAGES = 200;

    function init(config, callbacks) {
        firebase.initializeApp(config);
        const db = firebase.database();
        messagesRef = db.ref('messages');
        presenceRef = db.ref('presence');

        // Listen for messages
        messagesRef
            .orderByChild('timestamp')
            .limitToLast(MAX_MESSAGES)
            .on('child_added', (snap) => {
                if (callbacks.onMessage) callbacks.onMessage(snap.val());
            });

        // Listen for presence changes
        presenceRef.on('value', (snap) => {
            const users = [];
            snap.forEach((child) => {
                users.push(child.val().name);
            });
            if (callbacks.onPresence) callbacks.onPresence(users);
        });
    }

    function join(userName) {
        if (!presenceRef) return;
        myPresenceRef = presenceRef.push();
        myPresenceRef.set({
            name: userName,
            joinedAt: firebase.database.ServerValue.TIMESTAMP
        });
        myPresenceRef.onDisconnect().remove();
    }

    function send(userName, text) {
        if (!messagesRef) return;
        messagesRef.push({
            name: userName,
            text: text,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    return { init, join, send };
})();
```

- [ ] **Step 2: Commit**

```bash
git add chat.js
git commit -m "feat: chat module with Firebase messaging and presence"
```

---

### Task 4: Styles

**Files:**
- Create: `style.css`

Full styles for the page: modal, topbar, marquee, split layout, balance sheet, quick adds, goals, ledger, chat, custom entry modal, goal modal. Uses the cream/mustard/burnt-orange palette from the spec.

- [ ] **Step 1: Create `style.css`**

```css
/* ============================================
   BABECRED — STYLES
   Palette: cream (#FFF8E7), mustard (#E8A317),
   burnt orange (#CC5500), deep brown (#3B1F0B),
   olive (#6B6B3C), pink (#FF6B8A)
   Fonts: Anybody, Playfair Display, DM Mono
   ============================================ */

:root {
    --cream: #FFF8E7;
    --mustard: #E8A317;
    --burnt: #CC5500;
    --brown: #3B1F0B;
    --olive: #6B6B3C;
    --pink: #FF6B8A;
    --black: #1A1108;
    --green: #008844;
    --red: #cc2200;
    --bg-dim: #F5EDD6;
    --border: rgba(59,31,11,0.15);
    --border-light: rgba(59,31,11,0.08);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; }

body {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: var(--brown);
    background: var(--cream);
}

/* Noise texture overlay */
body::before {
    content: '';
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
}

.hidden { display: none !important; }

/* === MODAL === */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(26,17,8,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(6px);
}

.modal {
    background: var(--cream);
    border: 2px solid var(--brown);
    padding: 40px 36px;
    max-width: 380px;
    width: 90%;
    text-align: center;
    animation: modalPop 0.3s ease-out;
}

@keyframes modalPop {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-brand {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 28px;
    color: var(--brown);
}
.modal-brand span { color: var(--mustard); }

.modal-sub {
    font-size: 10px;
    color: var(--olive);
    margin: 6px 0 20px;
    letter-spacing: 0.05em;
}

.modal label {
    display: block;
    text-align: left;
    font-size: 10px;
    color: var(--olive);
    margin-bottom: 4px;
    letter-spacing: 0.05em;
}

.modal input[type="text"],
.modal input[type="number"],
.modal input[type="date"],
.modal select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--olive);
    background: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--brown);
    outline: none;
    margin-bottom: 12px;
}

.modal input:focus, .modal select:focus {
    border-color: var(--mustard);
}

.modal button, .btn-primary {
    width: 100%;
    padding: 10px;
    background: var(--mustard);
    border: none;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--black);
    cursor: pointer;
    transition: background 0.2s;
}

.modal button:hover, .btn-primary:hover {
    background: var(--burnt);
    color: var(--cream);
}

.btn-secondary {
    background: none;
    border: 1px solid var(--olive);
    color: var(--olive);
    padding: 10px;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    width: 100%;
}
.btn-secondary:hover { background: var(--bg-dim); }

.modal-fine {
    font-size: 9px;
    color: var(--olive);
    margin-top: 14px;
    opacity: 0.6;
}

.modal-custom { text-align: left; max-width: 400px; }
.modal-custom-title {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 18px;
    color: var(--brown);
    margin-bottom: 16px;
    text-align: center;
}
.modal-custom-btns {
    display: flex;
    gap: 8px;
    margin-top: 4px;
}
.modal-custom-btns .btn-primary,
.modal-custom-btns .btn-secondary {
    flex: 1;
}

/* === TOPBAR === */
.topbar {
    background: var(--black);
    color: var(--cream);
    padding: 8px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}
.topbar-left { display: flex; align-items: center; gap: 16px; }
.logo {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 16px;
}
.logo span { color: var(--mustard); }
.topbar-tagline {
    font-size: 9px;
    color: rgba(255,248,231,0.4);
    letter-spacing: 0.08em;
}
.topbar-right { display: flex; align-items: center; gap: 14px; }
.topbar-name { font-size: 10px; color: rgba(255,248,231,0.5); }
.topbar-balance {
    font-weight: 700;
    font-size: 13px;
}
.topbar-balance.positive { color: var(--green); }
.topbar-balance.negative { color: var(--burnt); }

/* === MARQUEE === */
.marquee-bar {
    background: var(--mustard);
    color: var(--black);
    padding: 4px 0;
    overflow: hidden;
    white-space: nowrap;
    flex-shrink: 0;
}
.marquee-text {
    display: inline-block;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
    animation: marquee 30s linear infinite;
}
@keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}

/* === MAIN SPLIT === */
#main-app {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-split {
    flex: 1;
    display: flex;
    min-height: 0;
}

/* === LEFT: BALANCE SHEET === */
.balance-side {
    width: 50%;
    border-right: 2px solid var(--brown);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.balance-header {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, var(--cream) 0%, var(--bg-dim) 100%);
    flex-shrink: 0;
}
.balance-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--olive);
}
.balance-number {
    font-family: 'Anybody', sans-serif;
    font-weight: 900;
    font-size: 48px;
    line-height: 1;
    margin: 4px 0;
}
.balance-number.positive { color: var(--green); }
.balance-number.negative { color: var(--burnt); }
.balance-sub { font-size: 9px; color: var(--olive); }

/* Quick adds */
.quick-adds {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-dim);
    flex-shrink: 0;
}
.qa-label {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--olive);
    margin-bottom: 4px;
}
.qa-row { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.qa-btn {
    padding: 3px 8px;
    border: 1px solid var(--brown);
    background: var(--cream);
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.15s;
}
.qa-btn:hover { background: var(--mustard); color: #fff; border-color: var(--mustard); }
.qa-btn.withdraw { border-color: var(--burnt); color: var(--burnt); }
.qa-btn.withdraw:hover { background: var(--burnt); color: #fff; }
.qa-btn.custom { border-style: dashed; color: var(--olive); }

/* Goals */
.goals-section {
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    max-height: 200px;
    overflow-y: auto;
}
.goals-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px 4px;
}
.goals-title {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--olive);
    font-weight: 700;
}
.goal-add-btn {
    font-size: 9px;
    color: var(--mustard);
    cursor: pointer;
    font-weight: 700;
    background: none;
    border: none;
    font-family: 'DM Mono', monospace;
}
.goal-add-btn:hover { color: var(--burnt); }

.goal-item {
    padding: 8px 14px;
    border-bottom: 1px solid var(--border-light);
}
.goal-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
}
.goal-name { font-size: 11px; font-weight: 700; }
.goal-date-info { font-size: 9px; color: var(--olive); }
.goal-bar {
    height: 12px;
    background: #ece3cc;
    border: 1px solid var(--border);
    overflow: hidden;
    position: relative;
}
.goal-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--mustard), var(--burnt));
    transition: width 0.3s;
}
.goal-bar-text {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 8px;
    font-weight: 700;
    color: var(--brown);
}
.goal-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 9px;
    color: var(--olive);
}
.goal-delete {
    font-size: 9px;
    color: var(--olive);
    cursor: pointer;
    background: none;
    border: none;
    font-family: 'DM Mono', monospace;
    opacity: 0.5;
}
.goal-delete:hover { opacity: 1; color: var(--burnt); }

.goals-empty {
    padding: 10px 14px;
    font-size: 10px;
    color: var(--olive);
    opacity: 0.6;
    text-align: center;
}

/* Ledger */
.ledger {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
.ledger-header {
    padding: 8px 14px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--olive);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
    background: var(--cream);
}
.ledger-rows {
    flex: 1;
    overflow-y: auto;
}
.ledger-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 14px;
    border-bottom: 1px solid var(--border-light);
}
.ledger-row:hover { background: rgba(232,163,23,0.06); }
.lr-left { display: flex; align-items: center; gap: 8px; }
.lr-icon { font-size: 14px; }
.lr-desc { font-size: 11px; }
.lr-date { font-size: 9px; color: var(--olive); }
.lr-right { text-align: right; }
.lr-original { font-size: 9px; color: var(--olive); }
.lr-current { font-weight: 700; font-size: 11px; }
.lr-current.pos { color: var(--green); }
.lr-current.neg { color: var(--burnt); }
.ledger-empty {
    padding: 24px;
    text-align: center;
    color: var(--olive);
    opacity: 0.5;
    font-size: 11px;
}

/* Scrollbar styling */
.ledger-rows::-webkit-scrollbar,
.chat-messages::-webkit-scrollbar,
.goals-section::-webkit-scrollbar {
    width: 8px;
}
.ledger-rows::-webkit-scrollbar-track,
.chat-messages::-webkit-scrollbar-track,
.goals-section::-webkit-scrollbar-track {
    background: var(--bg-dim);
}
.ledger-rows::-webkit-scrollbar-thumb,
.chat-messages::-webkit-scrollbar-thumb,
.goals-section::-webkit-scrollbar-thumb {
    background: var(--olive);
    border-radius: 4px;
}

/* === RIGHT: CHAT === */
.chat-side {
    width: 50%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.chat-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-dim);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}
.chat-room-name {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    font-style: italic;
}
.chat-online { font-size: 10px; color: var(--olive); display: flex; align-items: center; gap: 6px; }
.online-dot {
    width: 6px; height: 6px;
    background: var(--green);
    border-radius: 50%;
    display: inline-block;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.sys-msg {
    font-size: 10px;
    color: var(--burnt);
    padding: 6px 10px;
    background: rgba(204,85,0,0.06);
    border-left: 2px solid var(--burnt);
    margin-bottom: 6px;
}
.chat-msg { font-size: 11px; line-height: 1.5; }
.cm-time { font-size: 9px; color: #aca899; margin-right: 4px; }
.cm-name { font-weight: 700; margin-right: 3px; }

.nc0 { color: #0055e5; }
.nc1 { color: #cc0000; }
.nc2 { color: #008844; }
.nc3 { color: #9900cc; }
.nc4 { color: #e06600; }
.nc5 { color: #009999; }
.nc6 { color: #8b0000; }
.nc7 { color: #006699; }
.nc8 { color: #cc6699; }
.nc9 { color: #336600; }

.chat-input-area {
    border-top: 1px solid var(--border);
    padding: 10px 16px;
    background: var(--bg-dim);
    flex-shrink: 0;
}
.chat-form { display: flex; gap: 8px; }
.chat-form input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid rgba(59,31,11,0.3);
    background: #fff;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    outline: none;
}
.chat-form input:focus { border-color: var(--mustard); }
.chat-form button {
    padding: 8px 18px;
    background: var(--mustard);
    border: none;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--black);
    cursor: pointer;
    width: auto;
}
.chat-form button:hover { background: var(--burnt); color: var(--cream); }
.chat-who {
    font-size: 9px;
    color: var(--olive);
    margin-top: 6px;
}

/* === FOOTER === */
.bottom-bar {
    background: var(--black);
    color: rgba(255,248,231,0.3);
    padding: 4px 20px;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    text-align: center;
    flex-shrink: 0;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
    .main-split { flex-direction: column; }
    .balance-side { width: 100%; border-right: none; border-bottom: 2px solid var(--brown); max-height: 50vh; }
    .chat-side { width: 100%; }
    .topbar-tagline { display: none; }
    .balance-number { font-size: 36px; }
}
```

- [ ] **Step 2: Verify the page renders**

Open `index.html` in a browser. You should see the name modal centered on a cream background.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: full styles for balance sheet, chat, modals"
```

---

### Task 5: App.js — DOM Wiring and Render Loop

**Files:**
- Create: `app.js`

The glue file. Wires CredEngine + Chat to the DOM. Handles all user interactions, rendering, and the periodic balance recalculation.

- [ ] **Step 1: Create `app.js`**

```js
// app.js — UI wiring for BabeCred
// Connects CredEngine and Chat to the DOM.

(function () {
    // --- Helpers ---

    function sanitize(str) {
        const el = document.createElement('div');
        el.textContent = str;
        return el.innerHTML;
    }

    function getNameColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 10;
    }

    function formatTime(ts) {
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function formatDate(ts) {
        const d = new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 86400000 && d.getDate() === now.getDate()) {
            return 'Today, ' + formatTime(ts);
        }
        if (diff < 172800000) {
            return 'Yesterday, ' + formatTime(ts);
        }
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    function setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
    }

    // --- State ---

    let userName = '';
    const COOKIE_NAME = 'babecred_name';

    // --- DOM refs ---

    const nameModal = document.getElementById('name-modal');
    const nameInput = document.getElementById('name-input');
    const nameSubmit = document.getElementById('name-submit');
    const mainApp = document.getElementById('main-app');
    const topbarName = document.getElementById('topbar-name');
    const topbarBalance = document.getElementById('topbar-balance');
    const balanceNumber = document.getElementById('balance-number');
    const balanceSub = document.getElementById('balance-sub');
    const quickAdds = document.getElementById('quick-adds');
    const goalsSection = document.getElementById('goals-section');
    const ledgerRows = document.getElementById('ledger-rows');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatName = document.getElementById('chat-name');
    const onlineCount = document.getElementById('online-count');

    // Custom modal refs
    const customModal = document.getElementById('custom-modal');
    const customTitle = document.getElementById('custom-modal-title');
    const customDesc = document.getElementById('custom-desc');
    const customValue = document.getElementById('custom-value');
    const customHalflife = document.getElementById('custom-halflife');
    const customHalflifeSection = document.getElementById('custom-halflife-section');
    const customCancel = document.getElementById('custom-cancel');
    const customConfirm = document.getElementById('custom-confirm');

    // Goal modal refs
    const goalModal = document.getElementById('goal-modal');
    const goalName = document.getElementById('goal-name');
    const goalDate = document.getElementById('goal-date');
    const goalCost = document.getElementById('goal-cost');
    const goalCancel = document.getElementById('goal-cancel');
    const goalConfirm = document.getElementById('goal-confirm');

    let customModalType = 'deposit'; // or 'withdrawal'

    // --- Sign on ---

    function signOn(name) {
        name = name.trim();
        if (!name) return;
        if (name.length > 24) name = name.substring(0, 24);

        userName = name;
        setCookie(COOKIE_NAME, name, 365);

        nameModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
        topbarName.textContent = name;
        chatName.textContent = name;

        // Init chat
        Chat.init(firebaseConfig, {
            onMessage: renderChatMessage,
            onPresence: function (users) {
                onlineCount.textContent = users.length;
            }
        });
        Chat.join(name);

        renderAll();
        chatInput.focus();
    }

    const existing = getCookie(COOKIE_NAME);
    if (existing) {
        signOn(existing);
    }

    nameSubmit.addEventListener('click', function () { signOn(nameInput.value); });
    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); signOn(nameInput.value); }
    });

    // --- Render balance ---

    function renderBalance() {
        const bal = CredEngine.calculateBalance();
        const rounded = Math.round(bal);
        const prefix = rounded >= 0 ? '+' : '';

        balanceNumber.textContent = prefix + rounded;
        balanceNumber.className = 'balance-number ' + (rounded >= 0 ? 'positive' : 'negative');

        topbarBalance.textContent = prefix + rounded + ' cred';
        topbarBalance.className = 'topbar-balance ' + (rounded >= 0 ? 'positive' : 'negative');

        const trend = CredEngine.weeklyTrend();
        const trendPrefix = trend.net >= 0 ? '▲' : '▼';
        balanceSub.textContent = trendPrefix + ' ' + Math.abs(Math.round(trend.net)) + ' this week';
    }

    // --- Render quick adds ---

    function renderQuickAdds() {
        const deposits = CredEngine.DEPOSIT_PRESETS;
        const withdrawals = CredEngine.WITHDRAWAL_PRESETS;

        let html = '<div class="qa-label">Quick Deposits</div><div class="qa-row">';
        for (const p of deposits) {
            html += '<button class="qa-btn" data-preset-type="deposit" data-idx="' + deposits.indexOf(p) + '">'
                + p.emoji + ' ' + p.desc + ' +' + p.value + '</button>';
        }
        html += '<button class="qa-btn custom" id="custom-deposit-btn">+ Custom</button>';
        html += '</div>';

        html += '<div class="qa-label">Quick Withdrawals</div><div class="qa-row">';
        for (const p of withdrawals) {
            html += '<button class="qa-btn withdraw" data-preset-type="withdrawal" data-idx="' + withdrawals.indexOf(p) + '">'
                + p.emoji + ' ' + p.desc + ' ' + p.value + '</button>';
        }
        html += '<button class="qa-btn custom" id="custom-withdrawal-btn">- Custom</button>';
        html += '</div>';

        quickAdds.innerHTML = html;

        // Bind preset clicks
        quickAdds.querySelectorAll('[data-preset-type]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const type = this.dataset.presetType;
                const idx = parseInt(this.dataset.idx);
                if (type === 'deposit') {
                    const p = deposits[idx];
                    CredEngine.addDeposit(p.desc, p.emoji, p.value, p.halfLife);
                } else {
                    const p = withdrawals[idx];
                    CredEngine.addWithdrawal(p.desc, p.emoji, p.value, p.recoveryRate);
                }
                renderAll();
            });
        });

        // Custom buttons
        document.getElementById('custom-deposit-btn').addEventListener('click', function () {
            openCustomModal('deposit');
        });
        document.getElementById('custom-withdrawal-btn').addEventListener('click', function () {
            openCustomModal('withdrawal');
        });
    }

    // --- Custom modal ---

    function openCustomModal(type) {
        customModalType = type;
        customTitle.textContent = type === 'deposit' ? 'Custom Deposit' : 'Custom Withdrawal';
        customHalflifeSection.style.display = type === 'deposit' ? 'block' : 'none';
        customDesc.value = '';
        customValue.value = '';
        customModal.classList.remove('hidden');
        customDesc.focus();
    }

    customCancel.addEventListener('click', function () {
        customModal.classList.add('hidden');
    });

    customConfirm.addEventListener('click', function () {
        const desc = customDesc.value.trim();
        const val = parseInt(customValue.value);
        if (!desc || !val || val < 1) return;

        if (customModalType === 'deposit') {
            const hl = parseInt(customHalflife.value);
            CredEngine.addDeposit(desc, '✏️', val, hl);
        } else {
            CredEngine.addWithdrawal(desc, '✏️', val * -1, 2);
        }
        customModal.classList.add('hidden');
        renderAll();
    });

    // --- Goal planner ---

    function renderGoals() {
        const goals = CredEngine.getGoalsWithStatus();

        let html = '<div class="goals-header"><span class="goals-title">🎯 Goal Planner</span>'
            + '<button class="goal-add-btn" id="goal-add-btn">+ Add Goal</button></div>';

        if (goals.length === 0) {
            html += '<div class="goals-empty">No goals set. Plan ahead for big withdrawals.</div>';
        } else {
            for (const g of goals) {
                const pct = Math.round(g.progress * 100);
                const eventDate = new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                html += '<div class="goal-item">'
                    + '<div class="goal-top">'
                    + '<span class="goal-name">' + sanitize(g.name) + ' (' + g.cost + ')</span>'
                    + '<span class="goal-date-info">' + eventDate + ' · ' + g.daysAway + ' days</span>'
                    + '</div>'
                    + '<div class="goal-bar"><div class="goal-fill" style="width:' + pct + '%"></div>'
                    + '<span class="goal-bar-text">' + g.credNeeded + ' cred to go</span></div>'
                    + '<div class="goal-stats">'
                    + '<span>~' + g.dailyPace + ' cred/day needed</span>'
                    + '<button class="goal-delete" data-goal-id="' + g.id + '">remove</button>'
                    + '</div></div>';
            }
        }

        goalsSection.innerHTML = html;

        // Bind add goal
        document.getElementById('goal-add-btn').addEventListener('click', function () {
            goalName.value = '';
            goalDate.value = '';
            goalCost.value = '';
            goalModal.classList.remove('hidden');
            goalName.focus();
        });

        // Bind delete
        goalsSection.querySelectorAll('.goal-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                CredEngine.deleteGoal(this.dataset.goalId);
                renderAll();
            });
        });
    }

    // Goal modal
    goalCancel.addEventListener('click', function () {
        goalModal.classList.add('hidden');
    });

    goalConfirm.addEventListener('click', function () {
        const name = goalName.value.trim();
        const date = goalDate.value;
        const cost = parseInt(goalCost.value);
        if (!name || !date || !cost || cost < 1) return;
        CredEngine.addGoal(name, date, cost);
        goalModal.classList.add('hidden');
        renderAll();
    });

    // --- Ledger ---

    function renderLedger() {
        const entries = CredEngine.getLedgerWithValues();

        if (entries.length === 0) {
            ledgerRows.innerHTML = '<div class="ledger-empty">No transactions yet. Start earning cred.</div>';
            return;
        }

        let html = '';
        for (const e of entries) {
            const isPos = e.currentValue >= 0;
            const prefix = isPos ? '+' : '';
            const origPrefix = e.value >= 0 ? '+' : '';
            html += '<div class="ledger-row">'
                + '<div class="lr-left">'
                + '<span class="lr-icon">' + (e.emoji || '•') + '</span>'
                + '<div><div class="lr-desc">' + sanitize(e.desc) + '</div>'
                + '<div class="lr-date">' + formatDate(e.timestamp) + '</div></div>'
                + '</div>'
                + '<div class="lr-right">'
                + '<div class="lr-current ' + (isPos ? 'pos' : 'neg') + '">' + prefix + Math.round(e.currentValue) + '</div>'
                + '<div class="lr-original">was ' + origPrefix + e.value + '</div>'
                + '</div></div>';
        }

        ledgerRows.innerHTML = html;
    }

    // --- Chat ---

    function renderChatMessage(msg) {
        const el = document.createElement('div');
        el.className = 'chat-msg';
        const c = getNameColor(msg.name);
        const t = msg.timestamp ? formatTime(msg.timestamp) : '';
        el.innerHTML = '<span class="cm-time">' + sanitize(t) + '</span>'
            + '<span class="cm-name nc' + c + '">' + sanitize(msg.name) + ':</span> '
            + sanitize(msg.text);
        chatMessages.appendChild(el);

        if (chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 120) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !userName) return;
        Chat.send(userName, text);
        chatInput.value = '';
        chatInput.focus();
    });

    // --- Render all ---

    function renderAll() {
        renderBalance();
        renderGoals();
        renderLedger();
    }

    // Render quick adds once (they don't change)
    renderQuickAdds();

    // --- Periodic recalculation (every 60s for decay updates) ---

    setInterval(function () {
        if (!mainApp.classList.contains('hidden')) {
            renderAll();
        }
    }, 60000);

})();
```

- [ ] **Step 2: Verify the full app loads**

Open `index.html` in a browser. You should see:
1. The name modal. Enter a name and click "Sign On".
2. The split view: balance sheet on left (showing 0), quick-add buttons, empty goal planner, empty ledger.
3. Chat on the right (will show Firebase errors in console until config is filled in — that's expected).
4. Click a quick-add button like "💐 Flowers +15". The balance should update to +15 and the ledger should show the entry.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: app.js DOM wiring, render loop, modals, chat integration"
```

---

### Task 6: Cleanup Old Files and Final Verification

**Files:**
- Delete: old `app.js` content (already replaced)
- Keep: `babecred-site.md` (reference material)

- [ ] **Step 1: Verify all files are in place**

Run: `ls -la *.html *.css *.js`

Expected files:
```
index.html
style.css
cred-engine.js
chat.js
app.js
firebase-config.js
```

- [ ] **Step 2: Full integration test**

Open `index.html` in a browser:

1. **Sign on** — enter a name, modal disappears, main app shows
2. **Quick add deposit** — click "🗑️ Trash +25". Balance shows +25. Ledger shows entry with "was +25".
3. **Quick add withdrawal** — click "🎮 One more game -20". Balance shows ~+5. Ledger shows both entries.
4. **Custom deposit** — click "+ Custom", fill in description "Fixed the fence", value 20, select "A week or two". Confirm. Balance increases, ledger updates.
5. **Custom withdrawal** — click "- Custom", fill in description "Poker night", value 40. Confirm. Balance decreases.
6. **Goal planner** — click "+ Add Goal", enter "Draft Weekend", a date ~30 days out, cost 80. The goal appears with progress bar, days away, and daily cred pace.
7. **Delete goal** — click "remove" on the goal. It disappears.
8. **Chat** — if Firebase is configured, type a message and send. Otherwise verify the input/button works without errors.
9. **Refresh page** — all balance data persists (localStorage). Name persists (cookie). Chat reconnects.
10. **Marquee scrolls** across the top.

- [ ] **Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete BabeCred v1 — balance sheet, decay engine, goal planner, chat"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Deposits with half-life decay | Task 2 (cred-engine.js) |
| Withdrawals with linear recovery | Task 2 (cred-engine.js) |
| Preset deposits (10 items) | Task 2 (presets) + Task 5 (render) |
| Preset withdrawals (6 items) | Task 2 (presets) + Task 5 (render) |
| Custom entries | Task 5 (custom modal) |
| Balance = running net of decayed values | Task 2 (calculateBalance) |
| Goal planner with progress/pace | Task 2 (getGoalsWithStatus) + Task 5 (render) |
| Multiple goals | Task 2 + Task 5 |
| Split 50/50 layout | Task 1 (HTML) + Task 4 (CSS) |
| Top bar with logo/balance | Task 1 + Task 4 |
| Mustard marquee | Task 1 + Task 4 |
| Chat via Firebase | Task 3 (chat.js) + Task 5 (wiring) |
| Presence tracking | Task 3 |
| localStorage for personal data | Task 2 |
| Cookie for screen name | Task 5 |
| Cream/mustard/burnt-orange palette | Task 4 |
| Anybody/Playfair/DM Mono fonts | Task 1 (Google Fonts link) + Task 4 |
| Deadpan tone | Task 1 (copy in HTML) |
| Weekly trend | Task 2 (weeklyTrend) + Task 5 (renderBalance) |
| Ledger with original + current value | Task 5 (renderLedger) |
| Responsive (mobile) | Task 4 (media query) |
