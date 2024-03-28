'use strict';

module.exports = {
    SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION: 'SocialChannels',
    GOOGLE_CUSTOM_OBJECT_ID: 'google-channel-settings',
    STATIC_APP_ACCESS_KEY: 'AIzaSyD2V1dj0GHy8y4gq3_xN7WLJFyLSqtyDJ8',
    SERVICES: {
        GOOGLE: {
            CREATE_MERCHANT: 'google.merchant.create',
            GET_MERCHANT: 'google.merchant.get'
        }
    },
    ENDPOINTS: {
        CREATE_MERCHANT: '/v1/merchants',
        GET_MERCHANT: '/v1/merchants/'
    },
    MERCHANT_NAME_PREFIX: 'merchants/',
    FEED_PATHS: {
        PRODUCT: '/src/feeds/export/social/google/product',
        STORES: '/src/feeds/export/social/google/stores',
        NATIVE_INVENTORY: '/src/feeds/export/social/google/inventory',
        PRICE: '/src/feeds/export/social/google/pricebook',
        OCI: '/src/feeds/export/oci'
    },
    STATES: {
        LIVE: 'LIVE'
    },
    IMPEX_DEFAULT_PATH: '/on/demandware.servlet/webdav/Sites/Impex'
};
