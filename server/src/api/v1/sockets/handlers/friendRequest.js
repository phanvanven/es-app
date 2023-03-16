module.exports = (socket) => {
    socket.on('friendRequest', (data) => {
        console.log('received friend request:', data);
        // handle the friend request here
    });
};