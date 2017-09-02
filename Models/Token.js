
class Token {
    constructor(access_token, refresh_token, expires_in) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_in = expires_in;
    }
}

module.exports = Token;