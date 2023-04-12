const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    author: {type: Schema.Types.ObjectId, ref: "users", required: true},
    title: {type: String, trim: true},
    content: {type: String, trim: true},
    pinned: Boolean,
    total_likes: Number,
    total_commments: Number,
    likes:[{type: Schema.Types.ObjectId, ref: "users"}],
    commments: [{type: Schema.Types.ObjectId, ref: "users"}],
    tags: [{type: Schema.Types.ObjectId, ref: "users"}],
    status: {
        type: String,
        enum: ["active", "deleted", "published", "pending", "approved", "rejected", "archived"]
    }
}, {
    collection: 'posts',
    timestamps: true
});

const PostModel = mongoose.model('posts', PostSchema);
module.exports = PostModel;