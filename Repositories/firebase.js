const config = require('./../Configuration/config.json');

var admin = require("firebase-admin");
var serviceAccount = require('./../Configuration/firebase-certificate.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config['frbs_databaseURL']
});

module.exports = admin;