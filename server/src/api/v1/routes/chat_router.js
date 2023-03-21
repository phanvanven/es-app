const express = require('express');
const route = express.Router();
const ChatController = require('../controllers/ChatController');

route.get('/', ChatController.chat);
route.get('/message', ChatController.message);

module.exports = route;