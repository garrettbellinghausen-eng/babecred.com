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

    // --- Lobby preview (mobile) ---

    const lobbyPreview = document.getElementById('lobby-preview');
    const lobbyPreviewMsgs = document.getElementById('lobby-preview-msgs');
    const lobbyPreviewTap = document.getElementById('lobby-preview-tap');
    const lobbyHandle = document.getElementById('lobby-handle');
    const previewOnlineCount = document.getElementById('preview-online-count');

    // Mirror chat messages into lobby preview
    function addToLobbyPreview(msg) {
        if (!lobbyPreviewMsgs) return;
        const c = getNameColor(msg.name);
        var balTag = '';
        if (msg.balance !== undefined) {
            const emoji = balEmoji(msg.balance);
            const cls = msg.balance >= 0 ? 'pos' : 'neg';
            const prefix = msg.balance >= 0 ? '+' : '';
            balTag = ' <span class="cm-bal ' + cls + '">' + emoji + '[' + prefix + msg.balance + ']</span>';
        }
        const div = document.createElement('div');
        div.innerHTML = '<span class="cm-name nc' + c + '">' + sanitize(msg.name) + '</span>'
            + balTag + ': ' + sanitize(msg.text);
        lobbyPreviewMsgs.appendChild(div);
        // Keep only last 20
        while (lobbyPreviewMsgs.children.length > 20) {
            lobbyPreviewMsgs.removeChild(lobbyPreviewMsgs.firstChild);
        }
        lobbyPreviewMsgs.scrollTop = lobbyPreviewMsgs.scrollHeight;
    }

    // Patch renderChatMessage to also feed the preview
    var _origRenderChat = renderChatMessage;
    renderChatMessage = function (msg) {
        _origRenderChat(msg);
        addToLobbyPreview(msg);
    };

    // Update preview online count when presence changes
    var _origPresenceCb = null;

    // Tap lobby preview -> switch to chat tab
    if (lobbyPreviewTap) {
        lobbyPreviewTap.addEventListener('click', function () {
            var chatTab = document.querySelector('.mobile-tab[data-tab="chat"]');
            if (chatTab) chatTab.click();
        });
    }

    // --- Drag handle to resize lobby preview ---

    if (lobbyHandle) {
        var isDragging = false;
        var startY = 0;
        var startHeight = 0;
        var minHeight = 80;
        var maxHeight = 400;

        function onDragStart(y) {
            isDragging = true;
            startY = y;
            startHeight = lobbyPreview.offsetHeight;
            lobbyPreview.style.transition = 'none';
        }

        function onDragMove(y) {
            if (!isDragging) return;
            var delta = startY - y;
            var newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + delta));
            lobbyPreview.style.height = newHeight + 'px';
        }

        function onDragEnd() {
            isDragging = false;
            lobbyPreview.style.transition = '';
        }

        // Touch events
        lobbyHandle.addEventListener('touchstart', function (e) {
            onDragStart(e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchmove', function (e) {
            if (isDragging) onDragMove(e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchend', onDragEnd);

        // Mouse events (for testing on desktop)
        lobbyHandle.addEventListener('mousedown', function (e) {
            e.preventDefault();
            onDragStart(e.clientY);
        });
        document.addEventListener('mousemove', function (e) {
            if (isDragging) onDragMove(e.clientY);
        });
        document.addEventListener('mouseup', onDragEnd);
    }

    // Update preview online count from presence
    if (previewOnlineCount) {
        var origInit = Chat.init;
        Chat.init = function (config, callbacks) {
            var origPresence = callbacks.onPresence;
            callbacks.onPresence = function (users) {
                if (origPresence) origPresence(users);
                previewOnlineCount.textContent = users.length;
            };
            origInit(config, callbacks);
        };
    }

    // --- Periodic recalculation (every 60s for decay updates) ---

    setInterval(function () {
        if (!mainApp.classList.contains('hidden')) {
            renderAll();
        }
    }, 60000);

})();
