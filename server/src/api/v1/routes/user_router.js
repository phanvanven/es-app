const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const {verifyAccessToken} = require('../services/jwt_service');
const {checkWhitelist, checkNumberRequest} = require('../services/redis_service');
const upload = require('../middlewares/uploadMiddleware');

router.get('/login', UserController.getLoginForm);
router.post('/login', UserController.login);
router.post('/register', UserController.register);
router.delete('/logout', UserController.logout);
router.post('/refresh-token', UserController.refreshToken);

// router.get('/friends', verifyAccessToken, checkNumberRequest, checkWhitelist, UserController.getFriends);
// router.get('/verify/:token', UserController.verifyEmail); :token -> req.params.token
router.post('/verify', UserController.verifyEmail);
router.put('/update-information', verifyAccessToken, UserController.updateInformation);

router.put('/change-password', verifyAccessToken, checkWhitelist, UserController.changePassword);
router.post('/forgot-password', checkNumberRequest, UserController.forgotPassword);
router.get('/reset-password/:userID/:token', UserController.verifyPassword);
router.post('/reset-password/:userID/:token', UserController.resetPassword);

router.get('/profile/:profileID', verifyAccessToken, checkNumberRequest, UserController.viewProfile);

// router.post('/profile', upload.single('avatar'), UserController.uploadAvatar);
// router.post('/photos', upload.array('photos', 12), UserController.uploadPhotos);

module.exports = router;