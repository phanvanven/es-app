// const express = require('express');
// const router = express.Router();
const routerV1 = require('../api/v1/routes');
// const routerV2 = require('../api/v2/routes');
function route(app){
    app.use('/api/v1/', routerV1);
    // app.use('/api/v2/', routerV2);

    app.use((req, res, next)=>{
        next(createError.NotFound('Trang không tồn tại'));
    });

    // all errors will be thrown here
    app.use((err, req, res, next)=>{
        console.error(err.message);
        res.json({
            status: err.status || 500,
            message: err.message
        })
    })
    
}

module.exports = route;