class LinkedAccount {

    constructor(access_token, refresh_token, expires_at) {
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        this.expires_at = expires_at;
    }

}

module.exports = LinkedAccount;