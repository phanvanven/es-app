// const redis = require('redis');
// const client = redis.createClient({
//     host: 'redis-10533.c252.ap-southeast-1-1.ec2.cloud.redislabs.com',
//     port: 10533,
//     password: 'NQvuUgFC2BQjmOaCccfiJaDbhRrzeceu',
// });
// client.ping((err, pong)=>{
//     console.log(pong); 
// })


const Redis = require('ioredis');
const fs = require('fs');

require('dotenv').config();
const REFRESH_TOKEN_REDIS_HOST = process.env.REFRESH_TOKEN_REDIS_HOST;
const REFRESH_TOKEN_REDIS_PORT = process.env.REFRESH_TOKEN_REDIS_PORT;
const REFRESH_TOKEN_REDIS_PASS = process.env.REFRESH_TOKEN_REDIS_PASS;
const WHITELIST_REDIS_HOST = process.env.WHITELIST_REDIS_HOST;
const WHITELIST_REDIS_PORT = process.env.WHITELIST_REDIS_PORT;
const WHITELIST_REDIS_PASS = process.env.WHITELIST_REDIS_PASS;

const client = new Redis({
    host: REFRESH_TOKEN_REDIS_HOST,
    port: REFRESH_TOKEN_REDIS_PORT,
    password: REFRESH_TOKEN_REDIS_PASS
});

const whitelist = new Redis({
    host: WHITELIST_REDIS_HOST,
    port: WHITELIST_REDIS_PORT,
    password: WHITELIST_REDIS_PASS
});

const expiredlist = new Redis({
    host: WHITELIST_REDIS_HOST,
    port: WHITELIST_REDIS_PORT,
    password: WHITELIST_REDIS_PASS
});

const flaglist = new Redis({
    host: WHITELIST_REDIS_HOST,
    port: WHITELIST_REDIS_PORT,
    password: WHITELIST_REDIS_PASS
});

const clientRequests = new Redis({
    host: WHITELIST_REDIS_HOST,
    port: WHITELIST_REDIS_PORT,
    password: WHITELIST_REDIS_PASS
});

clientRequests.ping((err, pong)=>{
    console.log('>>> clientRequests >>>', pong); 
});

whitelist.ping((err, pong)=>{
    console.log('>>> whitelist >>>', pong); 
});

module.exports = {
    client,
    whitelist,
    expiredlist,
    flaglist,
    clientRequests
};