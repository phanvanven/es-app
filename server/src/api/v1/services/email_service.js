const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
require("dotenv").config();

const HOST = process.env.HOST;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URL = process.env.REDIRECT_URL;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const AUTH_EMAIL = process.env.AUTH_EMAIL;
const AUTH_PASS = process.env.AUTH_PASS;

//outh2
const OAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
OAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const sendVerificationEmailOAuth2 = async ({
  email,
  subject,
  token,
}) => {
  try {
    const accessToken = OAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: AUTH_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    let info = await transporter.sendMail({
      from: AUTH_EMAIL,
      to: email,
      subject,
      html: `<p>Xác minh địa chỉ email để hoàn thành việc đăng ký và đăng nhập vào tải khoản Material của bạn.
            <p>Liên kết sẽ hết hạn trong vòng 1 giờ.</p>
            <p>Nhấn vào <a href=${
              HOST + "api/v1/user/verify/" + token
            }>đây</a> để tiếp tục.</p>
            </p>`,
    });
    return info ? true : false;
  } catch (error) {
    console.error(error);
    return error;
  }
};

const sendEmail = async ({ email, subject, html }) => {
  try {
    const accessToken = OAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: AUTH_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    let info = await transporter.sendMail({
      from: AUTH_EMAIL,
      to: email,
      subject,
      html,
    });
    return info ? true : false;
  } catch (error) {
    console.error(error);
    return error;
  }
};

async function sendPasswordResetEmail({ userID, email, token }) {
  try {
    const accessToken = OAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: AUTH_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    let info = await transporter.sendMail({
      from: AUTH_EMAIL,
      to: email,
      subject: "Quên Mật Khẩu",
      html: `
            <p>Bạn đã gửi một yêu cầu để cấp lại mật khẩu mới.</p>
            <p>Nhấn vào liên kết dưới <a href=${
              HOST + "api/v1/user/reset-password/" + userID + "/" + token
            }>đây</a> để đặt lại mật khẩu mới.</p>
            <p>Lưu ý: liên kết sẽ hết hạn trong vòng 2 phút.</p>
            `,
    });
    console.log(`->>> userID: ${userID}\n->>> token: ${token}`);
    return info ? true : false;
  } catch (error) {
    return error;
  }
}

module.exports = {
  sendVerificationEmailOAuth2,
  sendEmail,
  sendPasswordResetEmail,
};
