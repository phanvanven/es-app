const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { client, whitelist, flaglist, expiredlist } = require('../config/connection_redis');
const { checkTokenToRedisClient, addTokenToRedisClient, removeTokenToRedisClient } = require('../services/redis_service');
const { sendEmail } = require('../services/email_service');
const UserModel = require('../models/UserModel');

async function signToken(payload, secret, options) {
    return new Promise((resolve, reject)=>{
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                return reject(err);
            }
            return resolve(token);
        })
    })
}

async function verifyToken(token, secret) {
    return new Promise((resolve, reject)=>{
        jwt.verify(token, secret, (err, payload)=>{
            if(err){
                if(err.name === 'JsonWebTokenError'){
                    return reject(err);
                }

                return reject(createError.BadRequest('Liên kết của bạn đã hết hạn'))
            }
            return resolve(payload);
        })
    })
}

async function signAccessToken(userID) {
    return new Promise((resolve, reject) => {
        const payload = {
            userID,
        }
        const secret = process.env.ACCESS_TOKEN_SECRET;
        const options = {
            expiresIn: '30d'// 1y 1m 1s
        }
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                return reject(err);
            }
            whitelist.sadd('whitelist', token, (err, result) => {
                if (err) {
                    return reject(createError.InternalServerError());
                }
                resolve(token);
            })
        })
    })
}

// a middleware
const verifyAccessToken = (req, res, next) => {
    let token = '';
    if (!req.headers['authorization']) {
        token = req.cookies.accessToken;
        if(!token){
            return next(createError.Unauthorized());
        }
    }else{
        const authHeader = req.headers['authorization'];
        token = authHeader.split(' ')[1];
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
        try {
            // terminate and return data back to app.use. which outputs the error
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    return next(createError.Unauthorized());
                }
                // If the token has expired. Checking if the token is in the expiredlist.
                const suspect = await checkTokenToRedisClient(expiredlist, 'expiredlist', token);
                if (suspect === -1) {
                    return next(createError.InternalServerError('An error occured.'));
                }

                // Suspected user's token is stolen
                if (suspect) {
                    // logout and send email to user
                    const {userID} = await verifyInternalAccessToken(token);
                    // automatic logout and flag users
                    const email = await UserModel.findById(userID, 'email');
                    const [removed, deleted, flagged, emailed] = await Promise.all([
                        removeTokenToRedisClient(expiredlist, 'expiredlist', token),
                        deleteRefreshToken(userID),
                        addTokenToRedisClient(flaglist, 'flaglist', userID),
                        sendEmail({
                            email, // this email is taken from token when verified, we can take the email in db using userID
                            subject: 'Cảnh Báo Bảo Mật',
                            html:
                                `<p>Tài khoản của bạn gần đây đang có những hoạt động bất thường, chúng tôi nghi ngờ tài khoản của bạn đã bị đánh cắp.
                    <p>Vui lòng đăng nhập lại và thay đổi mật khẩu mạnh hơn.</p>`
                        })
                    ])
                    return next(createError.Unauthorized('Tài khoản của bạn gần đây có những hoạt động bất thường'));
                }
                return next(createError.Unauthorized('Vui lòng đăng nhập'));
            }

            const flag = await checkTokenToRedisClient(flaglist, 'flaglist', payload.userID);
            if (flag === -1) {
                return next(createError.InternalServerError());
            }
            //real user but flagged user -> revoke token => remove token in whitelist
            if (flag === 1) {
                const [revoked, removeFlag] = await Promise.all([
                    removeTokenToRedisClient(whitelist, 'whitelist', token),
                    removeTokenToRedisClient(flaglist, 'flaglist', payload.userID),
                ])
                return next(createError.Unauthorized('Người dùng đã bị gắn cờ'));
            }

            req.payload = payload;
            next();// next to check Whitelist

        } catch (error) {
            return next(error)
        }

    })
}
async function signRefreshToken(userID) {
    return new Promise((resolve, reject) => {
        const payload = {
            userID
        }
        const secret = process.env.REFRESH_TOKEN_SECRET;
        const options = {
            expiresIn: '1y'// 1h 1s
        }
        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                return reject(err);
            }
            client.set(userID.toString(), token, 'EX', 360 * 24 * 60 * 60, (err, reply) => {
                if (err) {
                    return reject(createError.InternalServerError());
                }
                resolve(token);
            })
        })
    })

}

async function verifyInternalAccessToken(accessToken) {
    return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, { ignoreExpiration: true });
}

async function verifyRefreshToken(refreshToken) {
    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
            if (err) {
                return reject(err);
            }
            client.get(payload.userID, (err, reply) => {
                if (err) {
                    return reject(createError.InternalServerError());
                }

                if (refreshToken === reply) {
                    return resolve(payload);// having userID
                }

                return reject(createError.Unauthorized());
            })
        })
    });
}

async function deleteRefreshToken(userID) {
    return new Promise((resolve, reject) => {
        client.del(userID, (err, reply) => {
            if (err) {
                return reject(createError.InternalServerError());
            }
            resolve(reply);
        })
    })
}


module.exports = {
    signAccessToken,
    verifyAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    deleteRefreshToken,
    verifyInternalAccessToken,
    signToken,
    verifyToken
}