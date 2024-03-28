'use strict';

module.exports = {
    SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION: 'SocialChannels',
    SNAPCHAT_CUSTOM_OBJECT_ID: 'snapchat-settings',
    BUSINESS_PLATFORM: 'SALESFORCE',
    SERVICES: {
        SNAPCHAT_OAUTH: 'snapchat.oauth.app',
        SNAPCHAT_TOKEN: 'snapchat.rest.accounts',
        SNAPCHAT_ADS: 'snapchat.rest.ads',
        EINSTEIN: 'einstein-rest',
        EINSTEIN_STAGING: 'einstein-rest-staging',
        ACCOUNT_MANAGER: 'b2c-account-manager'
    },
    ENDPOINTS: {
        AUTHORIZE: '/login/oauth2/authorize',
        AUTH: '/login/oauth2/access_token',
        REFRESH: '/login/oauth2/access_token',
        GET_PIXEL_FROM_ADD_ACCOUNT: '/v1/adaccounts/',
        GET_ORG_DETAILS: '/v1/organizations/',
        GET_BUSINESS_PROFILE: '/v1/me',
        GET_ADD_ACCOUNTS: '/v1/organizations/',
        DISCONNECT: '/accounts/oauth2/revoke'
    },
    EINSTEIN_THIRD_PARTY_ID: 'snapchat',
    CONTENT_TYPE_JSON: 'application/json',
    CONTENT_TYPE_URLENCODED: 'application/x-www-form-urlencoded'
};