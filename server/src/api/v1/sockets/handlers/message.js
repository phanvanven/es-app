module.exports = (socket) => {
    socket.on('message', (data) => {
        console.log('received message:', data);
        // handle the message here

        

    });
};
