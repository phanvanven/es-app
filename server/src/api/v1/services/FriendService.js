"use strict";
// Models
const FriendModel = require("../models/FriendModel");
// Services
const createError = require("http-errors");
const UserService = require("../services/UserService");
const SocketService = require("../services/socket_service");
// Utils

module.exports = {
  request: async ({ requesterID, recipientID }) => {
    try {
      const [requester, recipient] = await Promise.all([
        UserService.isExist(requesterID),
        UserService.isExist(recipientID),
      ]);

      if (!requester || !recipient) {
        return createError.NotFound(
          "Không tìm thấy thông tin người dùng tương ứng. Xin kiểm tra lại!"
        );
      }

      // If the document does not exist, findOneAndUpdate in MongoDB will automatically generate a new document
      /*
            Lets say we have two users UserA and UserB... So when UserA requestes UserB to be a friends at that time 
            we make two documents so that UserA can see requested and UserB can see pending 
            and at the same time we push the _id of these documents in user's friends
            */
      const docA = await FriendModel.findOneAndUpdate(
        { requester: requesterID, recipient: recipientID },
        { $set: { status: 1 } },
        { upsert: true, new: true }
      );

      const docB = await FriendModel.findOneAndUpdate(
        { recipient: requesterID, requester: recipientID },
        { $set: { status: 2 } },
        { upsert: true, new: true }
      );

      const options1 = { $push: { friends: docA._id } };
      const options2 = { $push: { friends: docB._id } };

      const updatedRequester = await UserService.updateFriends(
        requesterID,
        options1
      );
      const updatedRecipient = await UserService.updateFriends(
        recipientID,
        options2
      );

      return {
        status: 200,
        message: "Gửi yêu cầu kết bạn thành công.",
        time: docA.updatedAt
      };
    } catch (error) {
      return error;
    }
  },
  accept: async ({ recipientID, requesterID }) => {
    try {
      const updatedRequester = await FriendModel.findOneAndUpdate(
        { requester: recipientID, recipient: requesterID },
        { $set: { status: 3 } },
        { upsert: true, new: true }
      );
      const updatedRecipient = await FriendModel.findOneAndUpdate(
        { recipient: recipientID, requester: requesterID },
        { $set: { status: 3 } },
        { upsert: true, new: true }
      );
      
      return {
        status: 200,
        message: "Đã chấp nhận yêu cầu kết bạn",
        time: updatedRecipient.updatedAt

      };
    } catch (error) {
      return error;
    }
  },
  reject: async ({ recipientID, requesterID }) => {
    try {
      const docA = await FriendModel.findOneAndRemove({
        requester: requesterID,
        recipient: recipientID,
      });
      const docB = await FriendModel.findOneAndRemove({
        recipient: requesterID,
        requester: recipientID,
      });
      const options1 = { $pull: { friends: docA._id } };
      const options2 = { $pull: { friends: docB._id } };

      const updateRequester = await UserService.updateFriends(
        requesterID,
        options1
      );
      const updateRecipient = await UserService.updateFriends(
        recipientID,
        options2
      );

      return {
        status: 200,
        message: "Đã từ chối yêu cầu kết bạn.",
      };
    } catch (error) {
      return error;
    }
  },
};
