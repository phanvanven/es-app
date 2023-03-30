"use strict";
// Models
const ChatModel = require("../models/ChatModel");
// Services
const UserService = require("../services/UserService");
const createError = require("http-errors");
// Utils

module.exports = {
  getChatById: async (chatID, standard = false, options = null) => {
    try {
      if (standard && options) {
        return await ChatModel.findOne({ _id: chatID }, options);
      }
      const standardOptions = {
        __v: 0,
        password: 0,
      };
      return await ChatModel.findOne({ _id: chatID }, standardOptions);
    } catch (error) {
      return error;
    }
  },
  updatePrivateChatById: async ({ senderID, receiverID, msg }) => {
    try {
      const conversation = await ChatModel.findOneAndUpdate(
        {
          type: "private",
          members: {
            //truy vấn sử dụng toán tử $elemMatch để tìm các tài liệu có mảng members chứa cả userA và userB.
            $elemMatch: { user: senderID },
            $elemMatch: { user: receiverID },
          },
        },
        {
          // $set // thêm mới nếu không tồn tại và ghi đè nếu đã tồn tại
          // $addToSet // thêm mới nếu như không tồn tại
          //$setOnInsert chỉ được áp dụng khi document không tồn tại.
          //Nếu document đã tồn tại, nó sẽ không ảnh hưởng đến document.
          $setOnInsert: {
            type: "private",
            members: [
              { user: senderID, role: "chatter" },
              { user: receiverID, role: "chatter" },
            ],
            // other fields...
          },
          $push: {
            messages: {
              //$each chỉ hoạt động khi bạn sử dụng $push với một mảng,
              //nếu bạn chỉ định một đối tượng, bạn không cần phải sử dụng $each.
              $each: [
                {
                  sender: senderID,
                  content: msg,
                  attached: {
                    filename: "",
                    originalname: "",
                    contentType: "",
                    path: "",
                    size: "",
                    fileType: "",
                  },
                  //   seen: [receiverID]
                },
              ],

              // $position: 0, // nếu bạn muốn thêm phần tử vào đầu mảng messages
              // $slice: 10,
              // $sort: { timestamp: -1 },
              // $sort: { "attached.size": 1 },
              // $slice: -10,
            },
          },
          
        },
        {
          upsert: true,
          new: true,
        //   returnDocument: "after" // before
        }
      );

      // C2 to add user into seen array
      //   const messageIndex = conversation.messages.length - 1;
      //   conversation.messages[messageIndex].seen.addToSet(receiverID);
      //   await conversation.save();
        
      if(!conversation.__v){
        conversation.__v++;
        await conversation.save();
        conversation.__v--;
        return conversation;
      }
      return conversation;
    } catch (error) {
      return error;
    }
  },
  updateGroupChatById: async ({ senderID, groupID, msg }) => {
    try {
      const conversation = await ChatModel.findOneAndUpdate(
        {
          _id: groupID,
          members: {
            $and: [
              { user: senderID },
              {
                $or: [
                  { role: "chatter" },
                  { role: "editor" },
                  { role: "admin" },
                ],
              },
            ],
          },
        },
        {
          $push: {
            messages: {
              $each: [
                {
                  sender: senderID,
                  content: msg,
                },
              ],
            },
          },
        },
        {
          new: true,
        }
      );

      return conversation;
    } catch (error) {
      return error;
    }
  },
  joinGroupChatByPassword: async ({ userID, groupID, password }) => {
    try {
      const conversation = await ChatModel.findOne({ _id: groupID });

      if (!conversation) {
        return createError.NotFound();
      }

      const isValid = await conversation.isCheckPassword(password);
      if (!isValid) {
        return createError.Unauthorized();
      }

      const updatedConver = await ChatModel.findOneAndUpdate(
        {
          _id: groupID,
        },
        {
          $addToSet: {
            members: {
              $each: [{ user: userID, role: "chatter" }],
            },
          },
        },
        {
          new: true,
        }
      );

      return updatedConver;
    } catch (error) {
      return error;
    }
  },
};
