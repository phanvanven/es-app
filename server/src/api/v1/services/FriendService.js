"use strict";
// Models
const FriendModel = require('../models/FriendModel');
// Services
const createError = require("http-errors");
const UserService = require('../services/UserService');
const {consoleLog} = require('../helpers/console_log');

// Utils

module.exports = {
    request: async({requesterID, recipientID})=>{
        try {
            const [requester, recipient] = await Promise.all([
                UserService.isExist(requesterID),
                UserService.isExist(recipientID),
            ])
            
            if(!requester || !recipient){
                return createError.NotFound("Không tìm thấy thông tin người dùng tương ứng. Xin kiểm tra lại!");
            }

            // If the document does not exist, findOneAndUpdate in MongoDB will automatically generate a new document
            /*
            Lets say we have two users UserA and UserB... So when UserA requestes UserB to be a friends at that time 
            we make two documents so that UserA can see requested and UserB can see pending 
            and at the same time we push the _id of these documents in user's friends
            */
            const docA = await FriendModel.findOneAndUpdate(
                { requester: requesterID, recipient: recipientID},
                { $set: { status: 1 }},
                { upsert: true, new: true }
            )

            const docB = await FriendModel.findOneAndUpdate(
                { recipient: requesterID, requester: recipientID },
                { $set: { status: 2 }},
                { upsert: true, new: true }
            )
            
            const options1 = { $push: { friends: docA._id } };
            const options2 = { $push: { friends: docB._id } };

            
            const updateRequester = await UserService.updateFriends(requesterID, options1);
            const updateRecipient = await UserService.updateFriends(recipientID, options2);
            
            return {
                status: 200,
                message: 'Gửi yêu cầu kết bạn thành công.'
            }
        } catch (error) {
            return error;
        }
    },
    accept: async({recipientID, requesterID})=>{
        try {
            await FriendModel.findOneAndUpdate(
                { requester: recipientID, recipient: requesterID },
                { $set: { status: 3 }}
            )
            await FriendModel.findOneAndUpdate(
                { recipient: recipientID, requester: requesterID },
                { $set: { status: 3 }}
            )
            return {
                status: 200,
                message: 'Đã chấp nhận yêu cầu kết bạn'
            }

        } catch (error) {
            return error;
        }
    },
    reject: async({recipientID, requesterID})=>{
        try {
            await FriendModel.findOneAndUpdate(
                { requester: recipientID, recipient: requesterID },
                { $set: { status: 3 }}
            )
            await FriendModel.findOneAndUpdate(
                { recipient: recipientID, requester: requesterID },
                { $set: { status: 3 }}
            )
            return {
                status: 200,
                message: 'Đã chấp nhận yêu cầu kết bạn'
            }

        } catch (error) {
            return error;
        }
    },
}