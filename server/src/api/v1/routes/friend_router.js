const express = require('express');
const router = express.Router();
const FriendController = require('../controllers/FriendController');
const {checkNumberRequest} = require('../services/redis_service');

router.post('/request', FriendController.request);
router.post('/accept', FriendController.accept);
router.post('/reject', FriendController.reject);
router.get('/list', FriendController.getFriendsList);
router.get('/requests', FriendController.getRequestList);
router.get('/pending', FriendController.getPendingList);

module.exports = router;