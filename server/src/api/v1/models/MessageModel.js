const { Schema, model, default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "users", required: true },
    content: { type: String, required: true },
    time: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false },
    seen: [{ type: Schema.Types.ObjectId, ref: "users" }],
    attached: {
      filename: String,
      originalname: String,
      contentType: String,
      path: String,
      size: Number,
    },
    replied: { type: Schema.Types.ObjectId, ref: "messages" },
  },
  {
    collection: "messages",
  }
);

const MessageModel = model("messages", MessageSchema);
module.exports = MessageModel;
