// comments.js — Snarky commentary engine
// Returns a comment + insight + suggested actions based on current balance and ledger state

var CommentEngine = (function () {

    // 100+ unique comments organized by balance tier
    var COMMENTS = {
        legendary: [ // +200 and up
            "You're operating at a level most men only dream about. Don't get cocky.",
            "At this rate, she might actually let you name the dog.",
            "You could disappear for a week and she'd still tell her friends you're 'one of the good ones.'",
            "The Bureau has flagged your account for suspicious positivity. Investigation pending.",
            "Sir, this is an unhealthy amount of babe cred. Consider treating yourself.",
            "You've earned the right to leave the toilet seat up. Once. Maybe.",
            "Even her mother likes you right now. That's how you know it's real.",
            "Your cred is so high, she's bragging about you in the group chat. Unprompted.",
            "This balance is giving 'he planned a whole surprise trip' energy.",
            "Legend status. But remember: it all decays. Clock's ticking.",
            "She just defended you in an argument with her sister. You've peaked.",
            "At this level you could say 'I don't care where we eat' and survive.",
        ],
        high: [ // +100 to +199
            "Looking strong. But don't let it go to your head — this evaporates faster than you think.",
            "Solid balance. You could probably survive a boys' night without consequences.",
            "She actually laughed at your joke yesterday. The cred is working.",
            "You're in the green. Time to start planning that thing you've been afraid to ask about.",
            "Triple digits. Your deposits are outpacing decay. Rare.",
            "This is 'sure honey, go ahead' territory. Use it wisely.",
            "You've banked enough to absorb a medium-sized mistake. Don't test it.",
            "Your cred is healthy. But healthy doesn't mean invincible. Keep grinding.",
            "She said 'we should do this more often' and actually meant it. That's +100 energy.",
            "Strong position. A strategic boys' night is now on the table.",
            "This is the balance of a man who takes out the trash without being asked. Respect.",
            "You're ahead. But her memory is longer than your lead. Stay sharp.",
        ],
        good: [ // +50 to +99
            "Not bad. You've got a cushion, but one 'I forgot' away from trouble.",
            "Positive territory. She's not mad at you. That's the baseline, king.",
            "You could afford a golf day. Barely. Don't push it.",
            "Your cred says 'attentive partner.' Don't ruin it by asking what's for dinner.",
            "Decent buffer. But those deposits are decaying as we speak.",
            "You're above water. Enjoy it — this feeling is temporary.",
            "She's in a good mood with you. This is the window. Plan something.",
            "Comfortable lead. But comfort breeds complacency. That's how you end up at -50.",
            "Your balance could survive a late night gaming session. One. Singular.",
            "You've earned some breathing room. Don't waste it on 'you look fine.'",
            "Mid-positive. The deposits from last week are fading. Time to re-up.",
            "Solid enough. But 'solid enough' is how every man describes himself before the fall.",
        ],
        okay: [ // +1 to +49
            "Technically positive. Technically.",
            "You're above zero, which is more than most guys can say. Low bar.",
            "A slight breeze could knock you negative. Maybe do the dishes.",
            "You're one forgotten errand away from the red. Tread lightly.",
            "Barely positive. Like saying 'I'm not broke, I have $4.'",
            "This balance screams 'I did something nice... three days ago.'",
            "You're surviving, not thriving. There's a difference.",
            "One bad comment and you're underwater. Choose your words carefully.",
            "The system recognizes your effort. The system also thinks you could try harder.",
            "Hovering near zero. She's watching. She's always watching.",
            "Your cred is like your phone battery at 8%. Technically alive.",
            "A boys' night right now would be financial suicide. Just saying.",
        ],
        zero: [ // -5 to +5 (effectively zero)
            "You're at zero. The default state of a man who does the bare minimum.",
            "Perfectly balanced — and not in a cool Thanos way. In a 'you're not trying' way.",
            "Zero cred. You exist in the relationship. Congratulations.",
            "This is the cred equivalent of a participation trophy.",
            "Flat zero. The flowers from last week? She forgot. You should've gotten better flowers.",
            "You're treading water. Not drowning, but not exactly swimming either.",
            "Zero. The mathematical representation of 'fine, I guess.'",
            "Neither positive nor negative. Just... there. Like beige wallpaper.",
            "Your balance is as empty as your 'I'll do it later' promises.",
            "Ground zero. Every man passes through here. Most stay here.",
        ],
        slight_negative: [ // -1 to -49
            "You're in the red. She hasn't said anything yet, but she's keeping score.",
            "Slightly negative. That thing you think she forgot? She didn't.",
            "Deficit detected. The Bureau recommends immediate corrective action.",
            "You owe cred. That 'gaming session' is still on the books.",
            "Negative balance. The interest on this debt is your peace of mind.",
            "She's not mad. She's 'disappointed.' Which is worse.",
            "Minor deficit. Fixable with effort. The question is: will you?",
            "Red zone. A surprise coffee run could turn this around. Or flowers. Flowers always work.",
            "Your balance says 'I took her for granted this week.'",
            "Small hole, but holes only get deeper if you ignore them.",
            "In the negative. She's being patient. Don't confuse patience with forgiveness.",
            "You're behind. The trash isn't going to take itself out.",
        ],
        negative: [ // -50 to -99
            "This is bad. You know what you did.",
            "Deficit territory. She's mentioned it to at least one friend.",
            "Your cred is in freefall. Stop gaming and start cooking.",
            "At this rate, you won't see zero for weeks. Start planning.",
            "She's using your full name. That's never good.",
            "Significant deficit. The Bureau classifies this as 'self-inflicted.'",
            "You're deep enough in the red that quick fixes won't cut it. Think bigger.",
            "Your balance says 'boys' night went too long.' Classic.",
            "This deficit needs a multi-day recovery plan. Start with the dishes. End with flowers.",
            "She said 'it's fine.' It is absolutely not fine.",
            "Negative fifty-plus. Her friends know about this. They always know.",
            "You're in a hole. The first step is to stop digging. Put the controller down.",
        ],
        bad: [ // -100 to -199
            "Critical deficit. This is a 'plan a surprise trip immediately' situation.",
            "Triple digit negative. The Bureau recommends groveling.",
            "Your cred is in crisis. She's considering whether you're 'really trying.'",
            "This balance says 'forgot anniversary' or 'boys weekend without planning.'",
            "You're so deep in the red, your deposits need deposits.",
            "At this level, even the dog is judging you.",
            "Emergency status. Daily deposits required. No exceptions.",
            "She's not mad anymore. She's moved past mad into 'evaluating life choices.'",
            "This hole will take months to climb out of. Should've planned ahead.",
            "Your cred score would get you denied for a relationship loan.",
            "The silent treatment isn't her punishing you. She's doing math.",
            "Critical. You need a grand gesture and then 30 days of consistency.",
        ],
        catastrophic: [ // -200 and below
            "The Bureau has issued a formal warning. Your relationship credit rating is junk.",
            "This is extinction-level deficit. You might need to plan a vacation. For her. Without you.",
            "Your cred is so low, 'I'm sorry' has lost all meaning. Only actions count now.",
            "We've seen bear markets. This is a bear apocalypse.",
            "At this point, doing the dishes is like throwing pennies at a mortgage.",
            "She's not angry. She's making a pros and cons list. You're losing.",
            "The system has never seen numbers this low from someone still in a relationship.",
            "You're so far negative that your deposits decay before they make a dent.",
            "Catastrophic. The Bureau recommends a full lifestyle audit.",
            "Your deficit has its own half-life at this point. And it's long.",
            "Rock bottom has a basement. You found it.",
            "She's googling 'is it normal to want to be alone' and you should be very concerned.",
        ]
    };

    function getTier(bal) {
        if (bal >= 200) return 'legendary';
        if (bal >= 100) return 'high';
        if (bal >= 50) return 'good';
        if (bal > 5) return 'okay';
        if (bal >= -5) return 'zero';
        if (bal > -50) return 'slight_negative';
        if (bal > -100) return 'negative';
        if (bal > -200) return 'bad';
        return 'catastrophic';
    }

    // Pick a pseudo-random comment based on day + balance tier so it doesn't flicker
    function getComment(bal) {
        var tier = getTier(bal);
        var comments = COMMENTS[tier];
        var dayHash = Math.floor(Date.now() / 86400000) + Math.abs(Math.round(bal));
        return comments[dayHash % comments.length];
    }

    // Generate insight about deficit recovery time
    function getInsight(bal, ledger) {
        // Check for scheduled withdrawals first
        var scheduled = ledger.filter(function (e) { return e.scheduled; });
        if (scheduled.length > 0) {
            var nextUp = scheduled.reduce(function (a, b) { return a.timestamp < b.timestamp ? a : b; });
            var daysUntil = Math.ceil((nextUp.timestamp - Date.now()) / 86400000);
            var projBal = bal + nextUp.value;
            var projPrefix = projBal >= 0 ? '+' : '';
            if (projBal < 0 && bal >= 0) {
                return '🚨 "' + nextUp.desc + '" (' + nextUp.value + ') hits in ' + daysUntil + ' day' + (daysUntil === 1 ? '' : 's') + '. You\'ll be at ' + projPrefix + Math.round(projBal) + '. Start banking cred NOW.';
            }
            if (projBal < bal) {
                return '📅 "' + nextUp.desc + '" (' + nextUp.value + ') is ' + daysUntil + ' day' + (daysUntil === 1 ? '' : 's') + ' out. Projected balance after: ' + projPrefix + Math.round(projBal) + '. Plan accordingly.';
            }
        }

        if (bal >= 50) {
            // Find highest value deposit that's decaying
            var deposits = ledger.filter(function (e) { return e.type === 'deposit' && e.currentValue > 1; });
            if (deposits.length > 0) {
                var biggest = deposits.reduce(function (a, b) { return a.currentValue > b.currentValue ? a : b; });
                var daysToHalf = biggest.halfLife || 7;
                return '⏳ Your "' + biggest.desc + '" cred (' + Math.round(biggest.currentValue) + ') will be worth half in ~' + daysToHalf + ' days. Use your balance before it evaporates.';
            }
            return '⏳ Remember: every deposit is decaying right now. Spend or lose it.';
        }
        if (bal >= 0) {
            return '⚖️ You\'re at zero. One good gesture puts you ahead. One bad move puts you under.';
        }
        // Negative — estimate natural recovery time
        var deficit = Math.abs(bal);
        // Rough estimate: withdrawals recover at ~2/day average
        var daysToRecover = Math.round(deficit / 2);
        if (daysToRecover > 60) {
            return '📉 At natural recovery speed, this deficit clears in ~' + daysToRecover + ' days. That\'s ' + Math.round(daysToRecover / 30) + ' months of her remembering. Start grinding.';
        }
        if (daysToRecover > 14) {
            return '📉 This deficit takes ~' + daysToRecover + ' days to clear on its own. Or you could do something about it. Just a thought.';
        }
        return '📉 About ' + daysToRecover + ' days to naturally recover. A few good deposits could speed that up significantly.';
    }

    // Suggested actions based on balance
    function getSuggestions(bal) {
        if (bal <= -100) {
            // Emergency mode — big gestures only
            return [
                { emoji: '✈️', name: 'Plan a trip', val: '+60', type: 'deposit' },
                { emoji: '✨', name: 'Surprise date', val: '+30', type: 'deposit' },
                { emoji: '👶', name: 'Take the kids', val: '+40', type: 'deposit' },
                { emoji: '🎁', name: 'Thoughtful gift', val: '+25', type: 'deposit' },
            ];
        }
        if (bal <= -50) {
            // Recovery mode — consistent effort
            return [
                { emoji: '✨', name: 'Date night', val: '+30', type: 'deposit' },
                { emoji: '🗑️', name: 'Trash (unasked)', val: '+25', type: 'deposit' },
                { emoji: '🍳', name: 'Make breakfast', val: '+12', type: 'deposit' },
                { emoji: '💐', name: 'Flowers', val: '+15', type: 'deposit' },
            ];
        }
        if (bal < 0) {
            // Slightly negative — quick wins
            return [
                { emoji: '🗑️', name: 'Trash (unasked)', val: '+25', type: 'deposit' },
                { emoji: '🍳', name: 'Breakfast', val: '+12', type: 'deposit' },
                { emoji: '💐', name: 'Flowers', val: '+15', type: 'deposit' },
                { emoji: '💬', name: 'Actually listen', val: '+8', type: 'deposit' },
            ];
        }
        if (bal < 50) {
            // Near zero or slightly positive — build buffer
            return [
                { emoji: '🧹', name: 'Clean up', val: '+10', type: 'deposit' },
                { emoji: '🍽️', name: 'Cook dinner', val: '+12', type: 'deposit' },
                { emoji: '🗑️', name: 'Trash', val: '+25', type: 'deposit' },
                { emoji: '📱', name: 'Like her post', val: '+1', type: 'deposit' },
            ];
        }
        if (bal < 100) {
            // Positive — mix of deposits and affordable withdrawals
            return [
                { emoji: '🍳', name: 'Breakfast', val: '+12', type: 'deposit' },
                { emoji: '🎮', name: 'Gaming ok', val: '-20', type: 'withdrawal' },
                { emoji: '⛳', name: 'Golf day', val: '-25', type: 'withdrawal' },
                { emoji: '💐', name: 'Flowers', val: '+15', type: 'deposit' },
            ];
        }
        // High positive — you can afford things
        return [
            { emoji: '🍺', name: "Boys' night", val: '-30', type: 'withdrawal' },
            { emoji: '🎮', name: 'Game all day', val: '-20', type: 'withdrawal' },
            { emoji: '⛳', name: 'Golf day', val: '-25', type: 'withdrawal' },
            { emoji: '🏈', name: "Boys' weekend", val: '-80', type: 'withdrawal' },
        ];
    }

    return {
        getComment: getComment,
        getInsight: getInsight,
        getSuggestions: getSuggestions,
        getTier: getTier
    };
})();
