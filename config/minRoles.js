const minRoles = {
    products:{
        get: 1000,
        post: 5000,
        put: 5000,
        delete: 5000,
    },
    users:{
        get: 1000,
        post: 5000,
        put: 5000,
        delete: 5000,
    },
    userRoles:
    {
        get: 1000,
    },
    uploads:{
        post: 1000, 
        delete: 1000,
    },
}

module.exports = {minRoles}