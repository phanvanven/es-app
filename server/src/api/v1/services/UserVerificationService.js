"use strict";
// Models
const UserVerificationModel = require("../models/UserVerificationModel");
// Services
const bcrypt = require("bcrypt");
const createError = require("http-errors");

// Utils
module.exports = {
  insertUserVerification: async ({ token, email, password, fullName }) => {
    try {
      const userVerification = new UserVerificationModel({
        email,
        password,
        fullName,
        token,
      });
      const newUser = await userVerification.save();
      return newUser ? true : false;
    } catch (error) {
      console.log(error);
    }
  },
  verifyUserVerification: async ({ email, token }) => {
    try {
      const userHolder = await UserVerificationModel.find({
        email,
      });

      if (!userHolder.length) {
        return createError.NotFound("Expired token!");
      }
      const lastUser = userHolder[userHolder.length - 1];
      const isValid = await lastUser.isCheckToken(token);
      if (!isValid) {
        return createError.Unauthorized("Invalid token!");
      }
      return {
        status: 200,
        message: "Valid Token!",
        data: lastUser
      };
    } catch (error) {
      console.log(error);
    }
  },
  deleteManyUserVerification: async ({ email }) => {
    try {
      const isDeleted = await UserVerificationModel.deleteMany({
        email,
      });
      return isDeleted ? true : false;
    } catch (error) {
      console.log(error);
    }
  },
};
