"use strict";
const ChatModel = require("../models/ChatModel.js");

const UserService = require("./UserService");
const ChatService = require("./ChatService");
const { verifyToken } = require("./jwt_service");
const validation = require("../helpers/validation");
const path = require("path");
const { uploadFile, sendFile2 } = require("./FileService");
const createError = require("http-errors");

class SocketService {
  //*temporary completed
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
  // middleware
  async checkWhiteList(socket, next) {}

  async connect(socket) {
    const dir = path.join(__DIRNAME, "api/v1/public");
    sendFile2(socket, dir);
    socket.join(socket.id);

    // join all of the chat rooms
    const allGroups = await UserService.getGroupsListById({
      userID: socket.id,
    });

    if (allGroups) {
      for (const group of allGroups["groups"]) {
        socket.join(group.toString());
      }
    }

    //*temporary completed
    socket.on("private_chat", async (message) => {
      try {
        const { uid, msg } = message;
        const receiverID = uid;
        const senderID = socket.id;
        if (!senderID || !receiverID || !msg) {
          socket.emit('error', {
            message: "Badrequest"
          })
          return;
        }
        if (senderID === receiverID) {
          socket.emit('error', {
            message: "Badrequest"
          })
          return;
        }
        const error1 = validation.validateUserID({ userID: senderID });
        const error2 = validation.validateUserID({ userID: receiverID });
        if (error1.error) {
          socket.emit('error', {
            message: error1.error.details[0].message
          })
          return;
        }
        if (error2.error) {
          socket.emit('error', {
            message: error2.error.details[0].message
          })
          return;
        }
        const [sender, receiver] = await Promise.all([
          UserService.getUserById(senderID),
          UserService.getUserById(receiverID),
        ]);

        if (!sender || !receiver) {
          socket.emit('error', {
            message: "Không tìm thấy người dùng tương ứng"
          })
          return;
        }
        const conversation = await ChatService.updatePrivateChatById({
          senderID: sender._id,
          receiverID: receiver._id,
          msg: message.msg,
        });

        if (!conversation) {
          socket.emit('error', {
            message: "An error!!!"
          })
          return;
        }

        if (!conversation.__v) {
          console.log("New conversation created");
          const docA = await UserService.addConversationById({
            userID: sender._id,
            chatID: conversation._id,
          });

          const docB = await UserService.addConversationById({
            userID: receiver._id,
            chatID: conversation._id,
          });
        }

        __IO.to(message.uid).emit("chat", {
          msg: message.msg,
          uid: socket.id,
          time: conversation.time,
        });

        __IO.to(message.uid).emit("new_messages", {
          msg: message.msg,
          uid: socket.id,
          time: conversation.time,
        });

        socket.emit("chat", {
          msg: message.msg,
          uid: socket.id,
          time: conversation.time,
        });

        // end chat
      } catch (error) {
        socket.emit('error', {
          message: error
        })
        return new Error(error);
      }
    });

    //*temporary completed
    socket.on("group", async (message) => {
      try {
        const { uid, msg } = message;
        const groupID = uid;
        const senderID = socket.id;
        if (!senderID || !groupID || !msg) {
          socket.emit('error', {
            message: "Badrequest"
          })
          return;
        }
        if (senderID === groupID) {
          socket.emit('error', {
            message: "Conflict ID"
          })
          return;
        }
        const { error } = validation.validateUserID({ userID: senderID });
        if (error) {
          socket.emit('error', {
            message: error.details[0].message
          })
          return;
        }

        // const sender = await UserService.getUserById(senderID);
        // const group = await ChatService.getChatById(groupID);

        // if (!sender || !group) {
        //   throw new Error("Not Found!!!");
        // }

        const exist = await ChatService.checkUserExistInChatById({
          userID: senderID,
          chatID: groupID
        })

        if (!exist) {
          socket.emit('error', {
            message: "Bạn không thể tham gia vào cuộc trò chuyện này"
          })
          return;
        }

        const conversation = await ChatService.updateGroupChatById({
          senderID,
          groupID,
          msg,
        });

        // the user does not exist in the group or has not yet joined the group
        if (!conversation) {
          socket.emit('error', {
            message: "An error!!!"
          })
          return;
        }

        // sending to all clients in 'game' room(channel) except sender
        socket.broadcast.to(groupID).emit("chat", {
          msg: message.msg,
          uid: socket.id,
          time: conversation.time,
        });
        
        socket.broadcast.to(groupID).emit("new_messages", {
          msg: message.msg,
          uid: socket.id,
          time: conversation.time,
        });

        socket.emit("chat", {
          msg: message.msg,
          uid: socket.id,
          time: conversation.time,
        });
      } catch (error) {
        socket.emit('error', {
          message: error
        })
        return new Error(error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`->>> User: ${socket.id} disconnected...`);
    });
  }
}

module.exports = new SocketService();
