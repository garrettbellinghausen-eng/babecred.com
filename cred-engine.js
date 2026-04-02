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
        { emoji: '🏀', desc: 'Final 4 w/ the UConn boys', value: -200, recoveryRate: 1 },
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
