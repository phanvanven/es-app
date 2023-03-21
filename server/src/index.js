const express = require("express");
const path = require("path");
const app = express();
const db = require("./config/connection_mongodb");
const server = require("http").createServer(app);
const morgan = require("morgan");
const route = require("./routes");
const io = require("socket.io")(server);
const cookieParser = require('cookie-parser');
const SocketService = require('../src/api/v1/services/socket_service');

// Important
global.__IO = io;
global.__DIRNAME = __dirname;

require("dotenv").config();
db.connectMongodb();
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.static(path.join(__dirname, 'api/v1/public')));//http://localhost:3000/views/login.html
app.use(morgan("common"));
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

global.__IO.use(SocketService.checkSocket);
global.__IO.on("connection", SocketService.connect)
route(app);

server.listen(PORT, () => {
  console.log(`>>> Server is running on port ${PORT}`);
});
