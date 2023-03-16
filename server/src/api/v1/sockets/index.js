const friendRequestHandler = require('./handlers/friendRequest');
const messageHandler = require('./handlers/message');

const io = require('socket.io')();

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


module.exports = io;