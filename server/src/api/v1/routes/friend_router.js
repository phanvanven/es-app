const express = require('express');
const router = express.Router();
const FriendController = require('../controllers/FriendController');
const {checkNumberRequest} = require('../services/redis_service');

router.post('/request', FriendController.request);
router.post('/accept', FriendController.accept);
router.post('/reject', FriendController.reject);

module.exports = router;