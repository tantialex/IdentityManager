class User {

    constructor(username, password, linkedAccounts) {
        this.username = username;
        this.password = password;
        this.linkedAccounts = linkedAccounts || [];
    }

    addLinkAccount(access_token, refresh_token, expires_at) {
        var _linkedAccount = new require('./LinkedAccount');
        var linkedAccount = _linkedAccount(access_token, refresh_token, expires_at);
        this.linkedAccounts.push()
    }

    setEmail(email) {
        this.email = email;
    }
}

module.exports = User;