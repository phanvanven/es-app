const { Schema, model, default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");

const ChatSchema = new Schema(
  {
    members: [
      {
        _id: { type: Schema.Types.ObjectId, ref: "users"},
        role: {
          type: String,
          enum: ["chatter", "admin", "viewer", "editor"],
          default: "chatter",
        },
      },
    ],
    type: {
      type: String,
      enum: ["private", "group"],
    },
    avatar: { type: String },
    groupName: { type: String},
    password: { type: String, minLength: 4 },
    messages: [{type: Schema.Types.ObjectId, ref: "messages", required: true}]
    // messages: [
    //   {
    //     sender: { type: Schema.Types.ObjectId, ref: "users" },
    //     content: { type: String, required: true },
    //     time: { type: Date, default: Date.now },
    //     deleted: { type: Boolean, default: false },
    //     seen: [{ type: Schema.Types.ObjectId, ref: "users" }],
    //     attached: {
    //       filename: String,
    //       originalname: String,
    //       contentType: String,
    //       path: String,
    //       size: Number,
    //     },
    //     replied: {
    //       messageId: { type: String },
    //       chatId: { type: mongoose.Types.ObjectId, ref: "chats" },
    //     },
    //   },
    // ],
  },
  {
    collection: "chats",
    timestamps: true,
  }
);

ChatSchema.pre("save", async function (next) {
  if (this.password) {
    try {
      if (this.type === "private") {
        return next(new Error("Private chat does not exist password"));
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    } catch (error) {
      next(error);
    }
  }
  // continue saving the chat document
  next();
});

ChatSchema.methods.isCheckPassword = async function (password, next) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    next(error);
  }
};


const ChatModel = model("chats", ChatSchema);
module.exports = ChatModel;
