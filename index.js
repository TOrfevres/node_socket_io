let config = require('config');
let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

io.on('connection', socket => {
    io.emit('usersL', Object.keys(io.sockets.clients().connected));

    socket.on('message', msg => {
        if (msg.msg.startsWith('/m ')) {
            let asList = msg.msg.split(' ');
            let secondSocket = io.sockets.clients().connected[asList[1]];
            let roomName = socket.id + secondSocket;
            if (!Object.keys(socket.rooms).includes(roomName)) socket.join(roomName);
            if (!Object.keys(secondSocket).includes(roomName)) secondSocket.join(roomName);
            asList.shift();
            asList.shift();
            msg.msg = asList.join(' ');
            msg.private = true;
            io.to(roomName).emit('message', msg)
        } else {
            io.emit('message', msg)
        }
    });

    socket.on('usersG', subTag => {
        socket.emit('usersR', Object.keys(io.sockets.clients().connected).filter(s => s.includes(subTag) && s !== socket.id))
    });

    socket.on('disconnect', () => {
        io.emit('usersL', Object.keys(io.sockets.clients().connected));
    });
});

app.all('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.use((err, req, res, next) => {
    if (err) {
        res.status(500).send("Your request " + req.method + " hasn't been processed.\n" + err);
    }
    next();
});

http.listen(config.get('server.port'), () => {
    console.log(
        'APP READY!:\n',
        '• Listening on localhost:' + config.get('server.port') + '.\n'
    );
});