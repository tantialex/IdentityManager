const config = require('./Configuration/config.json');
const port = process.env.PORT || 1338;

var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var identityService = require('./identity-service.js');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

//Web page routing
app.get('/authorize', function (req, res, next) {
    res.sendfile(__dirname + '/public/login.html');
});
app.get('/registerclient', function (req, res, next) {
    res.sendfile(__dirname + '/public/registerclient.html');
});

//Route to get authorization code by authenticating user.
app.post('/authorize', function (req, res, next) {
    validateAuthenticationRequest(req).then(function () {
        return identityService.processAuthentication(req.body['username'], req.query['client-id']);
    }).then(function (code) {
        res.body = token;
        res.redirect(req.query['redirect_uri']);
    }).catch(function (reason) {
        res.send(400, reason.message);
    });;
});

//Route to get token either by authorization code or refresh token.
app.post('/api/token', function (req, res, next) {
    validateTokenRequest(req).then(function () {
        var authorizationWords = req.headers['authorization'].split(' ');
        if (req.body['grant_type'] === 'authorization_code') {
            return identityService.processToken(req.body['code'], authorizationWords[1]);
        } else if (req.body['grant_type'] === 'refresh_token') {
            return identityService.refreshToken(req.body['refresh_token'], authorizationWords[1]);
        } else {
            throw new Error('invalid grant type');
        }
    }).then(function (token) {
        res.send(200, token);
    }).catch(function (reason) {
        res.send(400, reason.message);
    });;
});

//Route to register user.
app.post('/register', function (req, res, next) {
    validateUserRegistration(req).then(function () {
        return identityService.addUser(req.body['username'], req.body['password']);
    }).then(function () {
        res.end();
    }).catch(function (reason) {
        res.send(400, reason.message);
    });
});

//Route to register client.
app.post('/registerclient', function (req, res, next) {
    validateClientRegistration(req).then(function () {
        return identityService.addClient(req.body['client-name'], req.body['redirect-uri']);
    }).then(function () {
        res.end();
    }).catch(function (reason) {
        res.send(400, reason.message);
    });;
});

app.set('port', port);
app.listen(app.get('port'));


function validateAuthenticationRequest(req) {
    return new Promise((resolve, reject) => {
        if (req.query['client-id'] === undefined) {
            reject(new Error('missing client-id'));
        } else if (req.query['response_type'] === undefined) {
            reject(new Error('missing response_type'));
        } else if (req.query['response_type'] !== 'code') {
            reject(new Error('invalid response_type'));
        }else if (req.query['redirect_uri'] === undefined) {
            reject(new Error('missing redirect_uri'));
        } else if (req.body['username'] === undefined) {
            reject(new Error('missing username'));
        } else if (req.body['password'] === undefined) {
            reject(new Error('missing password'));
        } else {
            //Check if Redirect URI matches.
            resolve(identityService.checkClientRedirectURI(req.query['client-id'], req.query['redirect_uri']));
        }
    }).then(function (result) {
        if (result === true) {
            //Check if user exists and password matches.
            return identityService.checkPasswordOfUser(req.body['username'], req.body['password']);
        } else {
            throw new Error('invalid client-id');
        }
    }).then(function (result) {
        if (result === true) {
            return;
        } else {
            throw new Error('invalid password');
        }
    });
}

function validateTokenRequest(req) {
    return new Promise((resolve, reject) => {
        if (req.body['grant_type'] === undefined) {
            reject(new Error('missing grant type'));
        } else if (req.headers['authorization'] === undefined) {
            reject(new Error('missing authorization'));
        } else if (req.body['grant_type'] === 'refresh_token' && req.body['refresh_token'] === undefined) {
            reject(new Error('missing refresh token'));
        } else if (req.body['grant_type'] === 'authorization_code' && req.body['redirect_uri'] === undefined) {
            reject(new Error('missing redirect uri'));
        } else if (req.body['grant_type'] === 'authorization_code' && req.body['code'] === undefined) {
            reject(new Error('missing code'));
        } else {
            resolve();
        }
    }).then(function () {
        var authorizationWords = req.headers['authorization'].split(' ');
        if (authorizationWords.length !== 2) {
            throw new Error('invalid authorization format');
        } else if (authorizationWords[0] !== 'Basic') {
            throw new Error('invalid authorization type');
        } else {
            return;
        }
    });
}

function validateUserRegistration(req) {
    return new Promise((resolve, reject) => {
        if (req.body['username'] === undefined) {
            reject(new Error('missing username'));
        } else if (req.body['password'] === undefined) {
            reject(new Error('missing password'));
        } else if (req.body['confirm-password'] === undefined) {
            reject(new Error('missing confirmed password'));
        } else if (req.body['password'] !== req.body['confirm-password']) {
            reject(new Error('passwords do not match'));
        } else {
            resolve(identityService.checkUsernameExists(req.body['username']));
        }
    }).then(function (result) {
        if (result === false) {
            return;
        } else {
            throw new Error('username already exists');
        }
    });
}

function validateClientRegistration(req) {
    return new Promise((resolve, reject) => {
        if (req.body['client-name'] === undefined) {
            reject(new Error('missing client name'));
        } else if (req.body['redirect-uri'] === undefined) {
            reject(new Error('missing redirect uri'));
        } else {
            resolve();
        }
    });
}

