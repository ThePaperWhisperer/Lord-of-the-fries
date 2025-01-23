const express = require("express");
const Ably = require("ably");
const http = require("http");
const fs = require("fs");
const { addWords, isBad } = require("adults");

var roomname;
var users = [];
var rooms = [];
var winners = [];

const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);

const ably = new Ably.Realtime('AUFTWw.lX4uEQ:N9x3o9blgYQF8Q70S2mwM_y3bENa3ijxFteTRHEX6-s');

// Set static folder
app.use(express.static(__dirname));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

ably.connection.on('connected', () => {
    console.log('Connected to Ably!');
});

const getChannel = (room) => {
    return ably.channels.get(room);
};

ably.connection.once('connected', () => {
    const globalChannel = ably.channels.get('global');

    globalChannel.subscribe('userjoined', () => {
        people++;
    });

    globalChannel.subscribe('roomname', (message) => {
        const { room, password } = message.data;
        rooms.push({ room, password });
        getChannel(room).publish('start');
    });

    globalChannel.subscribe('self', (message) => {
        const { link } = message.data;
        getChannel(link);
    });

    globalChannel.subscribe('room', async (message) => {
        const { room, pass } = message.data;
        let foundRoom = false;

        for (let i = 0; i < rooms.length; i++) {
            if (room === rooms[i].room && pass === rooms[i].password) {
                foundRoom = true;
                break;
            }
        }

        if (foundRoom) {
            const roomChannel = getChannel(room);
            const sockets = await roomChannel.presence.get();
            sockets.forEach(s => {
                roomChannel.publish('joinedroom', { nickname: s.clientId });
            });
            roomChannel.publish('start');
        } else {
            globalChannel.publish('roomnotjoined');
        }
    });

    globalChannel.subscribe('username', (message) => {
        const user = message.data;
        const room = Array.from(globalChannel.presence.get())[0].clientId;

        if (users.includes(user) || user === null || user === "" || isBad(user)) {
            globalChannel.publish('usernotadded');
        } else {
            users.push(user);
            getChannel(room).publish('useradded', users);
            getChannel(room).publish('joined', user);
        }
    });

    globalChannel.subscribe('message', (message) => {
        const { msg } = message.data;
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('newmessage', { message: msg, user: message.clientId });
    });

    globalChannel.subscribe('house', (message) => {
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('housemade', message.data);
    });

    globalChannel.subscribe('fire', (message) => {
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('firemade', message.data);
    });

    globalChannel.subscribe('disconnecting', (message) => {
        people--;
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        users = users.filter(use => use !== message.clientId);
        getChannel(room).publish('leave', users);
        getChannel(room).publish('left', message.clientId);
    });

    globalChannel.subscribe('userwon', () => {
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('winnerchosen');
        getChannel(room).publish('gg');
    });

    globalChannel.subscribe('playerhit', () => {
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('damage');
    });

    globalChannel.subscribe('died', (message) => {
        const user = message.data;
        users = users.filter(use => use !== user);
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('leave', users);
        getChannel(room).publish('gameover', user);
    });

    globalChannel.subscribe('hit', (message) => {
        const person = message.data;
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('point', person);
    });

    globalChannel.subscribe('won', (message) => {
        const user = message.data;
        winners.push(user);
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('winner', user);
        if (winners.length === 2) {
            getChannel(room).publish('winners', winners);
        }
    });

    globalChannel.subscribe('move', (message) => {
        const { matrix } = message.data;
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('pmove', { matrix, person: message.clientId });
    });

    globalChannel.subscribe('escape', (message) => {
        const per = message.data;
        const room = Array.from(globalChannel.presence.get())[0].clientId;
        getChannel(room).publish('escaped', per);
    });
});
