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

    // --- Name Generator ---

    var NAME_PREFIXES = [
        'xX_', 'The_', 'Big_', 'Sir_', 'King_', 'Chief_', 'Captain_', 'Coach_',
        'Don_', 'Agent_', 'DJ_', 'Lil_', 'MC_', 'Dr_', 'Mr_', 'Uncle_'
    ];
    var NAME_SUFFIXES = [
        '_Xx', '_69', '_420', '_MVP', '_CEO', '_Sr', '_Jr', '_III',
        '_PhD', '_Esq', '_OG', '_VIP', '_Pro', '_TM', '_99', '_01'
    ];
    var NAME_MIDDLES = [
        'Cred', 'Babe', 'Smooth', 'Cash', 'Hustle', 'Grind', 'Clutch', 'Alpha',
        'Sauce', 'Vibe', 'Legend', 'Ace', 'Boss', 'Rizz', 'Chill', 'Flex',
        'Dapper', 'Slick', 'Dreamy', 'Charming', 'Loyal', 'Romantic',
        'Whipped', 'Couch', 'Doghouse', 'Redeemed', 'Deficit', 'Bankrupt',
        'GoodBF', 'HubbyMVP', 'CredKing', 'FlowerBoy', 'TrashKing', 'DishDaddy'
    ];
    var NAME_PATTERNS = [
        function (n) { return pick(NAME_PREFIXES) + n + pick(NAME_SUFFIXES); },
        function (n) { return n + '_' + pick(NAME_MIDDLES); },
        function (n) { return pick(NAME_MIDDLES) + '_' + n; },
        function (n) { return n + pick(NAME_SUFFIXES); },
        function (n) { return pick(NAME_PREFIXES) + n; },
        function (n) { return n.charAt(0).toUpperCase() + '_' + pick(NAME_MIDDLES) + '_' + Math.floor(Math.random() * 99); },
        function (n) { return pick(NAME_MIDDLES) + n.charAt(0).toUpperCase() + Math.floor(Math.random() * 999); },
        function (n) { return 'NotWhipped_' + n; },
        function (n) { return n + '_EarnsCred'; },
        function (n) { return 'DadBod_' + n; },
    ];

    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    document.getElementById('name-gen-btn').addEventListener('click', function () {
        var raw = document.getElementById('name-gen-input').value.trim();
        var name = raw || 'Bro';
        var generated = pick(NAME_PATTERNS)(name);
        if (generated.length > 24) generated = generated.substring(0, 24);
        document.getElementById('name-input').value = generated;
    });

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
            // One-time bot announcement
            if (!localStorage.getItem('babecred_bot_v1')) {
                Chat.send('BabeCredBot', 'NEW — The system now tracks Boston sports and weather. Celtics, Bruins, Sox, Pats, golf weather, and every major event auto-suggest in your feed. No work tomorrow? Gaming with the boys is on the menu. Plan ahead or pay the price.', 0);
                localStorage.setItem('babecred_bot_v1', '1');
            }
            if (!localStorage.getItem('babecred_bot_v2')) {
                Chat.send('BabeCredBot', 'UPDATE — Tap the 👸 in the header to set up Babe Info. Enter her anniversary, birthday, and any other dates you can\'t afford to forget. The system will warn you days in advance. Valentine\'s and Mother\'s Day are auto-tracked. Also new: leaderboard is live. Top 5 = Golf Ready ⛳. Bottom 5 = Doghouse 🛋️. Your cred is public now.', 0);
                localStorage.setItem('babecred_bot_v2', '1');
            }
        } catch (e) {
            console.warn('Chat init failed:', e);
        }
        renderAll();
        chatInput.focus();
    }

    // --- Render balance ---

    var commentText = document.getElementById('comment-text');
    var commentInsight = document.getElementById('comment-insight');
    var qaStrip = document.getElementById('qa-strip');

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

        // Commentary (inside balance card now)
        commentText.textContent = CommentEngine.getComment(rounded);
        var ledger = CredEngine.getLedgerWithValues();
        commentInsight.innerHTML = CommentEngine.getInsight(rounded, ledger);

        // Quick Actions strip (Coming Up + Recommendations merged)
        var suggestions = CommentEngine.getSuggestions(rounded);
        var allItems = [];

        // Fetch coming up events, then render combined strip
        // Babe Info warnings first (highest priority)
        var babeEvents = BabeInfo.getUpcoming(14);
        babeEvents.forEach(function (e) {
            allItems.push({
                emoji: e.emoji, name: e.name, day: e.day,
                val: e.val, type: 'warning', value: 0,
                halfLife: null, rate: 0, isCU: true, isBabe: true,
                daysOut: e.daysOut
            });
        });

        ComingUp.getEvents(function (events) {
            // Sports/weather items
            events.forEach(function (e) {
                allItems.push({
                    emoji: e.emoji, name: e.name, day: e.day || '',
                    val: e.val, type: e.type, value: e.value,
                    halfLife: null, rate: e.rate || 2, isCU: true
                });
            });
            // Then regular recommendations
            suggestions.forEach(function (s) {
                allItems.push({
                    emoji: s.emoji, name: s.name, day: '',
                    val: s.val, type: s.type, value: s.value,
                    halfLife: s.halfLife, rate: s.rate || 2, isCU: false
                });
            });

            var html = '';
            allItems.forEach(function (item) {
                var valCls = item.type === 'deposit' ? 'pos' : 'neg';
                var cuClass = item.isBabe ? (item.daysOut <= 3 ? ' babe-urgent' : ' babe-warn') : (item.isCU ? ' cu' : '');
                html += '<div class="qa-item' + cuClass + '">'
                    + '<div class="qa-emoji">' + item.emoji + '</div>'
                    + '<div class="qa-name">' + item.name + '</div>'
                    + (item.day ? '<div class="qa-day">' + item.day + '</div>' : '')
                    + '<div class="qa-val ' + valCls + '">' + item.val + '</div>'
                    + '</div>';
            });
            qaStrip.innerHTML = html;

            qaStrip.querySelectorAll('.qa-item').forEach(function (el, idx) {
                el.addEventListener('click', function () {
                    var a = allItems[idx];
                    if (a.type === 'warning') {
                        // Babe warnings are informational — open babe info
                        babeToggle.click();
                        return;
                    }
                    if (a.type === 'deposit') {
                        CredEngine.addDeposit(a.name, a.emoji, a.value, a.halfLife || 7);
                    } else {
                        CredEngine.addWithdrawal(a.name, a.emoji, a.value, a.rate || 2);
                    }
                    el.style.background = 'rgba(232,163,23,0.3)';
                    setTimeout(function () { el.style.background = ''; }, 300);
                    renderAll();
                });
            });
        });
    }

    // =============================================
    // ENTRY PICKER — 2 steps
    // 1. Pick from all presets (deposits + withdrawals)
    // 2. When did it happen?
    // =============================================

    var ALL_DEPOSITS = [
        { emoji: '📱', name: 'Liked her post', value: 1, halfLife: 1 },
        { emoji: '💬', name: 'Actually listened', value: 8, halfLife: 2 },
        { emoji: '☕', name: 'Brought her coffee', value: 5, halfLife: 1 },
        { emoji: '💬', name: 'Gave a compliment', value: 3, halfLife: 1 },
        { emoji: '🐕', name: 'Walked the dog', value: 5, halfLife: 1 },
        { emoji: '🛒', name: 'Grocery run', value: 8, halfLife: 2 },
        { emoji: '🧹', name: 'Cleaned the house', value: 10, halfLife: 2 },
        { emoji: '🍳', name: 'Made breakfast', value: 12, halfLife: 2 },
        { emoji: '🍽️', name: 'Cooked dinner', value: 12, halfLife: 2 },
        { emoji: '💐', name: 'Flowers (no reason)', value: 15, halfLife: 3 },
        { emoji: '📝', name: 'Wrote her a note', value: 15, halfLife: 5 },
        { emoji: '🛁', name: 'Drew her a bath', value: 15, halfLife: 3 },
        { emoji: '💆', name: 'Gave her a massage', value: 20, halfLife: 3 },
        { emoji: '🗑️', name: 'Trash (unasked)', value: 25, halfLife: 2 },
        { emoji: '✨', name: 'Surprise date night', value: 30, halfLife: 5 },
        { emoji: '👶', name: 'Took the kids', value: 40, halfLife: 5 },
        { emoji: '✈️', name: 'Planned a trip', value: 60, halfLife: 9 },
    ];

    var ALL_WITHDRAWALS = [
        // Small (-5 to -10)
        { emoji: '📱', name: 'Scrolling phone in bed', value: -5, rate: 2 },
        { emoji: '😐', name: '"You look fine"', value: -10, rate: 2 },
        { emoji: '🤷', name: '"I don\'t care where we eat"', value: -8, rate: 2 },
        { emoji: '📺', name: 'TV binge', value: -10, rate: 2 },
        { emoji: '🏌️', name: 'Driving range / simulator', value: -10, rate: 2 },
        { emoji: '😴', name: 'Fell asleep on the couch', value: -5, rate: 2 },
        { emoji: '🙄', name: 'Eye roll (she saw it)', value: -8, rate: 2 },
        { emoji: '🤦', name: '"Relax" (never say this)', value: -12, rate: 2 },
        // Medium (-15 to -30)
        { emoji: '🍺', name: 'Happy hour', value: -15, rate: 2 },
        { emoji: '🎮', name: '"One more game"', value: -20, rate: 2 },
        { emoji: '🎮', name: 'Gaming all night', value: -30, rate: 2 },
        { emoji: '📱', name: 'Liked another girl\'s post', value: -25, rate: 2 },
        { emoji: '🛋️', name: 'Did nothing all weekend', value: -20, rate: 2 },
        { emoji: '🍕', name: 'Forgot to pick up dinner', value: -15, rate: 2 },
        { emoji: '🚗', name: 'Left the toilet seat up', value: -5, rate: 2 },
        { emoji: '📞', name: 'Forgot to call back', value: -10, rate: 2 },
        { emoji: '🗓️', name: 'Double-booked her plans', value: -20, rate: 2 },
        // Large (-25 to -40)
        { emoji: '⛳', name: 'Golf day', value: -25, rate: 2 },
        { emoji: '🍺', name: "Boys' night out", value: -30, rate: 2 },
        { emoji: '🎣', name: 'Fishing trip', value: -35, rate: 2 },
        { emoji: '🏎️', name: 'Bought something expensive', value: -40, rate: 2 },
        { emoji: '🍻', name: 'Came home late (no text)', value: -35, rate: 2 },
        { emoji: '🤥', name: '"I\'m 5 minutes away" (was 30)', value: -20, rate: 2 },
        // Huge (-50 to -80)
        { emoji: '🏈', name: "Boys' weekend", value: -80, rate: 2 },
        { emoji: '🎰', name: 'Casino night', value: -50, rate: 2 },
        { emoji: '🏖️', name: "Guys' trip", value: -60, rate: 2 },
        { emoji: '🏈', name: 'Fantasy draft weekend', value: -60, rate: 2 },
        // Catastrophic (-100+)
        { emoji: '📅', name: 'Forgot anniversary', value: -150, rate: 1 },
        { emoji: '🎂', name: 'Forgot her birthday', value: -120, rate: 1 },
        { emoji: '💐', name: 'Forgot Valentine\'s Day', value: -100, rate: 1 },
        { emoji: '🏀', name: "Final 4 w/ the boys", value: -200, rate: 1 },
        { emoji: '✈️', name: 'Bachelor party weekend', value: -120, rate: 1 },
        // Work
        { emoji: '💼', name: 'Worked late, kids outnumbered her', value: -20, rate: 2 },
    ];

    var pickerSelected = null; // the chosen preset

    // Render step 1: all presets
    function renderPickerPresets() {
        var depGrid = document.getElementById('picker-deposits');
        var witGrid = document.getElementById('picker-withdrawals');
        depGrid.innerHTML = '';
        witGrid.innerHTML = '';

        ALL_DEPOSITS.forEach(function (p, i) {
            var el = document.createElement('div');
            el.className = 'picker-item';
            el.innerHTML = '<div class="pi-emoji">' + p.emoji + '</div>'
                + '<div class="pi-name">' + p.name + '</div>'
                + '<div class="pi-val pos">+' + p.value + '</div>';
            el.addEventListener('click', function () {
                pickerSelected = { type: 'deposit', preset: p };
                showPickerStep2();
            });
            depGrid.appendChild(el);
        });

        ALL_WITHDRAWALS.forEach(function (p, i) {
            var el = document.createElement('div');
            el.className = 'picker-item';
            el.innerHTML = '<div class="pi-emoji">' + p.emoji + '</div>'
                + '<div class="pi-name">' + p.name + '</div>'
                + '<div class="pi-val neg">' + p.value + '</div>';
            el.addEventListener('click', function () {
                pickerSelected = { type: 'withdrawal', preset: p };
                showPickerStep2();
            });
            witGrid.appendChild(el);
        });
    }

    function showPickerStep2() {
        document.getElementById('picker-step-1').classList.add('hidden');
        document.getElementById('picker-step-2').classList.remove('hidden');
        var p = pickerSelected.preset;
        var cls = pickerSelected.type === 'deposit' ? 'pos' : 'neg';
        var prefix = p.value >= 0 ? '+' : '';
        document.getElementById('picker-selected').innerHTML =
            '<span style="font-size:24px;">' + p.emoji + '</span> '
            + '<strong>' + p.name + '</strong> '
            + '<span class="' + cls + '" style="font-weight:700;">' + prefix + p.value + '</span>';
        document.getElementById('picker-date').classList.add('hidden');
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }

    function getPickerTimestamp(when, dateVal) {
        var today = new Date();
        if (when === 'now') return startOfDay(today);
        if (when === 'yesterday') {
            var y = new Date(today);
            y.setDate(y.getDate() - 1);
            return startOfDay(y);
        }
        if (when === 'tomorrow') {
            var t = new Date(today);
            t.setDate(t.getDate() + 1);
            return startOfDay(t);
        }
        if (when === 'custom' && dateVal) {
            return startOfDay(new Date(dateVal));
        }
        return startOfDay(today);
    }

    // Search/filter
    var pickerSearch = document.getElementById('picker-search');
    var pickerResults = document.getElementById('picker-results');
    var pickerCustom = document.getElementById('picker-custom');
    var pickerCustomDep = document.getElementById('picker-custom-dep');
    var pickerCustomWit = document.getElementById('picker-custom-wit');

    pickerSearch.addEventListener('input', function () {
        var q = this.value.trim().toLowerCase();
        if (!q) {
            pickerResults.classList.remove('hidden');
            pickerCustom.classList.add('hidden');
            renderPickerPresets();
            return;
        }

        var depMatches = ALL_DEPOSITS.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; });
        var witMatches = ALL_WITHDRAWALS.filter(function (p) { return p.name.toLowerCase().indexOf(q) >= 0; });

        if (depMatches.length === 0 && witMatches.length === 0) {
            pickerResults.classList.add('hidden');
            pickerCustom.classList.remove('hidden');
            return;
        }

        pickerResults.classList.remove('hidden');
        pickerCustom.classList.add('hidden');

        var depGrid = document.getElementById('picker-deposits');
        var witGrid = document.getElementById('picker-withdrawals');
        depGrid.innerHTML = '';
        witGrid.innerHTML = '';

        depMatches.forEach(function (p) {
            var el = document.createElement('div');
            el.className = 'picker-item';
            el.innerHTML = '<div class="pi-emoji">' + p.emoji + '</div><div class="pi-name">' + p.name + '</div><div class="pi-val pos">+' + p.value + '</div>';
            el.addEventListener('click', function () { pickerSelected = { type: 'deposit', preset: p }; showPickerStep2(); });
            depGrid.appendChild(el);
        });

        witMatches.forEach(function (p) {
            var el = document.createElement('div');
            el.className = 'picker-item';
            el.innerHTML = '<div class="pi-emoji">' + p.emoji + '</div><div class="pi-name">' + p.name + '</div><div class="pi-val neg">' + p.value + '</div>';
            el.addEventListener('click', function () { pickerSelected = { type: 'withdrawal', preset: p }; showPickerStep2(); });
            witGrid.appendChild(el);
        });
    });

    // Custom entry from search text
    function logCustomFromSearch(type) {
        var desc = pickerSearch.value.trim();
        if (!desc) return;
        var defaultVal = type === 'deposit' ? 10 : -15;
        var halfLife = 7;
        var rate = 2;
        pickerSelected = {
            type: type,
            preset: {
                emoji: '✏️',
                name: desc,
                value: defaultVal,
                halfLife: halfLife,
                rate: rate
            }
        };
        showPickerStep2();
    }

    pickerCustomDep.addEventListener('click', function () { logCustomFromSearch('deposit'); });
    pickerCustomWit.addEventListener('click', function () { logCustomFromSearch('withdrawal'); });

    // Open picker
    addEntryBtn.addEventListener('click', function () {
        pickerSelected = null;
        pickerSearch.value = '';
        pickerResults.classList.remove('hidden');
        pickerCustom.classList.add('hidden');
        document.getElementById('picker-step-1').classList.remove('hidden');
        document.getElementById('picker-step-2').classList.add('hidden');
        customModal.classList.remove('hidden');
        renderPickerPresets();
    });

    // Cancel
    document.getElementById('picker-cancel').addEventListener('click', function () {
        customModal.classList.add('hidden');
    });

    // Back from step 2
    document.getElementById('picker-back').addEventListener('click', function () {
        document.getElementById('picker-step-2').classList.add('hidden');
        document.getElementById('picker-step-1').classList.remove('hidden');
    });

    // When buttons — tap to log immediately
    var pickerDateInput = document.getElementById('picker-date');
    document.querySelectorAll('.picker-when').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var when = this.dataset.when;
            if (when === 'custom') {
                pickerDateInput.classList.remove('hidden');
                try { pickerDateInput.showPicker(); } catch (e) { pickerDateInput.focus(); }
                pickerDateInput.onchange = function () {
                    var ts = getPickerTimestamp('custom', this.value);
                    logPickerEntry(ts);
                };
                return;
            }
            var ts = getPickerTimestamp(when);
            logPickerEntry(ts);
        });
    });

    function logPickerEntry(ts) {
        if (!pickerSelected) return;
        var p = pickerSelected.preset;
        if (pickerSelected.type === 'deposit') {
            CredEngine.addDepositAt(p.name, p.emoji, p.value, p.halfLife, ts);
        } else {
            CredEngine.addWithdrawalAt(p.name, p.emoji, p.value, p.rate || 2, ts);
        }
        customModal.classList.add('hidden');
        renderAll();
    }

    // --- Ledger ---

    function formatFutureDate(ts) {
        var d = new Date(ts);
        var now = new Date();
        var target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var diffDays = Math.round((target - today) / 86400000);
        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
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

            html += '<div class="ledger-row-wrap" data-entry-id="' + e.id + '">'
                + '<div class="' + rowClass + '">'
                + '<div class="lr-left">'
                + '<span class="lr-icon">' + (e.emoji || '•') + '</span>'
                + '<div><div class="lr-desc">' + sanitize(e.desc) + '</div>'
                + '<div class="lr-date">' + dateStr + '</div></div>'
                + '</div>'
                + '<div class="lr-right">'
                + valueDisplay
                + '<button class="lr-x" data-id="' + e.id + '">✕</button>'
                + '</div>'
                + '</div></div>';
        }
        ledgerRows.innerHTML = html;
        bindDeleteButtons();
    }

    // --- Swipe to delete ---

    function bindDeleteButtons() {
        var activeBtn = null;

        // Tap anywhere to reset the active confirm button
        document.addEventListener('click', function () {
            if (activeBtn) {
                activeBtn.textContent = '✕';
                activeBtn.classList.remove('lr-x-confirm');
                activeBtn = null;
            }
        });

        ledgerRows.querySelectorAll('.lr-x').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();

                // If this button is already in confirm state — delete
                if (this.classList.contains('lr-x-confirm')) {
                    var id = this.dataset.id;
                    var row = this.closest('.ledger-row-wrap');
                    row.style.transition = 'opacity 0.2s';
                    row.style.opacity = '0';
                    activeBtn = null;
                    setTimeout(function () { CredEngine.deleteEntry(id); renderAll(); }, 200);
                    return;
                }

                // Reset any other active confirm button
                if (activeBtn) {
                    activeBtn.textContent = '✕';
                    activeBtn.classList.remove('lr-x-confirm');
                }

                // Enter confirm state
                this.textContent = 'Delete?';
                this.classList.add('lr-x-confirm');
                activeBtn = this;
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
        pushLeaderboard();
    }

    // --- Leaderboard ---

    var lbRef = null;
    var lbTop = document.getElementById('lb-top');
    var lbBottom = document.getElementById('lb-bottom');
    var lbBody = document.getElementById('lb-body');
    var lbArrow = document.getElementById('lb-arrow');

    // Toggle collapse
    document.getElementById('lb-toggle').addEventListener('click', function () {
        lbBody.classList.toggle('hidden');
        lbArrow.classList.toggle('collapsed');
    });

    function pushLeaderboard() {
        if (!userName || isAnon) return;
        try {
            var db = firebase.database();
            var bal = Math.round(CredEngine.calculateBalance());
            db.ref('leaderboard/' + userName).set({
                name: userName,
                balance: bal,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        } catch (e) {}
    }

    function listenLeaderboard() {
        try {
            var db = firebase.database();
            lbRef = db.ref('leaderboard');
            lbRef.on('value', function (snap) {
                var users = [];
                snap.forEach(function (child) {
                    users.push(child.val());
                });
                renderLeaderboard(users);
            });
        } catch (e) {}
    }

    var MEDALS = ['🥇', '🥈', '🥉', '4.', '5.'];

    function renderLeaderboard(users) {
        if (users.length === 0) {
            lbTop.innerHTML = '<div class="lb-empty">No one on the board yet.</div>';
            lbBottom.innerHTML = '';
            return;
        }

        // Sort by balance descending
        users.sort(function (a, b) { return b.balance - a.balance; });

        var top5 = users.slice(0, 5);
        var bottom5 = users.filter(function (u) { return u.balance < 0; })
            .sort(function (a, b) { return a.balance - b.balance; })
            .slice(0, 5);

        lbTop.innerHTML = '';
        top5.forEach(function (u, i) {
            var isYou = u.name === userName;
            var prefix = u.balance >= 0 ? '+' : '';
            var cls = u.balance >= 0 ? 'pos' : 'neg';
            var medal = i < 3 ? '<span class="lb-medal">' + MEDALS[i] + '</span>' : '<span class="lb-rank">' + (i + 1) + '</span>';
            lbTop.innerHTML += '<div class="lb-row">'
                + medal
                + '<span class="lb-name' + (isYou ? ' lb-you' : '') + '">' + u.name + (isYou ? ' (you)' : '') + '</span>'
                + '<span class="lb-score ' + cls + '">' + prefix + u.balance + '</span>'
                + '</div>';
        });

        if (bottom5.length === 0) {
            lbBottom.innerHTML = '<div class="lb-empty">Nobody in the red. Suspicious.</div>';
        } else {
            lbBottom.innerHTML = '';
            bottom5.forEach(function (u, i) {
                var isYou = u.name === userName;
                lbBottom.innerHTML += '<div class="lb-row">'
                    + '<span class="lb-rank">' + (i + 1) + '</span>'
                    + '<span class="lb-name' + (isYou ? ' lb-you' : '') + '">' + u.name + (isYou ? ' (you)' : '') + '</span>'
                    + '<span class="lb-score neg">' + u.balance + '</span>'
                    + '</div>';
            });
        }
    }

    // Start listening after sign on
    listenLeaderboard();

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

    // --- Babe Info Modal ---

    var babeModal = document.getElementById('babe-modal');
    var babeToggle = document.getElementById('babe-info-toggle');
    var babeIconEl = document.getElementById('babe-icon');
    var babeModalIcon = document.getElementById('babe-modal-icon');
    var babeAnniversary = document.getElementById('babe-anniversary');
    var babeBirthday = document.getElementById('babe-birthday');
    var babeCustomList = document.getElementById('babe-custom-list');
    var babeCustomName = document.getElementById('babe-custom-name');
    var babeCustomDate = document.getElementById('babe-custom-date');
    var tempCustom = [];
    var selectedIcon = '👸';

    // Helper: date input (YYYY-MM-DD) to MM-DD
    function dateToMMDD(val) {
        if (!val) return null;
        var parts = val.split('-'); // YYYY-MM-DD
        if (parts.length === 3) return parts[1] + '-' + parts[2];
        return val;
    }

    // Helper: MM-DD to YYYY-MM-DD (use current year for display)
    function mmddToDate(mmdd) {
        if (!mmdd) return '';
        return new Date().getFullYear() + '-' + mmdd;
    }

    // Load saved icon
    var savedInfo = BabeInfo.getInfo();
    if (savedInfo.icon) {
        selectedIcon = savedInfo.icon;
        babeIconEl.textContent = selectedIcon;
    }

    function renderBabeIconPicker() {
        document.querySelectorAll('.babe-icon-opt').forEach(function (opt) {
            opt.classList.toggle('selected', opt.dataset.icon === selectedIcon);
            opt.onclick = function () {
                selectedIcon = this.dataset.icon;
                renderBabeIconPicker();
            };
        });
    }

    function renderBabeCustomList() {
        babeCustomList.innerHTML = '';
        tempCustom.forEach(function (c, i) {
            var el = document.createElement('div');
            el.className = 'babe-custom-item';
            el.innerHTML = '<span>📌 ' + c.name + ' — ' + c.date + '</span><button data-idx="' + i + '">✕</button>';
            el.querySelector('button').addEventListener('click', function () {
                tempCustom.splice(parseInt(this.dataset.idx), 1);
                renderBabeCustomList();
            });
            babeCustomList.appendChild(el);
        });
    }

    babeToggle.addEventListener('click', function () {
        var info = BabeInfo.getInfo();
        babeAnniversary.value = mmddToDate(info.anniversary);
        babeBirthday.value = mmddToDate(info.birthday);
        selectedIcon = info.icon || '👸';
        babeModalIcon.textContent = selectedIcon;
        tempCustom = (info.custom || []).slice();
        renderBabeCustomList();
        renderBabeIconPicker();
        babeModal.classList.remove('hidden');
    });

    document.getElementById('babe-custom-add').addEventListener('click', function () {
        var name = babeCustomName.value.trim();
        var dateVal = babeCustomDate.value;
        if (!name || !dateVal) return;
        var mmdd = dateToMMDD(dateVal);
        tempCustom.push({ name: name, date: mmdd, cost: -50 });
        babeCustomName.value = '';
        babeCustomDate.value = '';
        renderBabeCustomList();
    });

    document.getElementById('babe-cancel').addEventListener('click', function () {
        babeModal.classList.add('hidden');
    });

    document.getElementById('babe-save').addEventListener('click', function () {
        BabeInfo.setInfo({
            anniversary: dateToMMDD(babeAnniversary.value) || null,
            birthday: dateToMMDD(babeBirthday.value) || null,
            icon: selectedIcon,
            custom: tempCustom
        });
        babeIconEl.textContent = selectedIcon;
        babeModal.classList.add('hidden');
        renderAll();
    });

    // --- Dark mode toggle ---

    var darkToggle = document.getElementById('dark-toggle');
    var savedTheme = localStorage.getItem('babecred_theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkToggle.textContent = '☀️';
    }

    darkToggle.addEventListener('click', function () {
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            darkToggle.textContent = '🌙';
            localStorage.setItem('babecred_theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkToggle.textContent = '☀️';
            localStorage.setItem('babecred_theme', 'dark');
        }
    });

    // --- Periodic recalculation (every 60s for decay updates) ---

    setInterval(function () {
        if (!mainApp.classList.contains('hidden')) renderAll();
    }, 60000);

})();

