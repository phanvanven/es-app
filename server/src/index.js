const express = require("express");
const path = require("path");
const cors = require('cors');
const app = express();
const db = require("./config/connection_mongodb");
const server = require("http").createServer(app);
const morgan = require("morgan");
const route = require("./routes");
const cookieParser = require('cookie-parser');
const SocketService = require('./api/v1/services/SocketService');
const io = require("socket.io")(server);
// const {Server} = require('socket.io');
const SocketIOFileUpload = require("socketio-file-upload");

// Important
global.__IO = io;
global.__DIRNAME = __dirname;

require("dotenv").config();
db.connectMongodb();
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(SocketIOFileUpload.router);//https://www.npmjs.com/package/socketio-file-upload/v/0.1.0
app.use(express.static(path.join(__dirname, 'api/v1/public')));//http://localhost:3000/views/login.html
app.use(morgan("common"));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000",// block all other domains except this one
  credentials: true// open cookie http via CORS
}))
const PORT = process.env.PORT || 5000;

global.__IO.use(SocketService.checkSocket);
global.__IO.on("connection", SocketService.connect)
route(app);

server.listen(PORT, () => {
  console.log(`>>> Server is running on port ${PORT}`);
});
