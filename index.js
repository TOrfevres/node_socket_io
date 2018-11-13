let config = require('config');
let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

io.on('connection', socket => {
    io.emit('usersL', Object.keys(io.sockets.clients().connected));

    socket.on('message', msg => {
        let asList = msg.msg.split(' ');
        let targetSockets = [socket];
        let joinSocketsToRoom = (room, sockets) => {
            sockets.sort((a, b) => {

            });
            sockets.forEach(s => {
                if (!Object.keys(s.rooms).includes(room)) s.join(room);
            });
        };
        let sendMsgToRoom = (room, msg) => {
            msg.private = true;
            io.to(room).emit('message', msg);
        };

        switch (asList[0]) {
            // SEND A PRIVATE MESSAGE
            case '/m':
                targetSockets.push(io.sockets.clients().connected[asList[1]]);
                joinSocketsToRoom(targetSockets.join(''), targetSockets);
                msg.msg = asList.slice(2).join(' ');
                sendMsgToRoom(targetSockets.join(''), msg);
                break;

            // CREATE A PRIVATE ROOM W/ USERS
            case '/r':
                asList.slice(2).forEach(e => {
                    targetSockets.push(io.sockets.clients().connected[e]);
                });
                joinSocketsToRoom(asList[1], targetSockets);
                break;

            // SEND A MESSAGE TO A PRIVATE ROOM
            case '/g':
                msg.msg = asList.slice(2).join(' ');
                sendMsgToRoom(asList[1], msg);
                break;

            default:
                if (asList[0].startsWith('/')) {
                    socket.emit('message', {
                        id: 'Server',
                        date: Date.now(),
                        msg: asList[0] + ' is an unknown command ...',
                        private: false
                    });
                } else {
                    io.emit('message', msg);
                }
                break;
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