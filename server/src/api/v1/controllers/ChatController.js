const {signToken} = require('../services/jwt_service');
module.exports = {
    chat: async(req, res, next)=>{
        res.sendFile(__DIRNAME + '/api/v1/public/views/chat.html');
    },
    message: async(req, res, next)=>{
        const {msg} = req.query;
        console.log(msg)
        __IO.to('konnichiwa').emit('chat message', msg);

        return res.json({
            code: 200,
            msg
        })
    }
}