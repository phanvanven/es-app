"use strict";
// Models
const MessageModel = require("../models/MessageModel");
// Services
const UserService = require("../services/UserService");
const createError = require("http-errors");
// Utils


module.exports = {
    createMessage: async({senderID, content, repliedID=null}, options=null)=>{
        try {
            const message = new MessageModel({
                sender: senderID,
                content: content,
                replied: repliedID?repliedID:null
            })

            const newMessage = await message.save();
            return newMessage?newMessage:null;

        } catch (error) {
            return error;
        }
    }
}