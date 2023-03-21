const express = require('express');
const router = express.Router();
const userRouter = require('./user_router');
const friendRouter = require('./friend_router');
const chatRouter = require('./chat_router');
const {verifyAccessToken} = require('../services/jwt_service');
const {checkWhitelist} = require('../services/redis_service');


router.use('/chat', chatRouter);
router.use('/user', userRouter);
router.use('/friends', friendRouter);
// router.use('/friends', verifyAccessToken, checkWhitelist, friendRouter);

module.exports = router;