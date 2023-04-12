const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');

router.post('/create', PostController.createPost);
router.delete('/delete', PostController.deletePost);
router.put('/update', PostController.updatePost);
router.put('/like', PostController.likePost);

module.exports = router;