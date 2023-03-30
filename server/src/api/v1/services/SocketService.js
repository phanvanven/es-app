"use strict";
const ChatModel = require("../models/ChatModel.js");

const UserService = require("./UserService");
const ChatService = require("./ChatService");
const { verifyToken } = require("./jwt_service");
const validation = require("../helpers/validation");
const path = require("path");
const { uploadFile, sendFile2 } = require("./FileService");

class SocketService {
  // Remember: the value in the heaeders is always lowercase
  async checkSocket(socket, next) {
    try {
      console.log(`->>> User: ${socket.id} is connecting...`);
      const { token } = socket.handshake.headers;
      if (!token) {
        return next(new Error("Vui lòng đăng nhập"));
      }
      const payload = await verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
      socket.id = payload.userID;
      console.log(`->>> new socket.id: ${socket.id}`);
      next();
    } catch (error) {
      return next(new Error(error));
    }
  }
  connect(socket) {
    const dir = path.join(__DIRNAME, "api/v1/public");
    socket.join(socket.id);
    sendFile2(socket, dir);

    socket.on("disconnect", () => {
      console.log(`->>> User: ${socket.id} disconnected...`);
    });

    // private chat
    socket.on("private_chat", async (message) => {
      try {
        const { uid, msg } = message;
        const receiverID = uid;
        const senderID = socket.id;
        if (!senderID || !receiverID || !msg) {
          throw new Error("BadRequest");
        }
        if (senderID === receiverID) {
          throw new Error("BadRequest");
        }
        const error1 = validation.validateUserID({ userID: senderID });
        const error2 = validation.validateUserID({ userID: receiverID });
        if (error1.error) {
          throw new Error(error1.error.details[0].message);
        }
        if (error2.error) {
          throw new Error(error2.error.details[0].message);
        }
        const [sender, receiver] = await Promise.all([
          UserService.getUserById(senderID),
          UserService.getUserById(receiverID),
        ]);

        if (!sender || !receiver) {
          throw new Error("Không tìm thấy người dùng tương ứng");
        }

        const conversation = await ChatService.updatePrivateChatById({
          senderID: sender._id,
          receiverID: receiver._id,
          msg: message.msg
        })


        if (!conversation.__v) {
          console.log('New conversation created');
          const docA = await UserService.addConversationById({
            userID: sender._id,
            chatID: conversation._id,
          })
  
          const docB = await UserService.addConversationById({
            userID: receiver._id,
            chatID: conversation._id,
          })
        } 

        __IO.to(message.uid).emit("private_chat", {
          msg: message.msg, 
          uid: socket.id,
        });

        socket.emit("private_chat", {
          msg: message.msg,
          uid: socket.id,
        });

        // end chat
      } catch (error) {
        console.log(error);
        return new Error(error);
      }
    });

    // private group chat    
    socket.on("group", async (message) => {
      try {
        // start check
        const { uid, msg } = message;
        const groupID = uid;
        const senderID = socket.id;
        if (!senderID || !groupID || !msg) {
          throw new Error("BadRequest");
        }
        if (senderID === groupID) {
          throw new Error("Conflict ID");
        }
        const { error } = validation.validateUserID({ userID: senderID });
        if (error) {
          throw new Error(error.details[0].message);
        }

        const sender = await UserService.getUserById(senderID);
        const group = await ChatService.getChatById(groupID);   

        if (!sender || !group) {
          throw new Error("Not Found!!!");
        }

        const conversation = await ChatService.updateGroupChatById({
          senderID,
          groupID,
          msg
        })

        // sending to all clients in 'game' room(channel) except sender
        socket.broadcast.to(groupID).emit('group', 'nice game');

        
      } catch (error) {
        console.log(error);
        return new Error(error);
      }
    });
  }
}

module.exports = new SocketService();
