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

    // Wizard refs
    const customModal = document.getElementById('custom-modal');
    const customTitle = document.getElementById('custom-modal-title');
    const wizSteps = document.querySelectorAll('#wizard-steps .wstep');
    const wizPages = [
        document.getElementById('wiz-step-1'),
        document.getElementById('wiz-step-2'),
        document.getElementById('wiz-step-3'),
        document.getElementById('wiz-step-4')
    ];
    const wizCategories = document.getElementById('wiz-categories');
    const wizEffort = document.getElementById('wiz-effort');
    const wizModifier = document.getElementById('wiz-modifier');
    const wizEstimate = document.getElementById('wiz-estimate');
    const wizDesc = document.getElementById('wiz-desc');
    const wizSummary = document.getElementById('wiz-summary');
    const wizBack = document.getElementById('wiz-back');
    const wizNext = document.getElementById('wiz-next');
    const wizStep2Label = document.getElementById('wiz-step2-label');
    const wizStep3Label = document.getElementById('wiz-step3-label');

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

    // --- Custom wizard ---

    var DEPOSIT_CATS = [
        { id: 'service', emoji: '🧹', name: 'Acts of Service', hint: 'Cleaning, cooking, errands, fixing' },
        { id: 'time', emoji: '🕐', name: 'Quality Time', hint: 'Date night, activity, attention' },
        { id: 'gift', emoji: '🎁', name: 'Gifts & Gestures', hint: 'Flowers, surprise, thoughtful' },
        { id: 'words', emoji: '💬', name: 'Words & Attention', hint: 'Compliment, listening, remembering' },
        { id: 'kids', emoji: '👶', name: 'Kid Duty', hint: 'Took kids, school, bedtime' },
        { id: 'above', emoji: '✈️', name: 'Above & Beyond', hint: 'Trip, major surprise, big effort' }
    ];
    var WITHDRAW_CATS = [
        { id: 'screen', emoji: '🎮', name: 'Screen Time', hint: 'Gaming, phone, TV binge' },
        { id: 'social', emoji: '🍺', name: 'Boys Night / Social', hint: 'Night out, sports bar, group' },
        { id: 'solo', emoji: '🏌️', name: 'Solo Activity', hint: 'Golf, fishing, hobby day' },
        { id: 'forgot', emoji: '🗓️', name: 'Forgot Something', hint: 'Anniversary, plans, promise' },
        { id: 'said', emoji: '🤦', name: 'Said Something Dumb', hint: '"You look fine", etc.' },
        { id: 'trip', emoji: '✈️', name: 'Trip / Weekend Away', hint: 'Multi-day absence' }
    ];
    var DEP_EFFORT = [
        { label: 'Quick (5 min or less)', hint: 'Took out trash, liked a post', base: 3, halfLife: 3 },
        { label: 'Some effort (30-60 min)', hint: 'Cooked dinner, cleaned up', base: 12, halfLife: 7 },
        { label: 'Real effort (1-2 hours)', hint: 'Date night, deep clean, project', base: 25, halfLife: 10 },
        { label: 'Major effort (half day+)', hint: 'Took kids all day, planned a trip', base: 45, halfLife: 21 },
        { label: 'Legendary (full day+)', hint: 'Surprise getaway, huge gesture', base: 60, halfLife: 28 }
    ];
    var WIT_DURATION = [
        { label: 'A quick moment', hint: '"You look fine", eye roll', base: -8, rate: 2 },
        { label: 'A few hours', hint: 'Gaming session, sports bar', base: -20, rate: 2 },
        { label: 'Half a day', hint: 'Golf day, long hobby session', base: -35, rate: 2 },
        { label: 'Full day', hint: 'All-day with the boys', base: -55, rate: 2 },
        { label: 'Weekend', hint: 'Boys weekend, tournament', base: -80, rate: 2 },
        { label: 'Multi-day trip', hint: 'Final 4, bachelor party', base: -150, rate: 1 }
    ];
    var DEP_MODIFIER = [
        { label: 'She asked me to', hint: 'Still good but expected', mult: 0.7 },
        { label: 'Unprompted — I just did it', hint: 'She didn\'t even have to ask', mult: 1.0 },
        { label: 'She didn\'t even know she wanted it', hint: 'Anticipation — top tier', mult: 1.4 }
    ];
    var WIT_MODIFIER = [
        { label: 'She won\'t even notice', hint: 'Barely registers', mult: 0.5 },
        { label: 'Mildly annoyed', hint: 'The look. You know the look.', mult: 1.0 },
        { label: 'Actually upset', hint: 'Silent treatment territory', mult: 1.4 },
        { label: 'Sleeping on the couch', hint: 'You are in danger', mult: 2.0 }
    ];

    var wizState = { type: 'deposit', step: 1, cat: null, effort: null, modifier: null };

    function openCustomModal(type) {
        wizState = { type: type, step: 1, cat: null, effort: null, modifier: null };
        customModalType = type;
        customTitle.textContent = type === 'deposit' ? 'Custom Deposit' : 'Custom Withdrawal';
        wizDesc.value = '';
        customModal.classList.remove('hidden');
        renderWizardStep();
    }

    function renderWizardStep() {
        var s = wizState.step;
        wizPages.forEach(function (p, i) { p.classList.toggle('hidden', i !== s - 1); });
        wizSteps.forEach(function (el, i) {
            el.classList.remove('active', 'done');
            if (i + 1 === s) el.classList.add('active');
            if (i + 1 < s) el.classList.add('done');
        });
        wizBack.textContent = s === 1 ? 'Cancel' : 'Back';
        wizNext.textContent = s === 4 ? 'Add Entry' : 'Next';

        if (s === 1) renderWizCategories();
        if (s === 2) renderWizEffort();
        if (s === 3) renderWizModifier();
        if (s === 4) renderWizReview();
    }

    function renderWizCategories() {
        var cats = wizState.type === 'deposit' ? DEPOSIT_CATS : WITHDRAW_CATS;
        wizCategories.innerHTML = '';
        cats.forEach(function (c) {
            var el = document.createElement('div');
            el.className = 'wiz-cat' + (wizState.cat === c.id ? ' selected' : '');
            el.innerHTML = '<div class="wiz-cat-emoji">' + c.emoji + '</div>'
                + '<div class="wiz-cat-name">' + c.name + '</div>'
                + '<div class="wiz-cat-hint">' + c.hint + '</div>';
            el.addEventListener('click', function () {
                wizState.cat = c.id;
                wizState.catEmoji = c.emoji;
                wizState.catName = c.name;
                renderWizCategories();
            });
            wizCategories.appendChild(el);
        });
    }

    function renderWizEffort() {
        var opts = wizState.type === 'deposit' ? DEP_EFFORT : WIT_DURATION;
        wizStep2Label.textContent = wizState.type === 'deposit' ? 'How much effort was this?' : 'How long is this?';
        wizEffort.innerHTML = '';
        opts.forEach(function (o, i) {
            var el = document.createElement('div');
            el.className = 'wiz-option' + (wizState.effort === i ? ' selected' : '');
            var valCls = wizState.type === 'deposit' ? 'pos' : 'neg';
            var prefix = o.base >= 0 ? '+' : '';
            el.innerHTML = '<div><div class="wiz-option-label">' + o.label + '</div>'
                + '<div class="wiz-option-hint">' + o.hint + '</div></div>'
                + '<div class="wiz-option-val ' + valCls + '">' + prefix + o.base + '</div>';
            el.addEventListener('click', function () {
                wizState.effort = i;
                wizState.effortData = o;
                renderWizEffort();
            });
            wizEffort.appendChild(el);
        });
    }

    function renderWizModifier() {
        var opts = wizState.type === 'deposit' ? DEP_MODIFIER : WIT_MODIFIER;
        wizStep3Label.textContent = wizState.type === 'deposit' ? 'Was it asked for?' : 'How mad is she?';
        wizModifier.innerHTML = '';
        opts.forEach(function (o, i) {
            var el = document.createElement('div');
            el.className = 'wiz-option' + (wizState.modifier === i ? ' selected' : '');
            var multLabel = o.mult === 1.0 ? '1x' : o.mult + 'x';
            el.innerHTML = '<div><div class="wiz-option-label">' + o.label + '</div>'
                + '<div class="wiz-option-hint">' + o.hint + '</div></div>'
                + '<div class="wiz-option-val">' + multLabel + '</div>';
            el.addEventListener('click', function () {
                wizState.modifier = i;
                wizState.modData = o;
                renderWizModifier();
            });
            wizModifier.appendChild(el);
        });
    }

    function calcWizValue() {
        if (!wizState.effortData || !wizState.modData) return 0;
        return Math.round(wizState.effortData.base * wizState.modData.mult);
    }

    function renderWizReview() {
        var val = calcWizValue();
        var prefix = val >= 0 ? '+' : '';
        var cls = val >= 0 ? 'pos' : 'neg';
        wizEstimate.innerHTML = '<div class="wiz-est-num ' + cls + '">' + prefix + val + '</div>'
            + '<div class="wiz-est-label">estimated babe cred</div>';

        var lines = [];
        lines.push('Category: ' + (wizState.catEmoji || '') + ' ' + (wizState.catName || ''));
        lines.push('Effort: ' + (wizState.effortData ? wizState.effortData.label : ''));
        lines.push('Modifier: ' + (wizState.modData ? wizState.modData.label + ' (' + wizState.modData.mult + 'x)' : ''));
        if (wizState.type === 'deposit') {
            lines.push('Half-life: ' + (wizState.effortData ? wizState.effortData.halfLife + ' days' : ''));
        } else {
            lines.push('Recovery: +' + (wizState.effortData ? wizState.effortData.rate : 2) + '/day');
        }
        wizSummary.innerHTML = lines.join('<br>');
    }

    wizBack.addEventListener('click', function () {
        if (wizState.step === 1) {
            customModal.classList.add('hidden');
        } else {
            wizState.step--;
            renderWizardStep();
        }
    });

    wizNext.addEventListener('click', function () {
        if (wizState.step === 1 && wizState.cat === null) return;
        if (wizState.step === 2 && wizState.effort === null) return;
        if (wizState.step === 3 && wizState.modifier === null) return;

        if (wizState.step < 4) {
            wizState.step++;
            renderWizardStep();
        } else {
            // Submit
            var val = calcWizValue();
            var desc = wizDesc.value.trim() || wizState.catName;
            var emoji = wizState.catEmoji || '✏️';
            if (wizState.type === 'deposit') {
                CredEngine.addDeposit(desc, emoji, Math.abs(val), wizState.effortData.halfLife);
            } else {
                CredEngine.addWithdrawal(desc, emoji, val, wizState.effortData.rate || 2);
            }
            customModal.classList.add('hidden');
            renderAll();
        }
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
            html += '<div class="ledger-swipe" data-entry-id="' + e.id + '">'
                + '<div class="ledger-row">'
                + '<div class="lr-left">'
                + '<span class="lr-icon">' + (e.emoji || '•') + '</span>'
                + '<div><div class="lr-desc">' + sanitize(e.desc) + '</div>'
                + '<div class="lr-date">' + formatDate(e.timestamp) + '</div></div>'
                + '</div>'
                + '<div class="lr-right">'
                + '<div class="lr-current ' + (isPos ? 'pos' : 'neg') + '">' + prefix + Math.round(e.currentValue) + '</div>'
                + '<div class="lr-original">was ' + origPrefix + e.value + '</div>'
                + '</div></div>'
                + '<div class="lr-delete">Delete</div>'
                + '</div>';
        }

        ledgerRows.innerHTML = html;
        bindSwipeToDelete();
    }

    // --- Swipe to delete ---

    function bindSwipeToDelete() {
        var rows = ledgerRows.querySelectorAll('.ledger-swipe');
        rows.forEach(function (row) {
            var startX = 0;
            var currentX = 0;
            var swiping = false;
            var rowInner = row.querySelector('.ledger-row');
            var deleteBtn = row.querySelector('.lr-delete');
            var threshold = 70;

            function onStart(x) {
                swiping = true;
                startX = x;
                currentX = 0;
                rowInner.style.transition = 'none';
            }

            function onMove(x) {
                if (!swiping) return;
                currentX = Math.min(0, x - startX);
                if (currentX < -threshold) currentX = -threshold - (currentX + threshold) * 0.2;
                rowInner.style.transform = 'translateX(' + currentX + 'px)';
            }

            function onEnd() {
                if (!swiping) return;
                swiping = false;
                rowInner.style.transition = 'transform 0.2s ease';
                if (currentX < -threshold * 0.6) {
                    rowInner.style.transform = 'translateX(-' + threshold + 'px)';
                    row.classList.add('swiped');
                } else {
                    rowInner.style.transform = 'translateX(0)';
                    row.classList.remove('swiped');
                }
            }

            // Touch
            rowInner.addEventListener('touchstart', function (e) {
                onStart(e.touches[0].clientX);
            }, { passive: true });
            rowInner.addEventListener('touchmove', function (e) {
                onMove(e.touches[0].clientX);
            }, { passive: true });
            rowInner.addEventListener('touchend', onEnd);

            // Mouse
            rowInner.addEventListener('mousedown', function (e) {
                e.preventDefault();
                onStart(e.clientX);
            });
            document.addEventListener('mousemove', function (e) {
                onMove(e.clientX);
            });
            document.addEventListener('mouseup', onEnd);

            // Delete button
            deleteBtn.addEventListener('click', function () {
                var id = row.dataset.entryId;
                row.style.transition = 'opacity 0.2s, max-height 0.2s';
                row.style.opacity = '0';
                row.style.maxHeight = '0';
                row.style.overflow = 'hidden';
                setTimeout(function () {
                    CredEngine.deleteEntry(id);
                    renderAll();
                }, 200);
            });
        });
    }

    // --- Chat ---

    function balEmoji(bal) {
        if (bal >= 200) return '👑 ';
        if (bal >= 100) return '🔥 ';
        if (bal >= 50) return '💪 ';
        if (bal <= -200) return '💀 ';
        if (bal <= -100) return '🚨 ';
        if (bal <= -50) return '😬 ';
        return '';
    }

    function renderChatMessage(msg) {
        const el = document.createElement('div');
        el.className = 'chat-msg';
        const c = getNameColor(msg.name);
        const t = msg.timestamp ? formatTime(msg.timestamp) : '';
        var balTag = '';
        if (msg.balance !== undefined) {
            const emoji = balEmoji(msg.balance);
            const cls = msg.balance >= 0 ? 'pos' : 'neg';
            const prefix = msg.balance >= 0 ? '+' : '';
            balTag = ' <span class="cm-bal ' + cls + '">' + emoji + '[' + prefix + msg.balance + ']</span>';
        }
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

    // --- Mobile tab switching ---

    const mobileTabs = document.getElementById('mobile-tabs');
    const balanceSide = document.querySelector('.balance-side');
    const chatSide = document.querySelector('.chat-side');

    if (mobileTabs) {
        mobileTabs.addEventListener('click', function (e) {
            const tab = e.target.closest('.mobile-tab');
            if (!tab) return;
            const target = tab.dataset.tab;

            mobileTabs.querySelectorAll('.mobile-tab').forEach(function (t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');

            if (target === 'cred') {
                balanceSide.classList.remove('mobile-hidden');
                chatSide.classList.add('mobile-hidden');
            } else {
                balanceSide.classList.add('mobile-hidden');
                chatSide.classList.remove('mobile-hidden');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });

        // Default: show cred tab, hide chat on mobile
        if (window.innerWidth <= 768) {
            chatSide.classList.add('mobile-hidden');
        }
    }

    // --- Mobile: Big Add Buttons + Emoji Grid ---

    var mobileAddGrid = document.getElementById('mobile-add-grid');
    var mobileDepBtn = document.getElementById('mobile-dep-btn');
    var mobileWitBtn = document.getElementById('mobile-wit-btn');
    var mobileGridMode = null; // 'deposit' or 'withdrawal' or null

    function renderMobileGrid(type) {
        if (mobileGridMode === type) {
            // Toggle off
            mobileGridMode = null;
            mobileAddGrid.innerHTML = '';
            mobileDepBtn.classList.remove('active');
            mobileWitBtn.classList.remove('active');
            return;
        }
        mobileGridMode = type;
        mobileDepBtn.classList.toggle('active', type === 'deposit');
        mobileWitBtn.classList.toggle('active', type === 'withdrawal');

        var presets = type === 'deposit' ? CredEngine.DEPOSIT_PRESETS : CredEngine.WITHDRAWAL_PRESETS;
        var html = '';
        presets.forEach(function (p, i) {
            var valCls = type === 'deposit' ? 'pos' : 'neg';
            var prefix = p.value >= 0 ? '+' : '';
            html += '<div class="mag-item" data-type="' + type + '" data-idx="' + i + '">'
                + '<div class="mag-emoji">' + p.emoji + '</div>'
                + '<div class="mag-name">' + p.desc + '</div>'
                + '<div class="mag-val ' + valCls + '">' + prefix + p.value + '</div>'
                + '</div>';
        });
        html += '<div class="mag-item custom-item" data-type="' + type + '" data-idx="custom">'
            + '<div class="mag-emoji">✏️</div>'
            + '<div class="mag-name">Custom</div>'
            + '<div class="mag-val">?</div>'
            + '</div>';
        mobileAddGrid.innerHTML = html;

        mobileAddGrid.querySelectorAll('.mag-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var idx = this.dataset.idx;
                var t = this.dataset.type;
                if (idx === 'custom') {
                    openCustomModal(t);
                } else {
                    var p = (t === 'deposit' ? CredEngine.DEPOSIT_PRESETS : CredEngine.WITHDRAWAL_PRESETS)[parseInt(idx)];
                    if (t === 'deposit') {
                        CredEngine.addDeposit(p.desc, p.emoji, p.value, p.halfLife);
                    } else {
                        CredEngine.addWithdrawal(p.desc, p.emoji, p.value, p.recoveryRate);
                    }
                    renderAll();
                    // Brief flash
                    item.style.background = 'rgba(232,163,23,0.2)';
                    setTimeout(function () { item.style.background = ''; }, 300);
                }
            });
        });
    }

    if (mobileDepBtn) {
        mobileDepBtn.addEventListener('click', function () { renderMobileGrid('deposit'); });
    }
    if (mobileWitBtn) {
        mobileWitBtn.addEventListener('click', function () { renderMobileGrid('withdrawal'); });
    }

    // --- Periodic recalculation (every 60s for decay updates) ---

    setInterval(function () {
        if (!mainApp.classList.contains('hidden')) {
            renderAll();
        }
    }, 60000);

})();
