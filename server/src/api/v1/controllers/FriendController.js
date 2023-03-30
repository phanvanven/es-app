"use strict";

// Services
const FriendService = require("../services/FriendService");
const UserService = require("../services/UserService");

// Utils
const validation = require("../helpers/validation");
const createError = require("http-errors");
const statusCode = require("../helpers/StatusCode");

class FriendController {
  async request(req, res, next) {
    try {
      const requesterID = req.payload.userID;
      const { recipientID } = req.body;
      if (!requesterID || !recipientID) {
        throw createError.BadRequest();
      }
      if (requesterID === recipientID) {
        throw createError.BadRequest(
          "Bạn không thể tự kết bạn với chính mình được :)))"
        );
      }
      const error1 = validation.validateUserID({ userID: requesterID });
      const error2 = validation.validateUserID({ userID: recipientID });
      if (error1.error) {
        throw createError(error1.error.details[0].message);
      }
      if (error2.error) {
        throw createError(error2.error.details[0].message);
      }

      const info = await FriendService.request({ requesterID, recipientID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      const options = {
        _id: 1,
        fullName: 1,
      };
      const requester = await UserService.getUserById(
        requesterID,
        true,
        options
      );
      // Send an announcement to the recipient using SocketIO.
      __IO.to(recipientID).emit("friend request", {
        userID: requester._id.toString(),
        fullName: requester.fullName,
        time: info.time,
        message: "Đã gửi lời mời kết bạn",
      });
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async accept(req, res, next) {
    try {
      const { requesterID } = req.body;
      const recipientID = req.payload.userID;
      if (!recipientID || !requesterID) {
        throw createError.BadRequest();
      }

      const error1 = validation.validateUserID({ userID: requesterID });
      const error2 = validation.validateUserID({ userID: recipientID });
      if (error1.error) {
        throw createError(error1.error.details[0].message);
      }
      if (error2.error) {
        throw createError(error2.error.details[0].message);
      }

      const info = await FriendService.accept({ recipientID, requesterID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      const options = {
        _id: 1,
        fullName: 1,
      };

      const recipient = await UserService.getUserById(
        recipientID,
        true,
        options
      );
      // Send an announcement to the recipient using SocketIO.
      __IO.to(requesterID).emit("accept friend request", {
        userID: recipient._id.toString(),
        fullName: recipient.fullName,
        time: info.time,
        message: "Đã chấp nhận lời mời kết bạn ",
      });

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async reject(req, res, next) {
    try {
      const { requesterID } = req.body;
      const recipientID = req.payload.userID;
      if (!recipientID || !requesterID) {
        throw createError.BadRequest();
      }

      const error1 = validation.validateUserID({ userID: requesterID });
      const error2 = validation.validateUserID({ userID: recipientID });
      if (error1.error) {
        throw createError(error1.error.details[0].message);
      }
      if (error2.error) {
        throw createError(error2.error.details[0].message);
      }

      const info = await FriendService.reject({ recipientID, requesterID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      const options = {
        _id: 1,
        fullName: 1,
      };

      const recipient = await UserService.getUserById(
        recipientID,
        true,
        options
      );
      // Send an announcement to the recipient using SocketIO.
      __IO.to(requesterID).emit("reject friend request", {
        userID: recipient._id.toString(),
        fullName: recipient.fullName,
        time: info.time,
        message: "Đã từ chối lời mời kết bạn ",
      });

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async getFriendsList(req, res, next) {
    try {
      const { userID } = req.payload; // received from the middleware verfifyAccessToken

      if (!userID) {
        throw createError.BadRequest();
      }

      const data = await UserService.getFriendsList(userID, 3); // 0: add friend, 1: requested, 2: pending, 3: friend
      if (!statusCode.isSuccess(data.status)) {
        throw createError(data);
      }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getRequestList(req, res, next) {
    try {
      const { userID } = req.payload;

      if (!userID) {
        throw createError.BadRequest();
      }

      const data = await UserService.getFriendsList(userID, 2); // 0: add friend, 1: requested, 2: pending, 3: friend
      if (!statusCode.isSuccess(data.status)) {
        throw createError(data);
      }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getPendingList(req, res, next) {
    try {
      const { userID } = req.payload;

      if (!userID) {
        throw createError.BadRequest();
      }

      const data = await UserService.getFriendsList(userID, 1); // 0: add friend, 1: requested, 2: pending, 3: friend
      if (!statusCode.isSuccess(data.status)) {
        throw createError(data);
      }
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FriendController();
