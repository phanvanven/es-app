const {verifyToken} = require('./jwt_service');

class SocketService {
  // Remember: the value in the heaeders is always lowercase
  async checkSocket(socket, next){
    try {

      console.log(`->>> User: ${socket.id} is connecting...`);
      const {token} = socket.handshake.headers;
      if(!token){
        return next(new Error('Vui lòng đăng nhập'));
      }
      const payload = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
      socket.id = payload.userID;
      console.log(`->>> new socket.id: ${socket.id}`)
      next();
      
    } catch (error) {

      return next(new Error(error));
    }
  }

  connect(socket) {
    socket.on("disconnect", () => {
      console.log(`->>> User: ${socket.id} disconnected...`);
    });
  }

}

module.exports = new SocketService;