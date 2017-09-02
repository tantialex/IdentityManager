const config = require('./Configuration/config.json');
var CRYPTOJS = require('crypto-js');
var identityRepo = require('./Repositories/identity-repository.js');

function encryptPassword(password) {
    return CRYPTOJS.SHA256(password).toString(CRYPTOJS.enc.Base64);
}

function checkAuthorizationMatches(authorization, client_id, client_secret) {
    var clientAuthorization = CRYPTOJS.enc.Base64.stringify(CRYPTOJS.enc.Utf8.parse(client_id + ':' + client_secret));
    return clientAuthorization === authorization;
}

function createNewToken(username, expires_in) {
    var _token = require('./Models/Token');
    var _tokenDataModel = require('./Models/TokenDataModel');

    var currentTime = Date.now();
    var access_token = CRYPTOJS.SHA256(currentTime + username).toString(CRYPTOJS.enc.Hex);

    var expires_at = new Date(currentTime + expires_in * 1000);
    var refresh_token = CRYPTOJS.SHA256(expires_at.toString() + username).toString(CRYPTOJS.enc.Hex);

    var tokenDataModel = new _tokenDataModel(username, access_token, refresh_token, expires_at.toISOString());
    //Save token in repository.
    identityRepo.addToken(tokenDataModel);

    var token = new _token(access_token, refresh_token, expires_in);
    return token;
}

module.exports = {
    addClient: function (client_name, redirect_uri) {
        var _client = require('./Models/Client');

        var client_id = CRYPTOJS.SHA256(Date.now.toString() + client_name).toString(CRYPTOJS.enc.Hex);
        var client_secret = CRYPTOJS.SHA256(Date.now().toString() + client_name + config['client_crypt_secret']).toString(CRYPTOJS.enc.Hex);

        var client = new _client(client_name, redirect_uri, client_id, client_secret);

        identityRepo.addClient(client);
    },
    addUser: function (username, password) {
        var _user = require('./Models/User');

        var encryptedPassword = encryptPassword(password);
        var user = new _user(username, encryptedPassword);

        identityRepo.addUser(user);
    },

    processAuthentication: function (username, client_id) {
        var _authHandshake = require('./Models/AuthHandshake');

        var currentTime = Date.now();
        var expires_in = 300;
        var code = CRYPTOJS.SHA256(client_id + currentTime + username).toString(CRYPTOJS.enc.Hex);

        var expires_at = new Date(currentTime + expires_in * 1000);
        var authHandshake = new _authHandshake(code, username, client_id, expires_at.toISOString());

        identityRepo.addHandshake(authHandshake);

        return code;
    },
    processToken: function (code, authorization) {
        //Get handshake from repository.
        return identityRepo.getHandshakeByCode(code).then(function (authHandshake) {
            if (authHandshake !== null) {
                //Check if handshake expired.
                var expires_at = Date.parse(authHandshake.expires_at);
                if (expires_at >= Date.now()) {
                    //Get client from repository.
                    return identityRepo.getClientById(authHandshake.client_id).then(function (client) {
                        //Check if client returned matches client information in authorization header.
                        return checkAuthorizationMatches(authorization, client.client_id, client.client_secret);
                    }).then(function (isAuthorized) {
                        if (isAuthorized) {
                            //Return user associated with handshake.
                            return authHandshake.username;
                        } else {
                            throw new Error('authorization failed');
                        }
                    });
                } else {
                    throw new Error('handshake expired');
                }
            } else {
                throw new Error('invalid code');
            }
        }).then(function (username) {
            //Remove use handshake.
            identityRepo.removeHandshakeByCode(code);
            //Create and return new token.
            return createNewToken(username, 3600);
        });
    },
    
    refreshToken: function (refresh_token, authorization) {
        //Get token from repository.
        return identityRepo.getTokenByRefreshToken(refresh_token).then(function (tokenDataModel) {
            if (tokenDataModel !== null) {
                return tokenDataModel.username;
            } else {
                throw new Error('refresh token does not exist');
            }
        }).then(function (username) {
            //Remove old token.
            identityRepo.removeTokenByRefreshToken(refresh_token);
            //Create and return new token.
            return createNewToken(username, 3600);
        });
    },

    checkUsernameExists: function (username) {
        return identityRepo.getUserByUsername(username).then(function (user) {
            return user !== null;
        });
    },
    checkPasswordOfUser: function (username, password) {
        return identityRepo.getUserByUsername(username).then(function (user) {
            if (user !== null) {
                var encryptedPassword = encryptPassword(password);
                return encryptedPassword === user.password;
            } else {
                throw new Error('user does not exist');
            }
        });
    },
    checkClientRedirectURI: function (client_id, redirect_uri) {
        return identityRepo.getClientById(client_id).then(function (client) {
            if (client !== null) {
                return redirect_uri === client.redirect_uri;
            } else {
                throw new Error('client does not exist');
            }
        });
    }
}