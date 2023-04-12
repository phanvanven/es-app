"use strict";
// Models
const PostModel = require("../models/PostModel");
// Services
const bcrypt = require("bcrypt");
const createError = require("http-errors");

// Utils
module.exports = {
  createPost: async ({ userID, content}) => {
    try {
        const post = new PostModel({
            author: userID,
            content: content,
            status: "active"
        })

        const newPost = await post.save();
        if(!newPost){
            throw createError();
        }

        return newPost?newPost:null;

    } catch (error) {
      return error;
    }
  },
  deletePost: async({postID})=>{
    try {
      const isDel = await PostModel.findByIdAndUpdate(postID,{
        $set: {
          status: "deleted"
        }
      }, {
        new: true
      })

      return isDel.status === "deleted"?true:false;
    } catch (error) {
      return error;
    }
  },
  updatePost: async({postID, content})=>{
    try {
      const isUpd = await PostModel.findOneAndUpdate({
        _id: postID,
        status: "active"
      },{
        $set:{
          content: content
        }
      })

      return isUpd?true:false;
    } catch (error) {
      return error;
    }
  },
  likePost: async({userID, postID})=>{
    try {
      const post = await PostModel.findOneAndUpdate({
        _id: postID
      },{
        $addToSet:{
          likes: userID
        },
        $inc:{
          total_likes: 1
        }
      },{
        new: true,
        upsert: true,
      })

      return post?post:null;
    } catch (error) {
      return error;
    }
  },
  pushCommentsToPosts: async({userID, postID})=>{
    try {
      const post = await PostModel.findOneAndUpdate({
        _id: postID
      },{
        $addToSet:{
          likes: userID
        }
      },{
        new: true
      })

      return post?true:false;
    } catch (error) {
      return error;
    }
  }
};
