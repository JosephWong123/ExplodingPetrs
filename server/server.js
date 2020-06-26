const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();

const clientPath = `${__dirname}/../client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));

const server = http.createServer(app);

const io = socketio(server);

const games = {};

io.on('connection', (socket) => {
    socket.on('message', (text) => {
        io.emit('message', text);
    });

    socket.on('create', (payload) => {
        const clientId = payload.clientId;
        const name = payload.name;
        const gameId = guid();

        games[gameId] = {
            "id": gameId,
            "clients": [],
            "admin": clientId,
            "adminName": name
        };
        
        io.to(payload.clientId).emit('gameCreated', gameId);

        const game = games[gameId];
        game.clients.push({
            "clientId": clientId,
            "name": name,
        })

    });

    socket.on('join', (payload) => {
        const clientId = payload.clientId;
        const name = payload.name;
        const gameId = payload.gameId;

        if (!(gameId in games)) {
            io.to(payload.clientId).emit('gameJoinError', gameId + " does not exist");
            return;
        }
        const game = games[gameId];

        // Max players = 8
        if (game.clients.length >= 8) {
            return;
        }

        io.to(payload.clientId).emit("gameJoined");

        game.clients.push({
            "clientId": clientId,
            "name": name,
        });
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

server.listen(8080, () => {
    console.log('RPS started on 8080');
});

// Generating game ID, definitely not copy/pasted from Stack Overflow
function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();