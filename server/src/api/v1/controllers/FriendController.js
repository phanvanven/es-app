"use strict";
// Models
const FriendModel = require("../models/FriendModel");

// Services
const FriendService = require("../services/FriendService");
const SocketService = require("../services/socket_service");
const UserService = require('../services/UserService');

// Utils
const validation = require("../helpers/validation");
const createError = require("http-errors");
const statusCode = require("../helpers/StatusCode");

class FriendController {
  async request(req, res, next) {
    try {
      const { requesterID, recipientID } = req.body;
      if (!requesterID || !recipientID) {
        throw createError.BadRequest();
      }

      const info = await FriendService.request({ requesterID, recipientID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      const options = {
        _id: 1,
        fullName: 1,
      }
      const requester = await UserService.getUserById(requesterID, options);
      // Send an announcement to the recipient using SocketIO.
      __IO.to(recipientID).emit('friend request', {
        userID: requester._id.toString(),
        fullName: requester.fullName,
        time: info.time,
        message: 'Đã gửi yêu cầu kết bạn'
      });
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }

  async accept(req, res, next) {
    try {
      const { recipientID, requesterID } = req.body;
      if (!recipientID || !requesterID) {
        throw createError.BadRequest();
      }

      const info = await FriendService.accept({ recipientID, requesterID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      const options = {
        _id: 1,
        fullName: 1,
      }

      const recipient = await UserService.getUserById(recipientID, options);
      // Send an announcement to the recipient using SocketIO.
      __IO.to(requesterID).emit('accept friend request', {
        userID: recipient._id.toString(),
        fullName: recipient.fullName,
        time: info.time,
        message: 'Đã gửi yêu cầu kết bạn'
      });

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const { recipientID, requesterID } = req.body;
      if (!recipientID || !requesterID) {
        throw createError.BadRequest();
      }

      const info = await FriendService.reject({ recipientID, requesterID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FriendController();
