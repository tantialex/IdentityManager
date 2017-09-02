class AuthHandshake {
    constructor(code, username, client_id, expires_at) {
        this.code = code;
        this.username = username;
        this.client_id = client_id;
        this.expires_at = expires_at;
    }
}

module.exports = AuthHandshake;