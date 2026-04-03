// app.js — UI wiring for BabeCred
// Connects CredEngine and Chat to the DOM.

// Global: full-screen image viewer
function openFullImage(src) {
    var overlay = document.createElement('div');
    overlay.className = 'chat-img-full';
    overlay.innerHTML = '<img src="' + src + '">';
    overlay.addEventListener('click', function () { overlay.remove(); });
    document.body.appendChild(overlay);
}

(function () {
    // --- Helpers ---

    function sanitize(str) {
        var el = document.createElement('div');
        el.textContent = str;
        return el.innerHTML;
    }

    function getNameColor(name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 10;
    }

    function formatTime(ts) {
        return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function formatDate(ts) {
        var d = new Date(ts);
        var now = new Date();
        var diff = now - d;
        if (diff < 86400000 && d.getDate() === now.getDate()) return 'Today, ' + formatTime(ts);
        if (diff < 172800000) return 'Yesterday, ' + formatTime(ts);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    function setCookie(name, value, days) {
        var expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
    }

    // --- State ---
    var userName = '';
    var COOKIE_NAME = 'babecred_name';

    // --- DOM refs ---
    var onboarding = document.getElementById('onboarding');
    var nameInput = document.getElementById('name-input');
    var nameSubmit = document.getElementById('name-submit');
    var anonSubmit = document.getElementById('anon-submit');
    var mainApp = document.getElementById('main-app');
    var topbarName = document.getElementById('topbar-name');
    var topbarBalance = document.getElementById('topbar-balance');
    var balanceNumber = document.getElementById('balance-number');
    var balanceSub = document.getElementById('balance-sub');
    var ledgerRows = document.getElementById('ledger-rows');
    var chatMessages = document.getElementById('chat-messages');
    var chatForm = document.getElementById('chat-form');
    var chatInput = document.getElementById('chat-input');
    var chatName = document.getElementById('chat-name');
    var onlineCount = document.getElementById('online-count');
    var addEntryBtn = document.getElementById('add-entry-btn');

    // Wizard refs
    var customModal = document.getElementById('custom-modal');
    var customTitle = document.getElementById('custom-modal-title');
    var wizSteps = document.querySelectorAll('#wizard-steps .wstep');
    var wizPages = [
        document.getElementById('wiz-step-1'),
        document.getElementById('wiz-step-2'),
        document.getElementById('wiz-step-3'),
        document.getElementById('wiz-step-4'),
        document.getElementById('wiz-step-5')
    ];
    var wizCategories = document.getElementById('wiz-categories');
    var wizEffort = document.getElementById('wiz-effort');
    var wizModifier = document.getElementById('wiz-modifier');
    var wizEstimate = document.getElementById('wiz-estimate');
    var wizDesc = document.getElementById('wiz-desc');
    var wizSummary = document.getElementById('wiz-summary');
    var wizBack = document.getElementById('wiz-back');
    var wizNext = document.getElementById('wiz-next');
    var wizStep3Label = document.getElementById('wiz-step3-label');
    var wizStep4Label = document.getElementById('wiz-step4-label');
    var wizDateInput = document.getElementById('wiz-date');

    // --- Onboarding page navigation ---

    var obPages = [
        document.getElementById('ob-page-1'),
        document.getElementById('ob-page-2'),
        document.getElementById('ob-page-3'),
        document.getElementById('ob-page-4')
    ];

    function showObPage(n) {
        obPages.forEach(function (p) { p.classList.add('hidden'); });
        obPages[n].classList.remove('hidden');
    }

    document.getElementById('ob-next-1').addEventListener('click', function () { showObPage(1); });
    document.getElementById('ob-next-2').addEventListener('click', function () { showObPage(2); });
    document.getElementById('ob-next-3').addEventListener('click', function () { showObPage(3); });

    // --- Sign on ---

    var isAnon = false;

    function signOn(name, anonymous) {
        name = name.trim();
        if (!name) return;
        if (name.length > 24) name = name.substring(0, 24);
        userName = name;
        isAnon = !!anonymous;
        if (!isAnon) setCookie(COOKIE_NAME, name, 365);
        onboarding.classList.add('hidden');
        mainApp.classList.remove('hidden');
        topbarName.textContent = name;
        chatName.textContent = name;

        try {
            Chat.init(firebaseConfig, {
                onMessage: renderChatMessage,
                onPresence: function (users) { onlineCount.textContent = users.length; }
            });
            Chat.join(name);
        } catch (e) {
            console.warn('Chat init failed:', e);
        }
        renderAll();
        chatInput.focus();
    }

    // --- Render balance ---

    var commentText = document.getElementById('comment-text');
    var commentInsight = document.getElementById('comment-insight');
    var saItems = document.getElementById('sa-items');

    // Auto sign-on if cookie exists (skip onboarding)
    var existing = getCookie(COOKIE_NAME);
    if (existing) signOn(existing);

    nameSubmit.addEventListener('click', function () { signOn(nameInput.value); });
    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); signOn(nameInput.value); }
    });
    anonSubmit.addEventListener('click', function () {
        signOn('Anonymous_' + Math.floor(Math.random() * 9999), true);
    });

    function renderBalance() {
        var bal = CredEngine.calculateBalance();
        var rounded = Math.round(bal);
        var prefix = rounded >= 0 ? '+' : '';
        balanceNumber.textContent = prefix + rounded;
        balanceNumber.className = 'balance-number ' + (rounded >= 0 ? 'positive' : 'negative');
        topbarBalance.textContent = prefix + rounded + ' cred';
        topbarBalance.className = 'topbar-balance ' + (rounded >= 0 ? 'positive' : 'negative');
        var trend = CredEngine.weeklyTrend();
        var trendPrefix = trend.net >= 0 ? '▲' : '▼';
        balanceSub.textContent = trendPrefix + ' ' + Math.abs(Math.round(trend.net)) + ' this week';

        // Commentary
        commentText.textContent = CommentEngine.getComment(rounded);
        var ledger = CredEngine.getLedgerWithValues();
        commentInsight.innerHTML = CommentEngine.getInsight(rounded, ledger);

        // Suggested actions
        var suggestions = CommentEngine.getSuggestions(rounded);
        var html = '';
        suggestions.forEach(function (s) {
            var valCls = s.type === 'deposit' ? 'pos' : 'neg';
            html += '<div class="sa-item" data-sa-type="' + s.type + '" data-sa-emoji="' + s.emoji + '" data-sa-name="' + s.name + '" data-sa-val="' + s.val + '">'
                + '<div class="sa-emoji">' + s.emoji + '</div>'
                + '<div class="sa-name">' + s.name + '</div>'
                + '<div class="sa-val ' + valCls + '">' + s.val + '</div>'
                + '</div>';
        });
        saItems.innerHTML = html;

        // Bind suggestion clicks -> open wizard pre-filled
        saItems.querySelectorAll('.sa-item').forEach(function (item) {
            item.addEventListener('click', function () {
                var type = this.dataset.saType;
                // Open the wizard at step 1 with type pre-selected
                wizState = { type: type, step: 2, cat: null, effort: null, modifier: null, when: null, whenDate: null };
                customTitle.textContent = type === 'deposit' ? 'Deposit' : 'Withdrawal';
                wizDesc.value = '';
                wizDateInput.classList.add('hidden');
                customModal.classList.remove('hidden');
                renderWizardStep();
            });
        });
    }

    // =============================================
    // ENTRY WIZARD — 5 steps
    // 1. Deposit or Withdrawal
    // 2. Category
    // 3. Effort / Duration
    // 4. Modifier (asked for? / damage level)
    // 5. When + Description + Review
    // =============================================

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

    var wizState = { type: null, step: 1, cat: null, effort: null, modifier: null, when: null, whenDate: null };

    // Open wizard
    addEntryBtn.addEventListener('click', function () {
        wizState = { type: null, step: 1, cat: null, effort: null, modifier: null, when: null, whenDate: null };
        customTitle.textContent = 'New Entry';
        wizDesc.value = '';
        wizDateInput.classList.add('hidden');
        customModal.classList.remove('hidden');
        renderWizardStep();
    });

    function renderWizardStep() {
        var s = wizState.step;
        wizPages.forEach(function (p, i) { p.classList.toggle('hidden', i !== s - 1); });
        wizSteps.forEach(function (el, i) {
            el.classList.remove('active', 'done');
            if (i + 1 === s) el.classList.add('active');
            if (i + 1 < s) el.classList.add('done');
        });
        wizBack.textContent = s === 1 ? 'Cancel' : 'Back';
        // Only show Next on step 5 (as "Add Entry"). Steps 1-4 auto-advance on selection.
        if (s === 5) {
            wizNext.style.display = '';
            wizNext.textContent = 'Add Entry';
        } else {
            wizNext.style.display = 'none';
        }

        if (s === 1) renderWizType();
        if (s === 2) renderWizCategories();
        if (s === 3) renderWizEffort();
        if (s === 4) renderWizModifier();
        if (s === 5) renderWizReview();
    }

    // Step 1: Deposit or Withdrawal
    function renderWizType() {
        var depBtn = document.getElementById('wiz-type-dep');
        var witBtn = document.getElementById('wiz-type-wit');
        depBtn.classList.toggle('selected', wizState.type === 'deposit');
        witBtn.classList.toggle('selected', wizState.type === 'withdrawal');
        depBtn.onclick = function () { wizState.type = 'deposit'; wizState.step = 2; renderWizardStep(); };
        witBtn.onclick = function () { wizState.type = 'withdrawal'; wizState.step = 2; renderWizardStep(); };
    }

    // Step 2: Category
    function renderWizCategories() {
        customTitle.textContent = wizState.type === 'deposit' ? 'Deposit' : 'Withdrawal';
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
                wizState.step = 3;
                renderWizardStep();
            });
            wizCategories.appendChild(el);
        });
    }

    // Step 3: Effort / Duration
    function renderWizEffort() {
        var opts = wizState.type === 'deposit' ? DEP_EFFORT : WIT_DURATION;
        wizStep3Label.textContent = wizState.type === 'deposit' ? 'How much effort was this?' : 'How long is this?';
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
                wizState.step = 4;
                renderWizardStep();
            });
            wizEffort.appendChild(el);
        });
    }

    // Step 4: Modifier
    function renderWizModifier() {
        var opts = wizState.type === 'deposit' ? DEP_MODIFIER : WIT_MODIFIER;
        wizStep4Label.textContent = wizState.type === 'deposit' ? 'Was it asked for?' : 'How mad is she?';
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
                wizState.step = 5;
                renderWizardStep();
            });
            wizModifier.appendChild(el);
        });
    }

    function calcWizValue() {
        if (!wizState.effortData || !wizState.modData) return 0;
        return Math.round(wizState.effortData.base * wizState.modData.mult);
    }

    function getWizTimestamp() {
        if (wizState.when === 'now') return Date.now();
        if (wizState.when === 'yesterday') {
            var y = new Date(); y.setDate(y.getDate() - 1);
            return y.getTime();
        }
        if (wizState.when === 'tomorrow') {
            var t = new Date(); t.setDate(t.getDate() + 1);
            return t.getTime();
        }
        if (wizState.when === 'custom' && wizState.whenDate) {
            return new Date(wizState.whenDate).getTime();
        }
        return Date.now();
    }

    // Step 5: When + Review
    function renderWizReview() {
        var val = calcWizValue();
        var prefix = val >= 0 ? '+' : '';
        var cls = val >= 0 ? 'pos' : 'neg';
        wizEstimate.innerHTML = '<div class="wiz-est-num ' + cls + '">' + prefix + val + '</div>'
            + '<div class="wiz-est-label">estimated babe cred</div>';

        // When buttons
        var whenBtns = document.querySelectorAll('.wiz-when');
        whenBtns.forEach(function (btn) {
            btn.classList.toggle('selected', wizState.when === btn.dataset.when);
            btn.onclick = function () {
                wizState.when = this.dataset.when;
                if (this.dataset.when === 'custom') {
                    wizDateInput.classList.remove('hidden');
                    try { wizDateInput.showPicker(); } catch (e) { wizDateInput.focus(); }
                } else {
                    wizDateInput.classList.add('hidden');
                }
                renderWizReview();
            };
        });

        wizDateInput.onchange = function () {
            wizState.whenDate = this.value;
        };

        var lines = [];
        lines.push('Type: ' + (wizState.type === 'deposit' ? '+ Deposit' : '− Withdrawal'));
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

    // Navigation
    wizBack.addEventListener('click', function () {
        if (wizState.step === 1) {
            customModal.classList.add('hidden');
        } else {
            wizState.step--;
            renderWizardStep();
        }
    });

    wizNext.addEventListener('click', function () {
        // Only fires on step 5 (Add Entry)
        if (wizState.when === null) return;
        if (wizState.when === 'custom' && !wizState.whenDate) return;

        var val = calcWizValue();
        var desc = wizDesc.value.trim() || wizState.catName;
        var emoji = wizState.catEmoji || '✏️';
        var ts = getWizTimestamp();
        if (wizState.type === 'deposit') {
            CredEngine.addDepositAt(desc, emoji, Math.abs(val), wizState.effortData.halfLife, ts);
        } else {
            CredEngine.addWithdrawalAt(desc, emoji, val, wizState.effortData.rate || 2, ts);
        }
        customModal.classList.add('hidden');
        renderAll();
    });

    // --- Ledger ---

    function formatFutureDate(ts) {
        var d = new Date(ts);
        var now = new Date();
        var diffDays = Math.ceil((ts - now.getTime()) / 86400000);
        if (diffDays <= 1) return 'Tomorrow';
        if (diffDays <= 7) return 'In ' + diffDays + ' days';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function renderLedger() {
        var entries = CredEngine.getLedgerWithValues();
        var proj = CredEngine.calculateProjectedBalance();
        if (entries.length === 0) {
            ledgerRows.innerHTML = '<div class="ledger-empty">No transactions yet. Tap + Add Entry to start.</div>';
            return;
        }
        var html = '';
        var hasScheduled = entries.some(function (e) { return e.scheduled; });

        if (hasScheduled) {
            var projPrefix = proj.projected >= 0 ? '+' : '';
            var projCls = proj.projected >= 0 ? 'pos' : 'neg';
            html += '<div class="projected-bar">'
                + '<span>Projected balance after scheduled: </span>'
                + '<strong class="' + projCls + '">' + projPrefix + Math.round(proj.projected) + '</strong>'
                + '</div>';
        }

        for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            var isPos = e.currentValue >= 0;
            var prefix = isPos ? '+' : '';
            var origPrefix = e.value >= 0 ? '+' : '';
            var rowClass = e.scheduled ? 'ledger-row scheduled' : 'ledger-row';
            var dateStr = e.scheduled ? '📅 ' + formatFutureDate(e.timestamp) : formatDate(e.timestamp);
            var valueDisplay = e.scheduled
                ? '<div class="lr-current ' + (e.value >= 0 ? 'pos' : 'neg') + '">' + (e.value >= 0 ? '+' : '') + e.value + '</div>'
                  + '<div class="lr-original">scheduled</div>'
                : '<div class="lr-current ' + (isPos ? 'pos' : 'neg') + '">' + prefix + Math.round(e.currentValue) + '</div>'
                  + '<div class="lr-original">was ' + origPrefix + e.value + '</div>';

            html += '<div class="ledger-swipe" data-entry-id="' + e.id + '">'
                + '<div class="' + rowClass + '">'
                + '<div class="lr-left">'
                + '<span class="lr-icon">' + (e.emoji || '•') + '</span>'
                + '<div><div class="lr-desc">' + sanitize(e.desc) + '</div>'
                + '<div class="lr-date">' + dateStr + '</div></div>'
                + '</div>'
                + '<div class="lr-right">' + valueDisplay + '</div>'
                + '</div>'
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
            var startX = 0, currentX = 0, swiping = false;
            var rowInner = row.querySelector('.ledger-row');
            var deleteBtn = row.querySelector('.lr-delete');
            var threshold = 70;

            function onStart(x) { swiping = true; startX = x; currentX = 0; rowInner.style.transition = 'none'; }
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
                } else {
                    rowInner.style.transform = 'translateX(0)';
                }
            }

            rowInner.addEventListener('touchstart', function (e) { onStart(e.touches[0].clientX); }, { passive: true });
            rowInner.addEventListener('touchmove', function (e) { onMove(e.touches[0].clientX); }, { passive: true });
            rowInner.addEventListener('touchend', onEnd);
            rowInner.addEventListener('mousedown', function (e) { e.preventDefault(); onStart(e.clientX); });
            document.addEventListener('mousemove', function (e) { onMove(e.clientX); });
            document.addEventListener('mouseup', onEnd);

            deleteBtn.addEventListener('click', function () {
                var id = row.dataset.entryId;
                row.style.transition = 'opacity 0.2s, max-height 0.2s';
                row.style.opacity = '0';
                row.style.maxHeight = '0';
                row.style.overflow = 'hidden';
                setTimeout(function () { CredEngine.deleteEntry(id); renderAll(); }, 200);
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
        var el = document.createElement('div');
        el.className = 'chat-msg';
        var c = getNameColor(msg.name);
        var t = msg.timestamp ? formatTime(msg.timestamp) : '';
        var balTag = '';
        if (msg.balance !== undefined) {
            var emoji = balEmoji(msg.balance);
            var cls = msg.balance >= 0 ? 'pos' : 'neg';
            var pfx = msg.balance >= 0 ? '+' : '';
            balTag = ' <span class="cm-bal ' + cls + '">' + emoji + '[' + pfx + msg.balance + ']</span>';
        }
        var content = '';
        if (msg.image) {
            content = (msg.text ? sanitize(msg.text) + '<br>' : '')
                + '<img src="' + sanitize(msg.image) + '" class="chat-img" onclick="openFullImage(this.src)">';
        } else {
            content = sanitize(msg.text);
        }
        el.innerHTML = '<span class="cm-time">' + sanitize(t) + '</span>'
            + '<span class="cm-name nc' + c + '">' + sanitize(msg.name) + '</span>'
            + balTag + ': ' + content;
        chatMessages.appendChild(el);
        if (chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 120) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = chatInput.value.trim();
        if (!text || !userName) return;
        Chat.send(userName, text, Math.round(CredEngine.calculateBalance()));
        chatInput.value = '';
        chatInput.focus();
    });

    // --- Photo upload ---

    var photoBtn = document.getElementById('photo-btn');
    var photoInput = document.getElementById('photo-input');

    photoBtn.addEventListener('click', function () {
        photoInput.click();
    });

    photoInput.addEventListener('change', function () {
        var file = this.files[0];
        if (!file || !userName) return;
        var origHTML = photoBtn.innerHTML;
        photoBtn.innerHTML = '...';
        photoBtn.disabled = true;

        Chat.uploadImage(file, function (err, url) {
            photoBtn.innerHTML = origHTML;
            photoBtn.disabled = false;
            if (err) {
                console.warn('Upload failed:', err);
                return;
            }
            Chat.sendImage(userName, url, Math.round(CredEngine.calculateBalance()));
        });
        photoInput.value = '';
    });

    // --- Share card ---

    var shareBtn = document.getElementById('share-btn');
    shareBtn.addEventListener('click', function () {
        var bal = Math.round(CredEngine.calculateBalance());
        var comment = CommentEngine.getComment(bal);
        var prefix = bal >= 0 ? '+' : '';

        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        var ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1A1108';
        ctx.fillRect(0, 0, 600, 400);

        // Mustard accent bar
        ctx.fillStyle = '#E8A317';
        ctx.fillRect(0, 370, 600, 30);

        // Logo
        ctx.font = '900 28px Arial';
        ctx.fillStyle = '#FFF8E7';
        ctx.textAlign = 'center';
        ctx.fillText('BabeCred', 300, 50);

        // Balance label
        ctx.font = '12px Arial';
        ctx.fillStyle = '#6B6B3C';
        ctx.letterSpacing = '2px';
        ctx.fillText('CURRENT BABE CRED BALANCE', 300, 100);

        // Big balance number
        ctx.font = '900 80px Arial';
        ctx.fillStyle = bal >= 0 ? '#008844' : '#CC5500';
        ctx.fillText(prefix + bal, 300, 190);

        // Emoji tier
        var emoji = '';
        if (bal >= 200) emoji = '👑';
        else if (bal >= 100) emoji = '🔥';
        else if (bal >= 50) emoji = '💪';
        else if (bal <= -200) emoji = '💀';
        else if (bal <= -100) emoji = '🚨';
        else if (bal <= -50) emoji = '😬';
        if (emoji) {
            ctx.font = '40px Arial';
            ctx.fillText(emoji, 300, 240);
        }

        // Comment (wrap text)
        ctx.font = 'italic 14px Arial';
        ctx.fillStyle = '#FFF8E7';
        var words = comment.split(' ');
        var line = '';
        var y = 280;
        for (var i = 0; i < words.length; i++) {
            var test = line + words[i] + ' ';
            if (ctx.measureText(test).width > 480 && i > 0) {
                ctx.fillText('"' + (y === 280 ? '' : '') + line.trim() + (i === words.length ? '"' : ''), 300, y);
                line = words[i] + ' ';
                y += 20;
            } else {
                line = test;
            }
        }
        ctx.fillText((y === 280 ? '"' : '') + line.trim() + '"', 300, y);

        // URL
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#1A1108';
        ctx.fillText('BABECRED.COM', 300, 390);

        // Convert to blob and share/download
        canvas.toBlob(function (blob) {
            var file = new File([blob], 'babecred-balance.png', { type: 'image/png' });

            // Try Web Share API (mobile)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                    title: 'My BabeCred Balance',
                    text: 'My babe cred: ' + prefix + bal + '. ' + comment,
                    files: [file]
                }).catch(function () {});
            } else {
                // Fallback: download
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'babecred-balance.png';
                a.click();
                URL.revokeObjectURL(url);
            }
        }, 'image/png');
    });

    // --- Render all ---

    function renderAll() {
        renderBalance();
        renderLedger();
    }

    // --- Mobile tab switching ---

    var mobileTabs = document.getElementById('mobile-tabs');
    var balanceSide = document.querySelector('.balance-side');
    var chatSide = document.querySelector('.chat-side');

    if (mobileTabs) {
        mobileTabs.addEventListener('click', function (e) {
            var tab = e.target.closest('.mobile-tab');
            if (!tab) return;
            mobileTabs.querySelectorAll('.mobile-tab').forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            if (tab.dataset.tab === 'cred') {
                balanceSide.classList.remove('mobile-hidden');
                chatSide.classList.add('mobile-hidden');
            } else {
                balanceSide.classList.add('mobile-hidden');
                chatSide.classList.remove('mobile-hidden');
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
        if (window.innerWidth <= 768) chatSide.classList.add('mobile-hidden');
    }

    // --- Periodic recalculation (every 60s for decay updates) ---

    setInterval(function () {
        if (!mainApp.classList.contains('hidden')) renderAll();
    }, 60000);

})();
