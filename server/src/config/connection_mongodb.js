const mongoose = require('mongoose');
async function connectMongodb() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/material_social_network', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('>>> connected to mongodb')
    } catch (error) {
        console.log('connect failure!!!');
    }
}

module.exports = { connectMongodb };