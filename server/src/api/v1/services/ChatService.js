"use strict";
// Models
const ChatModel = require("../models/ChatModel");
// Services
const UserService = require("../services/UserService");
const createError = require("http-errors");
const MessageService = require("../services/MessageService");
// Utils

module.exports = {
  getChatById: async ({ userID, chatID, numbers = 1, limit = 20 }) => {
    try {
      const data = await ChatModel.findOne({
        _id: chatID,
        "members._id": userID,
      });

      let requestable = true;
      const length = data.messages.length;
      let start = length - (limit * numbers);
      let end = start + limit;

      if (start > 0) {
        data.messages = data.messages.slice(start, end);
      } else {
        requestable = false;
        if (start < 0 && start > -limit) {
          data.messages = data.messages.slice(0, limit + start);
        }else{
          data.messages = [];
        }
      }

      return {
        status: 200,
        message: "Hội thoại",
        conversation: data,
        requestable: requestable
      };
    } catch (error) {
      return error;
    }
  },
  checkUserExistInChatById: async ({ userID, chatID }) => {
    try {
      const exist = await ChatModel.findOne({
        _id: chatID,
        "members._id": userID,
      });

      return exist ? exist : null;
    } catch (error) {
      return error;
    }
  },
  //*temporary completed
  updatePrivateChatById: async ({ senderID, receiverID, msg }) => {
    try {
      // create a new message
      const message = await MessageService.createMessage(
        {
          senderID: senderID,
          content: msg,
          // repliedID: null,
        },
        {
          //options
        }
      );

      if (!message) {
        return false;
      }

      const conversation = await ChatModel.findOneAndUpdate(
        {
          type: "private",
          members: {
            //truy vấn sử dụng toán tử $elemMatch để tìm các tài liệu có mảng members chứa cả userA và userB.
            $elemMatch: { _id: senderID },
            $elemMatch: { _id: receiverID },
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
              { _id: senderID, role: "chatter" },
              { _id: receiverID, role: "chatter" },
            ],
            // other fields...
          },
          $push: {
            messages: [message._id],
          },

          // old structure
          // $push: {
          //   messages: {
          //     //$each chỉ hoạt động khi bạn sử dụng $push với một mảng,
          //     //nếu bạn chỉ định một đối tượng, bạn không cần phải sử dụng $each.
          //     $each: [
          //       {
          //         sender: senderID,
          //         content: msg,
          //         attached: {
          //           filename: "",
          //           originalname: "",
          //           contentType: "",
          //           path: "",
          //           size: "",
          //           fileType: "",
          //         },
          //         //   seen: [receiverID]
          //       },
          //     ],

          //     // $position: 0, // nếu bạn muốn thêm phần tử vào đầu mảng messages
          //     // $slice: 10,
          //     // $sort: { timestamp: -1 },
          //     // $sort: { "attached.size": 1 },
          //     // $slice: -10,
          //   },
          // },
        },
        {
          upsert: true,
          new: true,
        }
      );

      // C2 to add user into seen array
      //   const messageIndex = conversation.messages.length - 1;
      //   conversation.messages[messageIndex].seen.addToSet(receiverID);
      //   await conversation.save();

      if (!conversation.__v) {
        conversation.__v++;
        await conversation.save();
        conversation["time"] = message.time;
        conversation.__v--;
        return conversation;
      }
      conversation["time"] = message.time;
      return conversation;
    } catch (error) {
      return error;
    }
  },
  updateGroupChatById: async ({ senderID, groupID, msg }) => {
    try {
      const message = await MessageService.createMessage(
        {
          senderID: senderID,
          content: msg,
        },
        {
          //options
        }
      );

      if (!message) {
        return false;
      }

      const conversation = await ChatModel.findOneAndUpdate(
        {
          _id: groupID,
          $and: [
            { "members._id": senderID },
            {
              $or: [
                { "members.role": "chatter" },
                { "members.role": "editor" },
                { "members.role": "admin" },
              ],
            },
          ],
        },
        {
          $push: {
            messages: [message._id],
          },
        },
        {
          new: true,
        }
      );
      conversation["time"] = message.time;
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
              $each: [{ _id: userID, role: "chatter" }],
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
  createGroup: async ({ userID, groupName, password = null }) => {
    try {
      const group = new ChatModel({
        type: "group",
        members: [
          {
            _id: userID,
            role: "admin",
          },
        ],
        groupName: groupName,
      });

      if (password) {
        group.password = password;
      }

      const newGroup = await group.save();

      if (!newGroup) {
        return createError("Có lỗi xảy ra xin thử lại sau.");
      }

      await UserService.addConversationById({
        userID: userID,
        chatID: newGroup._id,
      });

      await UserService.addGroupById({
        userID: userID,
        groupID: newGroup._id,
      });

      return {
        status: 200,
        message: `Tạo nhóm "${groupName}" thành công.`,
        group: newGroup,
      };
    } catch (error) {
      return error;
    }
  },
  addMemberToGroup: async (group, memberID, role = "chatter") => {
    try {
      const member = await UserService.getUserById(memberID);
      if (member) {
        group.members.addToSet({ _id: memberID, role: role });
        await group.save();
        return group;
      } else {
        return null;
      }
    } catch (error) {
      return error;
    }
  },
};
