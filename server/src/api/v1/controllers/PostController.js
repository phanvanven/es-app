"use strict";

const statusCode = require("../helpers/StatusCode");
const { validPost } = require("../helpers/validation");
const createError = require("http-errors");
const UserService = require("../services/UserService");
const PostService = require("../services/PostService");

class PostController {
  async createPost(req, res, next){
    try {

        const {error} = validPost(req.body);
        if(error){
            throw createError(error.details[0].message);
        }

        const {content} = req.body;
        const {userID} = req.payload;
        if(!userID){
            throw createError.Unauthorized();
        }
        const user = await UserService.getUserById(userID);
        if(!user){
            throw createError.NotFound('Account doesn\'t exist');
        }

        const newPost = await PostService.createPost({
            userID: userID,
            content: content,
        });

        if(!newPost){
            throw createError("Có lỗi xảy ra, xin thử lại sau.");
        }

        const pushed = await UserService.pushPostById({
            userID: userID,
            postID: newPost._id
        })

        if(!pushed){
            throw createError("Có lỗi xảy ra, xin thử lại sau.");
        }

        return res.status(200).json({
            status: 200,
            message: "Tạo mới bài đăng thành công!",
            newPost: newPost
        })

    } catch (error) {
        next(error);
    }
  }
  async deletePost(req, res, next){
    try {
        const {postID} = req.body;
        if(!postID){
            throw createError.BadRequest();
        }

        const {userID} = req.payload;
        if(!userID){
            throw createError.Unauthorized();
        }

        const user = await UserService.getUserById(userID);
        if(!user){
            throw createError.NotFound("Có lỗi xảy ra, xin thử lại sau!");
        }


        // const permit = await UserService.deletePostById({
        //     userID: userID,
        //     postID: postID
        // })

        // if(!permit){
        //     throw createError.NotFound("Bạn không được phép chỉnh sửa bài viết này!");
        // }

        // change the status from "active" to "deleted"
        const post = await UserService.getPostById({
            userID: userID,
            postID: postID
        })

        if(!post){
            throw createError.NotFound("Bạn không được phép chỉnh sửa bài viết này");
        }

        const isDel = await PostService.deletePost({
            postID: postID
        })
        if(!isDel){
            throw createError.NotFound("Có lỗi xảy ra, xin thử lại sau!");
        }


        return res.status(200).json({
            status: 200,
            message: "Bài viết đã được xóa thành công.",
        })


    } catch (error) {
        next(error);
    }
  }
  async updatePost(req, res, next){
    try {
        const {postID, content} = req.body;
        if(!postID){
            throw createError.BadRequest();
        }

        const {error} = validPost({content});
        if(error){
            throw createError(error.details[0].message);
        }

        const {userID} = req.payload;
        if(!userID){
            throw createError.Unauthorized();
        }

        const user = await UserService.getUserById(userID);
        if(!user){
            throw createError.NotFound("Có lỗi xảy ra, xin thử lại sau!");
        }

        const post = await UserService.getPostById({
            userID: userID,
            postID: postID
        })

        if(!post){
            throw createError.NotFound("Bạn không được phép chỉnh sửa bài viết này");
        }

        const isUpd = await PostService.updatePost({
            postID: postID,
            content: content,
        })

        if(!isUpd){
            throw createError.NotFound("Có lỗi xảy ra, xin thử lại sau!");
        }

        return res.status(200).json({
            status: 200,
            message: "Bài viết đã được cập nhật thành công.",
        })
    } catch (error) {
        next(error);
    }
  }
  async likePost(req, res, next){
    try {
        const {postID} = req.body;
        if(!postID){
            throw createError.BadRequest();
        }
        const {userID} = req.payload;
        if(!userID){
            throw createError.Unauthorized();
        }

        const user = await UserService.getUserById(userID);
        if(!user){
            throw createError.NotFound('Tài khoản không tồn tại');
        }

        const post = await PostService.likePost({
            userID: userID,
            postID: postID
        })
        if(!post){
            throw createError("Có lỗi xảy ra, xin thử lại sau.");
        }

        return res.status(200).json({
            status: 200,
            message: "Bạn đã thích bài viết này.",
            postID: postID
        })

    } catch (error) {
        next(error);
    }
  }
}

module.exports = new PostController();