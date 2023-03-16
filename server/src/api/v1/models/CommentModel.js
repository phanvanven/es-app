const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    author: {
        type: Object
    },
    discuss_id: Number,
    posted: Date,
    text: String,
    parent_slug: String,
    score: Number,
    slug: String,
    replies_num: {
        type: Number,
        default: 0
    },
    likes: Array,
    like_num: Number,
    full_slug: String

},{
    collection: 'comments',
    timestamps: true
})
const CommentModel = mongoose.model('comments', CommentSchema);
module.exports = CommentModel;