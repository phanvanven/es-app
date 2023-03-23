const { Schema, model } = require("mongoose");

const FriendSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "users" },
    recipient: { type: Schema.Types.ObjectId, ref: "users" },
    status: {
      type: Number,
      enums: [
        0, //'add friend',
        1, //'requested',
        2, //'pending',
        3, //'friends'
      ],
    },

    // OR we can use the struture like below:
    // userID: { type: Schema.Types.ObjectId, ref: "users" },
    // status: {
    //   type: Number,
    //   enums: [
    //     0, //'add friend',
    //     1, //'requested',
    //     2, //'pending',
    //     3, //'friends'
    //   ],
    // },
  },
  {
    collection: "friends",
    timestamps: true
  }
);

const FriendModel = model("friends", FriendSchema);
module.exports = FriendModel;
