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
