# SocialChannels integration

# TikTok integration

This folder contains the TikTok integration layer with Salesforce B2C Commerce.

## How this works?

The codebase is composed of two cartridges:

- `bm_socialchannels`: This cartridge contains the Business Manager controllers/UI logic that allow to provide a new Business Manager extention that the site admin can use to integrate with different social channels like TikTok, Snapchat, etc.
- `int_tiktok`: This cartridge contains the logic to integrate with TikTok. It contains the service definitions, logic to handle the customer object that stores the TikTok details, and the job which allow to sync the B2C Commerce product catalog with TikTok.

## How to install the integration?

In order to install this integration, you need to follow these steps:

1. Upload both `bm_socialchannels` and `int_tiktok` cartridges to your active code version
2. Add `bm_socialchannels` cartridge to the Business Manager cartridge path.
3. Add  `int_tiktok` to your site cartridge path this is important as the export catalog job will call directly TikTok API
4. Zip the content of the `data` folder and import the zip file through the `Administration > Site Development > Site Import & Export` menu
5. Give permission to the `TikTok for Business` Business Manager menu to the required users

## Setup the integration

In order to start the integration setup, go to `Merchant Tools > Social Channels > TikTok for Business` and start the process from there, by following the setup steps.

## Product Catalog sync

Once the integration between B2C Commerce and TikTok is setup, you can enable the product catalog sync by enabling the B2C Commerce job that sends the products to TikTok. In order to do so, go to the `Administration > Operations > Jobs` Business Manager menu, click on the `TikTok-ExportCatalog` job and schedule it.

# Snapchat integration

This folder also contains the Snapchat integration layer with Salesforce B2C Commerce.

## How this works?

The codebase is composed of two cartridges:

- `bm_socialchannels`: This cartridge contains the Business Manager controllers/UI logic that allow to provide a new Business Manager extention that the site admin can use to integrate with different social channels like TikTok, Snapchat, etc.
- `int_snapchat`: This cartridge contains the logic to integrate with Snapchat. It contains the service definitions as well as the logic to handle the customer object that stores the Snapchat details.

## How to install the integration?

In order to install this integration, you need to follow these steps:

1. Upload both `bm_socialchannels` and `int_snapchat` cartridges to your active code version
2. Add `bm_socialchannels` cartridge to the Business Manager cartridge path.
3. Add  `int_snapchat` to your site cartridge path. Snapchat catalog integration is follows the feed based integration approach hence you'll ned to install the corresponding social_feeds cartridges in order to export your site's catalog as social feeds before they're consumed by a social channel.
4. Zip the content of the `data` folder and import the zip file through the `Administration > Site Development > Site Import & Export` menu
5. Give permission to the `Snapchat Marketing API` Business Manager menu to the required users

## Setup the integration

In order to start the integration setup, go to `Merchant Tools > Social Channels > Snapchat Marketing API` and start the process from there, by following the setup steps.

## Product Catalog feed export

# Additional cartridges

- `app_storefront_social`: Install this cartridge in case you want to include multiple Pixels from different social channels in your storefront (i.e. TikTok pixel injection as well as Snapchat pixel one).

