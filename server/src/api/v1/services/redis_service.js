const { client, whitelist, expiredlist, flaglist, clientRequests } = require('../config/connection_redis');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');

// Middleware to check if token is in whitelist
const checkWhitelist = (req, res, next) => {
    if (!req.headers['authorization']) {
        return next(createError.Unauthorized());
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1];
    whitelist.sismember("whitelist", token, (err, result) => {
        if (err) {
            return next(createError.InternalServerError('An error occurred.'));
        }
        if (result === 1) {
            return next();
        }
        return next(createError.Unauthorized());
        // return res.status(401).send("Unauthorized.");

    });
}
async function removeExpiredToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) {
                if (err.name === 'JsonWebTokenError') {
                    whitelist.sismember('whitelist', token, (err, reply) => {
                        if (err) {
                            return reject(createError.InternalServerError('An error occurred.'));
                        }
                        if (reply === 1) {
                            whitelist.srem('whitelist', token, (err, reply) => {
                                if (err) {
                                    return reject(createError.InternalServerError('An error occurred.'));
                                }
                                return resolve(reply);
                            })
                        }
                    })

                }
            }
            return resolve(payload);
        })

    })
}
function checkAndRemoveExpiredToken() {
    return new Promise((resolve, reject) => {
        try {
            whitelist.smembers('whitelist', async (err, tokens) => {
                if (err) {
                    return reject(createError.InternalServerError('An error occured.'));
                }
                await Promise.all(tokens.map(async (token) => {
                    await removeExpiredToken(token);
                }))
                // tokens.forEch(token =>{
                //     await removeExpiredToken(token);
                // })
                return resolve();
            })

        } catch (error) {
            return reject(error);
        }
    })
}
async function addTokenToRedisClient(redisClient, name, token) {
    return new Promise((resolve, reject) => {
        redisClient.sadd(name, token, (err, result) => {
            if (err) {
                return reject(createError.InternalServerError());
            }
            return resolve(result);
        })
    })
}
function checkTokenToRedisClient(redisClient, name, token) {
    return redisClient.sismember(name, token, (err, result) => {
        if (err) {
            return -1;
        }
        return result; // 1 or 0
    })
}
async function removeTokenToRedisClient(redisClient, name, token) {
    return new Promise(async (resolve, reject) => {
        redisClient.srem(name, token, (err, reply) => {
            if (err) {
                return reject(createError.InternalServerError());
            }
            return resolve(reply);// 1 or 0
        })
    })
}
const increase = key => {
    return new Promise((resolve, reject) => {
        clientRequests.incr(key, (err, result) => {
            if (err) {
                return reject(createError.InternalServerError('An error occurred 1'));
            }
            return resolve(result);
        })
    })
}
const expire = (key, ttl) => {
    return new Promise((resolve, reject) => {
        clientRequests.expire(key, ttl, (err, result) => {
            if (err) {
                return reject(createError.InternalServerError('An error occurred 2'));
            }
            return resolve(result);
        })
    })
}
const ttl = (key) => {
    return new Promise((resolve, reject) => {
        clientRequests.ttl(key, (err, ttl) => {
            if (err) {
                return reject(createError.InternalServerError('An error occurred 3'));
            }
            return resolve(ttl);
        })
    })
}

// Middleware
const checkNumberRequest = async (req, res, next) => {
    try {
        const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;// if the host is local the value is undefined
        const numberRequest = await increase(userIP);
        let _ttl;
        if (numberRequest === 1) {
            await expire(userIP, 60);// 60s
            _ttl = 60;
        } else {
            _ttl = await ttl(userIP);
        }

        if (numberRequest > 20) {
            // return next(createError.TooManyRequests());
            return res.status(503).json({
                status: 503,
                message: 'Vui lòng chờ trong giây lát',
                numberRequest,
                _ttl
            })
        }
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    checkWhitelist,
    removeExpiredToken,
    checkAndRemoveExpiredToken,
    checkTokenToRedisClient,
    addTokenToRedisClient,
    removeTokenToRedisClient,
    increase,
    expire,
    ttl,
    checkNumberRequest
}
