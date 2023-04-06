"use strict";

const ChatService = require("../services/ChatService");
const UserService = require("../services/UserService");

const statusCode = require("../helpers/StatusCode");
const { validateGroupPassword } = require("../helpers/validation");
const createError = require("http-errors");

class ChatController {
  chatHtml(req, res, next) {
    return res.sendFile(__DIRNAME + "/api/v1/public/views/chat.html");
  }

  async createGroup(req, res, next) {
    try {
        const requesterID = req.payload.userID;
        const { groupName, password, members } = req.body;
      if (!requesterID || !groupName) {
        throw createError.BadRequest();
      }

      const requester = await UserService.getUserById(requesterID);

      if (!requester) {
        throw createError.NotFound();
      }

      if (password) {
        const { error } = validateGroupPassword({ password });
        if (error) {
          throw createError(error.details[0].message);
        }
      }

      const info = await ChatService.createGroup({
        userID: requesterID,
        groupName: groupName,
        password: password ? password : null,
      });
      
      if (!statusCode.isSuccess(info.status)) {
        throw createError(info);
      }

      if (members && members.length) {
        for (const memberID of members) {
          await ChatService.addMemberToGroup(info.group, memberID);
        }
      }

      return res.status(200).json(info);

      // Kết quả của câu truy vấn này sẽ là một mảng rỗng, vì hàm forEach không trả về giá trị nào sau khi thực thi,
      // và việc sử dụng async/await trong hàm forEach là không hợp lệ.
      //   const newMembers = members.forEach(async (memberID) => {
      //     const member = await UserService.getUserById(memberID);
      //     if (member) {
      //       return memberID;
      //     }
      //   });

      //   const newMembers = [];
      //   for (const memberID of members) {
      //     const member = await UserService.getUserById(memberID);
      //     if (member) {
      //       newMembers.push(memberID);
      //     }
      //   }
      // C2
      //   const promises = members.map((memberID) =>
      //     UserService.getUserById(memberID)
      //   );
      //   const resolvedMembers = await Promise.all(promises);
      //   const validMembers = resolvedMembers
      //     .filter((member) => member !== null)
      //     .map((member) => member.id);
      
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();