var database = require('./firebase-database');

module.exports = {
    addUser: function (user) {
        database.ref('users/' + user.username).set(user);
    },
    addClient: function (client) {
        database.ref('clients/' + client.client_id).set(client);
    },
    addToken: function (token) {
        database.ref('tokens/' + token.access_token).set(token);
    },
    addHandshake: function (authHandshake) {
        database.ref('handshakes/' + authHandshake.code).set(authHandshake);
    },

    getClientById: function (client_id) {
        return database.ref('clients').child(client_id).once('value').then(function (snapshot) {
            return snapshot.val();
        });
    },
    getHandshakeByCode: function (code) {
        return database.ref('handshakes').child(code).once('value').then(function (snapshot) {
            return snapshot.val();
        });
    },
    getUserByUsername: function (username) {
        return database.ref('users').child(username).once('value').then(function (snapshot) {
            return snapshot.val();
        });
    },
    getTokenByRefreshToken: function (refresh_token) {
        return database.ref('tokens').orderByChild('refresh_token').equalTo(refresh_token).limitToFirst(1).once('value').then(function (snapshot) {
            return new Promise((resolve, reject) => {
                snapshot.forEach(function (data) {
                    resolve(data.val());
                });
            });
        });
    },

    removeHandshakeByCode: function (code) {
        database.ref('handshakes').child(code).remove();
    },
    removeTokenByRefreshToken: function (refresh_token) {
        database.ref('tokens').orderByChild('refresh_token').equalTo(refresh_token).once('value').then(function (snapshot) {
            snapshot.forEach(function (data) {
                database.ref('tokens').child(data.val().access_token).remove();
            });
        });
    }
};