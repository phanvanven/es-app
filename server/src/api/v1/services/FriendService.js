"use strict";
// Models
const FriendModel = require("../models/FriendModel");
// Services
const createError = require("http-errors");
const UserService = require("../services/UserService");
const ChatService = require("./ChatService");

// Utils

module.exports = {
  request: async ({ requesterID, recipientID }) => {
    try {
      const [requester, recipient] = await Promise.all([
        UserService.getUserById(requesterID),
        UserService.getUserById(recipientID),
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
        { upsert: true, new: true }// https://www.mongodb.com/docs/manual/reference/method/db.collection.update/#std-label-update-upsert
      );

      const docB = await FriendModel.findOneAndUpdate(
        { recipient: requesterID, requester: recipientID },
        { $set: { status: 2 } },
        { upsert: true, new: true }
      );

      const options1 = { $addToSet: { friends: docA._id } };// $addToSet: https://www.mongodb.com/docs/v6.0/reference/operator/update/addToSet/
      const options2 = { $addToSet: { friends: docB._id } };

      const updatedRequester = await UserService.updateFriendsById(
        requesterID,
        options1
      );
      const updatedRecipient = await UserService.updateFriendsById(
        recipientID,
        options2
      );

      return {
        status: 200,
        message: "Gửi yêu cầu kết bạn thành công.",
        time: docA.updatedAt,
      };
    } catch (error) {
      return error;
    }
  },
  accept: async ({ recipientID, requesterID }) => {
    try {
      const [requester, recipient] = await Promise.all([
        UserService.getUserById(requesterID),
        UserService.getUserById(recipientID),
      ]);
      if (!requester || !recipient) {
        return createError.NotFound(
          "Không tìm thấy thông tin người dùng tương ứng. Xin kiểm tra lại!"
        );
      }

      const docA = await FriendModel.findOneAndUpdate(
        { requester: requesterID, recipient: recipientID, status: 1 },
        { $set: { status: 3 } },
        { new: true }
      );

      const docB = await FriendModel.findOneAndUpdate(
        { recipient: requesterID, requester: recipientID, status: 2 },
        { $set: { status: 3 } },
        { new: true }
      );

      if(!docA || !docB){
        return createError('Yêu cầu không hợp lệ. Vui lòng kiểm tra lại!');
      }

      return {
        status: 200,
        message: "Đã chấp nhận yêu cầu kết bạn",
        time: docA.updatedAt,
      };
    } catch (error) {
      return error;
    }
  },
  reject: async ({ recipientID, requesterID }) => {
    try {
      const [requester, recipient] = await Promise.all([
        UserService.getUserById(requesterID),
        UserService.getUserById(recipientID),
      ]);
      if (!requester || !recipient) {
        return createError.NotFound(
          "Không tìm thấy thông tin người dùng tương ứng. Xin kiểm tra lại!"
        );
      }
      const docA = await FriendModel.findOneAndUpdate(
        { requester: requesterID, recipient: recipientID, status: 1 },
        { $set: { status: 0 } },
        { new: true }
      );

      const docB = await FriendModel.findOneAndUpdate(
        { recipient: requesterID, requester: recipientID, status: 2 },
        { $set: { status: 0 } },
        { new: true }
      );

      if(!docA || !docB){
        return createError('Yêu cầu không hợp lệ. Vui lòng kiểm tra lại!');
      }

      const options1 = { $pull: { friends: docA._id } };
      const options2 = { $pull: { friends: docB._id } };

      const updatedRequester = await UserService.updateFriendsById(
        requesterID,
        options1
      );
      const updatedRecipient = await UserService.updateFriendsById(
        recipientID,
        options2
      );

      return {
        status: 200,
        message: "Đã từ chối yêu cầu kết bạn.",
        time: docA.updatedAt
      };
    } catch (error) {
      return error;
    }
  },
};
