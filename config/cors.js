const whitelist = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
];

const corsConfig = {
    origin: (requestOrigin, callback) => {
        const isWhitelistedOrigin = whitelist.includes(requestOrigin) || !requestOrigin ;

        if (isWhitelistedOrigin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsConfig;