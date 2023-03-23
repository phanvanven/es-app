"use strict";
// Models
const UserModel = require("../models/UserModel");

// Services
const createError = require("http-errors");
const jwtService = require("./jwt_service");
const emailService = require("./email_service");
const UserVerificationService = require("./UserVerificationService");
const { v4: uuidv4 } = require("uuid");
const {
  addTokenToRedisClient,
  removeTokenToRedisClient,
} = require("../services/redis_service");
const {
  whitelist,
  expiredlist,
  flaglist,
} = require("../config/connection_redis");
// Utils
const createProfileID = require("../helpers/generate_profileID");
const statusCode = require("../helpers/StatusCode");
module.exports = {
  login: async ({ email, password }) => {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return createError.NotFound("Tài khoản chưa được đăng ký.");
      }

      const isValid = await user.isCheckPassword(password);
      if (!isValid) {
        return createError.Unauthorized(
          "Thông tin tài khoản hoặc mật khẩu không chính xác."
        );
      }

      const [accessToken, refreshToken] = await Promise.all([
        jwtService.signAccessToken(user._id),
        jwtService.signRefreshToken(user._id),
      ]);
      console.log(
        `->>> accessToken: ${accessToken}\n->>> refreshToken: ${refreshToken}`
      );
      return {
        status: 200,
        message: "Đăng nhập thành công",
      };
    } catch (error) {
      console.log(error);
    }
  },
  register: async ({ email, password, fullName }) => {
    try {
      const isExists = await UserModel.findOne({ email });
      if (isExists) {
        return createError.NotFound(
          "Email này đã được đăng ký. Xin kiểm tra lại."
        );
      }
      const token = uuidv4() + password;
      const isInserted = await UserVerificationService.insertUserVerification({
        token,
        email,
        password,
        fullName,
      });

      console.log(`->>> token: ${token}`);

      if (!isInserted) {
        return createError.InternalServerError();
      }

      const isSent = await emailService.sendVerificationEmailOAuth2({
        email,
        subject: "Verify Your Email",
        token,
      });

      if (!isSent) {
        return createError.InternalServerError();
      }
      return {
        status: 201,
        message: "Tạo tài khoản thành công. Vui lòng kiểm tra hộp thư email.",
      };
    } catch (error) {
      console.log(error);
    }
  },
  verifyEmail: async ({ email, token }) => {
    try {
      console.log("verifyEmail Service");
      const info = await UserVerificationService.verifyUserVerification({
        email,
        token,
      });
      if (!statusCode.isSuccess(info.status)) {
        return info;
      }
      const { password, fullName } = info.data;
      const profileID = createProfileID();
      console.log(`->>> profileID: ${profileID}`);
      const User = new UserModel({
        profileID,
        email,
        password,
        fullName,
      });
      const newUser = await User.save();
      if (!newUser) {
        return createError.InternalServerError();
      }

      await UserVerificationService.deleteManyUserVerification({ email });

      return {
        status: 200,
        message:
          "Xác thực email thành công, Vui lòng quay lại trang đăng nhập.",
      };
    } catch (error) {
      console.log(error);
    }
  },
  updateInformation: async ({
    profileID,
    email,
    fullName,
    gender,
    phoneNumber,
  }) => {
    const user = await UserModel.findOneAndUpdate(
      {
        $and: [{ profileID }, { email }],
      },
      {
        fullName,
        gender,
        "phoneNumber.number": phoneNumber.number,
        "phoneNumber.hide": phoneNumber.hide,
        // address
        // dateOfBirth
        // avatar
        // coverImage
        // biography
        // hobby
        // job
      },
      {
        //! upsert: true, if matching document is not found, Mongoose will insert a new document
        //! - with the specified update values.
        new: true, // return updated data, false for an old data
        runValidators: true, // Mongoose will validate the document before saving it to the database.
        // - based on the validation rules specified in the schema
      }
    );
    if (!user) {
      return createError.Unauthorized();
    }

    return {
      status: 200,
      message: "Cập nhật tài khoản thành công",
    };
  },
  refreshToken: async ({ accessToken, refreshToken }) => {
    try {
      const [payloadOfRefreshToken, payloadOfAccessToken] = await Promise.all([
        jwtService.verifyRefreshToken(refreshToken),
        jwtService.verifyInternalAccessToken(accessToken),
      ]);

      const userIdOfAccessToken = payloadOfAccessToken.userID;
      const userIdOfRefreshToken = payloadOfRefreshToken.userID;

      console.log(
        `->>> accessToken: ${userIdOfAccessToken}\n->>> refreshToken: ${userIdOfRefreshToken}`
      );

      if (userIdOfRefreshToken !== userIdOfAccessToken) {
        const [emailOfRefreshToken, emailOfAccessToken] = await Promise.all([
          UserModel.findById(userIdOfRefreshToken, "email"),
          UserModel.findById(userIdOfAccessToken, "email"),
        ]);
        // automatic logout and flag users
        await Promise.all([
          jwtService.deleteRefreshToken(userIdOfRefreshToken),
          jwtService.deleteRefreshToken(userIdOfAccessToken),
          removeTokenToRedisClient(whitelist, "whitelist", token),
          addTokenToRedisClient(flaglist, "flaglist", userIdOfRefreshToken),
          emailService.sendEmail({
            email: emailOfRefreshToken,
            subject: "Cảnh Báo Bảo Mật Nghiêm Trọng",
            html: `<p>Tài khoản của bạn gần đây đang có những hoạt động bất thường, chúng tôi nghi ngờ tài khoản của bạn đã bị đánh cắp.
                <p>Vui lòng thay đổi mật khẩu mạnh hơ nvà đăng nhập lại.</p>`,
          }),
          emailService.sendEmail({
            email: emailOfAccessToken,
            subject: "Cảnh Báo Bảo Mật Nghiêm Trọng",
            html: `<p>Tài khoản của bạn gần đây đang có những hoạt động bất thường, chúng tôi nghi ngờ tài khoản của bạn đã bị đánh cắp.
                <p>Vui lòng thay đổi mật khẩu mạnh hơ nvà đăng nhập lại.</p>`,
          }),
        ]);
        return createError.Unauthorized("Cảnh báo nghiêm trọng");
      }

      const [newAccessToken, newRefreshToken, added, removed] =
        await Promise.all([
          jwtService.signAccessToken(userIdOfRefreshToken),
          jwtService.signRefreshToken(userIdOfRefreshToken),
          addTokenToRedisClient(expiredlist, "expiredlist", accessToken),
          removeTokenToRedisClient(whitelist, "whitelist", accessToken),
        ]);

      await addTokenToRedisClient(whitelist, "whitelist", newAccessToken);

      console.log(
        `->>> accessToken: ${newAccessToken}\n->>> refreshToken: ${newRefreshToken}`
      );

      return {
        status: 201,
        message: "refreshToken successfully!",
      };
    } catch (error) {
      console.log(error);
    }
  },
  forgotPassword: async ({ email }) => {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return createError.NotFound("Invalid Email/User not registered");
      }

      // sent email to user
      const { _id, password } = user;
      const secret = process.env.JWT_SECRET + password;
      const payload = {
        userID: _id,
        email,
      };
      const options = {
        expiresIn: "15m", // test
      };
      const token = await jwtService.signToken(payload, secret, options);
      const success = await emailService.sendPasswordResetEmail({
        userID: _id,
        email,
        token,
      });

      if (!success) {
        return createError.InternalServerError();
      }

      return {
        status: 200,
        message: "Vui lòng kiểm tra hộp thư của bạn",
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  verifyPassword: async ({ userID, token }) => {
    try {
      const user = await UserModel.findById(userID);
      if (!user) {
        return createError.NotFound(
          "Tài khoản không tồn tại, Vui lòng đăng ký hoặc đăng nhập."
        );
      }

      if (userID !== user._id.toString()) {
        return createError.BadRequest("Id không hợp lệ.");
      }

      const secret = process.env.JWT_SECRET + user.password;
      const payload = await jwtService.verifyToken(token, secret);

      return {
        status: 200,
        message: "Xác thực thành công, vui lòng tạo mật khẩu mới",
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  resetPassword: async ({ userID, token, newPassword, repeatPassword }) => {
    try {
      const user = await UserModel.findById(userID);
      if (!user) {
        return createError.NotFound(
          "Yêu cầu bị từ chối, người dùng không hợp lệ!"
        );
      }

      const secret = process.env.JWT_SECRET + user.password;
      const payload = await jwtService.verifyToken(token, secret);
      if (userID !== payload.userID) {
        return createError.BadRequest(
          "Yêu cầu bị từ chối, người dùng không hợp lệ!"
        );
      }

      const updated = await UserModel.findOneAndUpdate(
        { userID },
        {
          password: newPassword,
        },
        { runValidators: true, new: true }
      );

      return {
        status: 200,
        message: "Cập nhật mật khẩu mới thành công.",
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  changePassword: async ({ profileID, password, newPassword }) => {
    try {
      const user = await UserModel.findOne({ profileID });
      if (!user) {
        return createError.BadRequest("Tài khoản không hợp lệ.");
      }

      const isValid = await user.isCheckPassword(password);
      if (!isValid) {
        return createError.Unauthorized("Mật khẩu không chính xác.");
      }

      const updatedUser = await UserModel.findOneAndUpdate(
        { profileID },
        {
          password: newPassword,
        },
        { runValidators: true, new: true }
      );

      return {
        status: 200,
        message: "Cập nhật mật khẩu thành công",
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  viewProfile: async ({ profileID }) => {
    try {
      const options = {
        _id: 0,
        isAdmin: 0,
        __v: 0,
        verified: 0,
        password: 0,
      };
      const user = await UserModel.findOne({ profileID }, options);
      if (!user) {
        return createError.NotFound(
          "Không tìm thấy thông tin người dùng tương ứng. Xin kiểm tra lại!"
        );
      }

      return {
        status: 200,
        message: "Thông tin tài khoản người dùng",
        user,
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  updateFriendsById: async (_id, options) => {
    try {
      const isUpdated = await UserModel.findByIdAndUpdate(_id, options);
      return isUpdated;
    } catch (error) {
      return error;
    }
  },
  getUserById: async (userID, standard = false, options = null) => {
    try {
      if (standard && options) {
        return await UserModel.findById(userID, options);
      }
      const standardOptions = {
        _id: 0,
        isAdmin: 0,
        __v: 0,
        verified: 0,
        password: 0,
      };
      return await UserModel.findById(userID, standardOptions);
    } catch (error) {
      return error;
    }
  },
  getFriendsList: async (userID, status) => {
    try {
      if (status < 1 || status > 3) {
        return createError(`${status} Invalid`);
      }
      const selections1 = "-_id status";
      const selections2 = "fullName profileID";
      const friendList = await UserModel.findOne({ $or: [{_id: userID}, {profileID: userID}]}).populate({
        path: "friends",
        match: { status: { $eq: status } },
        select: selections1,
        populate: {
          path: "recipient",// if we used the second structure then this path will be userID
          // match: {recipient: {$not: {$eq: profileID}}},This parameter is not needed in this case just keep in mind 'not equal' in mongoose
          select: selections2,
        },
      }).select(selections2);
      return {
        status: 200,
        message: "Danh sách bạn bè",
        friendList,
      };
    } catch (error) {
      return error;
    }
  },
};
