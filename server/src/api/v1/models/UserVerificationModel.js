const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const UserVerificationSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
    },
    fullName:{
        type: String,
        maxLength: 200,
        required: true
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    createAt:{
        type: Date,
        default: Date.now,
        index:{
            expires: 10*60// 10m
        }
    }
},{
    collection: 'userverifications',
})

UserVerificationSchema.pre('save', async function(next){
    try {
        if(this.token){
            const salt = await bcrypt.genSalt(10);
            const hashedToken = await bcrypt.hash(this.token, salt);
            this.token = hashedToken;
        }else{
            console.log('->>> No token, next middleware is called');
        }
        next();
    } catch (error) {
        next(error.message);
    }
});

UserVerificationSchema.methods.isCheckToken = async function(token){
    try {
        return await bcrypt.compare(token, this.token);
    } catch (error) {
        console.log(error)
    }
}

const UserVerificationModel = mongoose.model('userverifications', UserVerificationSchema);
module.exports = UserVerificationModel;