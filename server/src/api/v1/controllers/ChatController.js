"use strict";

const ChatService = require('../services/ChatService');

class ChatController{
    chatHtml(req, res, next){
        return res.sendFile(__DIRNAME + '/api/v1/public/views/chat.html'); 
    }
}

module.exports = new ChatController();