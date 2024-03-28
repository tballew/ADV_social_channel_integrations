'use strict';

module.exports = {
    SOCIAL_CHANNEL_CUSTOM_OBJECT_DEFINITION: 'SocialChannels',
    TIKTOK_CUSTOM_OBJECT_ID: 'tiktok-settings',
    BUSINESS_PLATFORM: 'SALESFORCE',
    STATIC_APP_ACCESS_TOKEN: '244e1de7-8dad-4656-a859-8dc09eea299d',
    EXTERNAL_DATA_VERSION: '1.0',
    EXTERNAL_DATA_HMAC_VERSION: 'HmacSHA256',
    SERVICES: {
        TIKTOK: {
            BUSINESS_API: 'tiktok.catalog',
            BASE: 'tiktok.rest',
            ADS: 'tiktok-ads',
            TRACKING: 'tiktok.tracking'
        },
        EINSTEIN: 'einstein-rest',
        ACCOUNT_MANAGER: 'b2c-account-manager'
    },
    ENDPOINTS: {
        AUTH: '/open_api/v1.2/oauth2/access_token/',
        CREATE_APPLICATION: '/marketing_api/api/developer/app/create_auto_approve/',
        GET_CATALOG_OVERVIEW: '/open_api/v1.2/catalog/overview/',
        GET_PIXEL_LIST: '/open_api/v1.2/pixel/list/',
        PIXEL_TRACK : '/open_api/v1.3/pixel/track/',
        PIXEL_TRACK_BATCH : '/open_api/v1.3/pixel/batch/',
        UPLOAD_PRODUCTS: '/open_api/v1.2/catalog/product/upload/',
        REMOVE_PRODUCTS: '/open_api/v1.2/catalog/product/delete/',
        GET_BUSINESS_PROFILE: '/open_api/v1.2/tbp/business_profile/get/',
        DISCONNECT: '/open_api/v1.2/tbp/business_profile/disconnect/'
    },
    EINSTEIN_THIRD_PARTY_ID: 'tiktok'
};
