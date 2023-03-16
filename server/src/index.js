const express = require('express');
const path = require('path');
const app = express();
const db = require('./config/connection_mongodb');
const server = require('http').createServer(app);
const io = require('./api/v1/sockets');
const morgan = require('morgan');
const route = require('./routes');

require('dotenv').config();
db.connectMongodb();
app.use(express.json({limit: '30mb'}));
app.use(express.urlencoded({extended: true, limit: '30mb'}));
app.use(express.static('views'));
app.use(morgan('common'));
const PORT = process.env.PORT || 5000;

route(app);
server.listen(PORT, ()=>{
    console.log(`>>> Server is running on port ${PORT}`);
})

