"use strict";
// Models
const FriendModel = require("../models/FriendModel");

// Services
const FriendService = require('../services/FriendService');

// Utils
const { consoleLog } = require("../helpers/console_log");
const validation = require("../helpers/validation");
const createError = require("http-errors");
const statusCode = require("../helpers/StatusCode");

class FriendController {
  async request(req, res, next) {
    try {
      consoleLog("friend request router");
      const { requesterID, recipientID } = req.body;
      if (!requesterID || !recipientID) {
        throw createError.BadRequest();
      }

      const info = await FriendService.request({ requesterID, recipientID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }

  async accept(req, res, next) {
    try {
      consoleLog("friend accept router");
      const { recipientID, requesterID } = req.body;
      if (!recipientID || !requesterID) {
        throw createError.BadRequest();
      }

      const info = await FriendService.accept({ recipientID, requesterID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      consoleLog("friend accept router");
      const { recipientID, requesterID } = req.body;
      if (!recipientID || !requesterID) {
        throw createError.BadRequest();
      }

      const info = await FriendService.accept({ recipientID, requesterID });
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
