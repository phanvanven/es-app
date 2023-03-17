const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const PostSchema = new Schema({
    author: {
        type: Object
    },
    discuss_id: Number,
    posted: Date,
    text: String,
    replies_num: {
        type: Number,
        default: 0
    },
    likes: Array,
    like_num: Number,
}, {
    collection: 'posts',
    timestamps: true
});

const PostModel = mongoose.model('posts', PostSchema);
module.exports = PostModel;