const express = require('express');
const route = express.Router();
const ChatController = require('../controllers/ChatController');

route.get('/form-chat', ChatController.chatHtml);// test
// route.get('/message', ChatController.message);

module.exports = route;