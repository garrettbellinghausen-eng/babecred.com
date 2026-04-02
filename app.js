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

    let customModalType = 'deposit';

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

        document.getElementById('goal-add-btn').addEventListener('click', function () {
            goalName.value = '';
            goalDate.value = '';
            goalCost.value = '';
            goalModal.classList.remove('hidden');
            goalName.focus();
        });

        goalsSection.querySelectorAll('.goal-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                CredEngine.deleteGoal(this.dataset.goalId);
                renderAll();
            });
        });
    }

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
        const balTag = msg.balance !== undefined
            ? ' <span class="cm-bal ' + (msg.balance >= 0 ? 'pos' : 'neg') + '">['
            + (msg.balance >= 0 ? '+' : '') + msg.balance + ']</span>'
            : '';
        el.innerHTML = '<span class="cm-time">' + sanitize(t) + '</span>'
            + '<span class="cm-name nc' + c + '">' + sanitize(msg.name) + '</span>'
            + balTag + ': '
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
        Chat.send(userName, text, Math.round(CredEngine.calculateBalance()));
        chatInput.value = '';
        chatInput.focus();
    });

    // --- Render all ---

    function renderAll() {
        renderBalance();
        renderGoals();
        renderLedger();
    }

    renderQuickAdds();

    // --- Periodic recalculation (every 60s for decay updates) ---

    setInterval(function () {
        if (!mainApp.classList.contains('hidden')) {
            renderAll();
        }
    }, 60000);

})();
