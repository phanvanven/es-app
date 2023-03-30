
//get token o localStorage
function getLocalToken() {
    const token = window.localStorage.getItem('accessToken')
    return token
}

//get token o refreshToken
function getLocalRefreshToken() {
    const token = window.localStorage.getItem('refreshToken')
    return token
}

//cau hinh axios
const instance = axios.create({
    baseURL: 'http://localhost:3000/',
    timeout: 300000,
    headers: {
        'Content-Type': 'application/json',
    }
})

instance.setToken = (token) => {
    instance.defaults.headers['x-access-token'] = token
    window.localStorage.setItem('token', token)
}


function getToken() {
    return instance.post('/login', {
        username: 'anonystick.com',
        password: 'anonystick.com',
    })
}

function refreshToken () {
    return instance.post('/token',{
        refreshToken: getLocalRefreshToken()
    })
}

function getDataWithAuto() {
    return instance.get('/chat/form-chat',{
        params: {
            auto: 'yes',
        },
        headers: {
            'x-access-token': getLocalToken() // headers token
        }

    })
}

function getDataWithOutAuto() {
    return instance.get('/chat/form-chat',{
        params: {
            auto: 'no'
        },
        headers: {
            'x-access-token': getLocalToken() // headers token
        }
    })
}


instance.interceptors.response.use((response) => {

    const {status, auto} = response.data
    if (status === 401) {
        if(auto === 'yes'){
            console.log('get new token using refresh token', getLocalRefreshToken())
            return refreshToken().then(rs => {
                console.log('get token refreshToken>>', rs.data)
                const { token } = rs.data
                instance.setToken(token);
                const config = response.config
                config.headers['x-access-token'] = token
                config.baseURL = 'http://localhost:3000/'
                return instance(config)

            })
        }
    }
    return response
}, error => {
    console.warn('Error status', error.response.data.status)
    if (error.response) {
        return parseError(error.response.data)
    } else {
        return Promise.reject(error)
    }
})