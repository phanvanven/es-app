"use strict";

// Services
const UserService = require("../services/UserService");
const jwtService = require("../services/jwt_service");
const {
  whitelist,
  expiredlist,
  flaglist,
} = require("../config/connection_redis");
const {
  addTokenToRedisClient,
  removeTokenToRedisClient,
} = require("../services/redis_service");
const emailService = require("../services/email_service");
const ChatService = require("../services/ChatService");
// Utils
const validation = require("../helpers/validation");
const createError = require("http-errors");
const statusCode = require("../helpers/StatusCode");
const capitalizeFirstLetter = require("../helpers/user_format");
const path = require("path");
const Resize = require("../helpers/Resize");

class UserController {
  async getLoginForm(req, res, next) {
    return res.sendFile(__DIRNAME + "/api/v1/public/views/login.html");
  }
  async login(req, res, next) {
    try {
      console.log("login router");
      const { error } = validation.validateUser(req.body);
      if (error) {
        throw createError(error.details[0].message);
      }
      const { email, password } = req.body;
      const info = await UserService.login({
        email,
        password,
      });

      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      
      res.cookie('accessToken', info.accessToken,{
        maxAge: 60*60*24*30,// hết hạn trong 30 ngày
        httpOnly: true,
        // secure: true // chạy local thì comment :))
      })

      res.cookie('refreshToken', info.refreshToken,{
        maxAge: 60*60*24*60,// hết hạn trong 60 ngày
        httpOnly: true,
        // secure: true // chạy local thì comment :))
      })

      // res.cookie('cookies', {
      //   accessToken: info.accessToken,
      //   refreshToken: info.refreshToken,
      // }, {
      //   maxAge: 60 * 60 * 24 * 30, // Hết hạn trong 30 ngày
      //   httpOnly: true,
      // });
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async register(req, res, next) {
    try {
      console.log("register router");
      const { error } = validation.validateRegisterUser(req.body);
      if (error) {
        throw createError.BadRequest(error.details[0].message);
      }
      const { email, password, fullName } = req.body;
      const info = await UserService.register({
        email,
        password,
        fullName,
      });

      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      return res.status(201).json(info);
    } catch (error) {
      next(error);
    }
  }
  async verifyEmail(req, res, next) {
    try {
      console.log("verifyEmail router");
      const { token, email } = req.body;
      if (!token || !email) {
        throw createError.BadRequest();
      }
      const info = await UserService.verifyEmail({ email, token });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      return res.status(200).json(info);

      //   return res.sendFile(path.join(__dirname, "../views/verified.html"));
    } catch (error) {
      next(error);
    }
  }
  async logout(req, res, next) {
    try {
      console.log("logout router");
      if (!req.token) {
        throw createError.Unauthorized();
      }
      const token = req.token;
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw createError.BadRequest();
      }
      const [userID, revoked, added] = await Promise.all([
        jwtService.verifyRefreshToken(refreshToken),
        removeTokenToRedisClient(whitelist, "whitelist", token),
        addTokenToRedisClient(expiredlist, "expiredlist", token),
      ]);

      const deleted = await jwtService.deleteRefreshToken(userID);
      res.json({
        status: 200,
        message: "logged out",
      });
    } catch (error) {
      next(error);
    }
  }
  async updateInformation(req, res, next) {
    // atomic
    try {
      let { profileID, email, fullName, gender, phone, hidePhone } = req.body;
      if (!profileID || !hidePhone) {
        throw createError.BadRequest();
      }
      const { error } = validation.validateUpdateUser({
        fullName,
        phone,
        gender,
      });
      if (error) {
        throw createError(error.details[0].message);
      }
      gender = capitalizeFirstLetter(gender);
      const phoneNumber = {
        number: phone,
        hide: hidePhone,
      };
      const info = await UserService.updateInformation({
        profileID,
        email,
        fullName,
        gender,
        phoneNumber,
      });

      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }
      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async refreshToken(req, res, next) {
    try {
      if (!req.headers["authorization"]) {
        throw createError.Unauthorized();
      }
      const authHeader = req.headers["authorization"];
      const token = authHeader.split(" ")[1];
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw createError.BadRequest("Vui lòng đăng nhập lại");
      }
      const info = await UserService.refreshToken({
        accessToken: token,
        refreshToken,
      });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async forgotPassword(req, res, next) {
    try {
      console.log("forgotPassword router");
      const { error } = validation.validateEmail(req.body);
      if (error) {
        throw createError(error.details[0].message);
      }
      const { email } = req.body;
      const info = await UserService.forgotPassword({ email });

      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async verifyPassword(req, res, next) {
    try {
      console.log("verifyPassword router");
      let { userID, token } = req.params;
      if (!userID || !token) {
        throw createError.BadRequest();
      }

      const info = await UserService.verifyPassword({ userID, token });

      if (!statusCode.isSuccess(info.status)) {
        return createError(info);
      }

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async resetPassword(req, res, next) {
    try {
      console.log("resetPassword router");
      let { userID, token } = req.params;
      const { newPassword, repeatPassword } = req.body;
      console.log(
        `userID: ${userID}\ntoken: ${token}\nnewPassword: ${newPassword}\nrepeatPassword: ${repeatPassword}`
      );
      if (!userID || !token || !newPassword || !repeatPassword) {
        throw createError.BadRequest();
      }
      const { error } = validation.validatePasswordChange(req.body);
      if (error) {
        throw createError(error.details[0].message);
      }

      const info = await UserService.resetPassword({
        userID,
        token,
        newPassword,
        repeatPassword,
      });

      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async changePassword(req, res, next) {
    try {
      console.log("changePassword router");
      const { profileID, password, newPassword, repeatPassword } = req.body;
      // use profileID or verify token to get _id
      if (!profileID || !password || !newPassword || !repeatPassword) {
        throw createError.BadRequest();
      }

      const { error } = validation.validatePasswordChange({
        newPassword,
        repeatPassword,
      });

      if (error) {
        throw createError(error.details[0].message);
      }

      const info = await UserService.changePassword({
        profileID,
        password,
        newPassword,
      });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async viewProfile(req, res, next) {
    try {
      console.log("getProfile router");
      const { profileID } = req.params;
      if (!profileID) {
        throw createError.BadRequest();
      }

      const info = await UserService.viewProfile({ profileID });
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      return res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  }
  async uploadAvatar(req, res, next) {
    try {
      const imagePath = path.join(__DIRNAME, "/public/images");
      const fileUpload = new Resize(imagePath);
      if (!req.file) {
        throw createError('Please provide an image');
        res.status(401).json({ error: "Please provide an image" });
      }
      const filename = await fileUpload.save(req.file.buffer);
      return res.status(200).json({ status: 200, message: 'Server sends an image', name: filename });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new UserController();
