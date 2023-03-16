module.exports = {
    isLoggedIn: (req, res, next => {
        console.log('LoggedIn middleware');
        if (!req.headers['authorization']) {
            return next(createError.Unauthorized());
        }
        const authHeader = req.headers['authorization'];
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
            try {
                // terminate and return data back to app.use. which outputs the error
                if (err) {
                    if (err.name === 'JsonWebTokenError') {
                        return next(createError.Unauthorized());
                    }
                    // If the token has expired. Checking if the token is in the expiredlist.
                    const suspect = await checkTokenToRedisClient(expiredlist, 'expiredlist', token);
                    if (suspect === -1) {
                        return next(createError.InternalServerError('An error occured.'));
                    }

                    // Suspected user's token is stolen
                    if (suspect) {
                        // logout and send email to user
                        const { userID } = await verifyInternalAccessToken(token);
                        // automatic logout and flag users
                        const email = await UserModel.findById(userID, 'email');
                        const [removed, deleted, flagged, emailed] = await Promise.all([
                            removeTokenToRedisClient(expiredlist, 'expiredlist', token),
                            deleteRefreshToken(userID),
                            addTokenToRedisClient(flaglist, 'flaglist', userID),
                            sendEmail({
                                email, // this email is taken from token when verified, we can take the email in db using userID
                                subject: 'Cảnh Báo Bảo Mật',
                                html:
                                    `<p>Tài khoản của bạn gần đây đang có những hoạt động bất thường, chúng tôi nghi ngờ tài khoản của bạn đã bị đánh cắp.
                    <p>Vui lòng đăng nhập lại và thay đổi mật khẩu mạnh hơn.</p>`
                            })
                        ])
                        return next(createError.Unauthorized('Tài khoản của bạn gần đây có những hoạt động bất thường'));
                    }
                    return next(createError.Unauthorized('Vui lòng đăng nhập'));
                }

                const flag = await checkTokenToRedisClient(flaglist, 'flaglist', payload.userID);
                if (flag === -1) {
                    return next(createError.InternalServerError());
                }
                //real user but flagged user -> revoke token => remove token in whitelist
                if (flag === 1) {
                    const [revoked, removeFlag] = await Promise.all([
                        removeTokenToRedisClient(whitelist, 'whitelist', token),
                        removeTokenToRedisClient(flaglist, 'flaglist', payload.userID),
                    ])
                    return next(createError.Unauthorized('Người dùng đã bị gắn cờ'));
                }

                req.payload = payload;
                next();// next to check Whitelist

            } catch (error) {
                return next(error)
            }

        })
    })
}