// --- PWA: Service Worker + Install Banner ---
(function () {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
    }

    var banner = document.getElementById('install-banner');
    var installBtn = document.getElementById('install-btn');
    var installDismiss = document.getElementById('install-dismiss');
    var installHint = document.getElementById('install-hint');
    var deferredPrompt = null;

    // Don't show if already installed or dismissed
    if (window.matchMedia('(display-mode: standalone)').matches || localStorage.getItem('babecred_install_dismissed')) {
        return;
    }

    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var isAndroid = /Android/.test(navigator.userAgent);

    // Android: capture the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        installHint.textContent = 'Add to your home screen';
        banner.classList.remove('hidden');
    });

    // iOS: show manual instructions
    if (isIOS && !navigator.standalone) {
        installHint.textContent = 'Tap Share → Add to Home Screen';
        installBtn.textContent = 'How';
        banner.classList.remove('hidden');
    }

    installBtn.addEventListener('click', function () {
        if (deferredPrompt) {
            // Android native prompt
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function () { banner.classList.add('hidden'); });
            deferredPrompt = null;
        } else if (isIOS) {
            // Show iOS instructions
            alert('To install BabeCred:\n\n1. Tap the Share button (box with arrow) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"\n\nDone! BabeCred will appear on your home screen like an app.');
        }
    });

    installDismiss.addEventListener('click', function () {
        banner.classList.add('hidden');
        localStorage.setItem('babecred_install_dismissed', '1');
    });
})();
