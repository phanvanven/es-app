const fs = require("fs");
const path = require("path");
const Resize = require("../helpers/Resize");
const fileType = {
  mp4: "videos",
  webm: "videos",
  png: "images",
  jpg: "images",
  jpeg: "images",
  svg: "images",
  gif: "images",
  psd: "images",
  ai: "images",
  bmp: "images",
};

module.exports = {
  uploadFile: (socket, dir) => {
    let fileSize = 0;
    let receivedBytes = 0;
    let expectedBytes = 0;
    let buffer = null;
    let fileStream = null;
    let fileName = "";

    // uploadFile(socket, dir)

    socket.on("file-start", ({ name, size }) => {
      console.log(`Receiving file ${name}, ${size} bytes`);
      fileSize = size;
      fileName = name;
    });

    socket.on("file-data", ({ chunk, offset }) => {
      // Nếu server đã nhận đủ kích thước của phần dữ liệu,
      // nó sẽ lưu trữ phần dữ liệu và chuẩn bị nhận phần dữ liệu tiếp theo
      if (offset === expectedBytes) {
        expectedBytes += chunk.length;
        if (!buffer) {
          buffer = Buffer.alloc(fileSize);
        }
        chunk.copy(buffer, offset);
        receivedBytes += chunk.length;

        if (receivedBytes === fileSize) {
          // Nếu server đã nhận đủ tất cả phần dữ liệu của tập tin,
          // nó sẽ lưu tập tin vào ổ đĩa và gửi thông báo hoàn tất cho client
          const extension = Resize.getFileExtension(message.fileName);
          const folder =
            fileType[extension[0]] === undefined
              ? "files"
              : fileType[extension[0]];
          // Combine the parts into a single buffer
          fileStream = fs.createWriteStream(path.join(dir,folder, fileName));
          fileStream.write(buffer);
          fileStream.end();
          fileSize = 0;
          receivedBytes = 0;
          expectedBytes = 0;
          buffer = null;
          fileStream = null;
          fileName = "";
          console.log(`File saved to uploads/${fileName}`);
          socket.emit("file-complete");
        }
      }
    });

    socket.on("file-end", () => {
      console.log("File upload complete");
      // socket.disconnect();
    });
  },
  sendFile2: (socket, dir) => {
    const parts = new Map();
    // Set up a handler for incoming file parts
    socket.on("file", (message) => {
      // Store the part in memory
      parts.set(message.partNumber, message.data);

      // Check if we've received all the parts
      if (parts.size === Math.ceil(message.totalSize / 1024)) {
        console.log("File received");

        const extension = Resize.getFileExtension(message.fileName);
        const folder =
          fileType[extension[0]] === undefined
            ? "files"
            : fileType[extension[0]];
        // Combine the parts into a single buffer
        const file = Buffer.concat(Array.from(parts.values()));

        // Write the file to disk
        fs.writeFileSync(path.join(dir, folder, message.fileName), file);

        // Send a confirmation message back to the client
        socket.emit("fileReceived", "File received and saved");
      }
    });

    // Set up a handler for the end of the file transmission
    socket.on("fileEnd", () => {
      console.log("File transmission ended");
      // Reset the parts map
      parts.clear();
    });
  },
};
