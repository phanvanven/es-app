const express = require('express');
const route = express.Router();
const ChatController = require('../controllers/ChatController');

route.get('/form-chat', ChatController.chatHtml);// test
route.post('/create-group', ChatController.createGroup)
// route.get('/message', ChatController.message);

module.exports = route;