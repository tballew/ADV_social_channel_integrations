Social Channels Extension is set of business manager cartridges enabling commerce cloud merchandizers to improve discoverability of products and increase traffic into commerce cloud storefronts. The cartridge enables customers to  
1) Launch direct integrations into social channels from within SFCC Business Manager  
2) Create a smart product feed to publish products into the social channel and 
3) Inject the social channel’s pixel into SFCC storefront for a particular site, 
4) Integrate orders from the social channels back into commerce cloud (once checkout becomes available)

## *Prerequisites*

This integration is comprised of a set of cartridges (social channels, social feeds and social checkout management) that need to be leveraged in case you want to integrate your site with different social channels in order to accomplish a complete social ad/selling/checkout experience. _*You need a preexisting Salesforce Commerce Cloud working site, catalog, checkout, etc in order to benefit from it*_. Use storefront-reference-architecture (https://github.com/SalesforceCommerceCloud/storefront-reference-architecture) and RefArch/RefArchGlobal (https://github.com/SalesforceCommerceCloud/storefrontdata) in case you don’t have any of those (or you want to test it from scratch) and follow these steps:


1. Clone social channels integrations (https://github.com/SalesforceCommerceCloud/social_channel_integrations) repository. This repository contains three folders
    1. social_feeds → Create social feeds directly from Business Manager: to be used by integrations that rely on a feeds based approach (i.e. Snapchat, this is *NOT* needed for TikTok Integration)
    2. social_channels → Business Manager Integration with several Social Channels (TikTok, Snapchat)
    3. social_checkout → Entry point (controller+hook+job) in order to place orders + query their status from social channels (In Progress)

Each of these folders have code (cartridges), data (xml files) as well as basic configuration files (different formats .js, .json, etc) required in order to achieve different levels of integration (i.e. feed-based, API based, with/without checkout, etc) with the supported social channels (TikTok, Snapchat, etc)

1. Follow the corresponding README files to upload the cartridges to your sandbox, import metadata and take any additional configuration steps

There are many available ways (https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges) to upload cartridge(s) to your sandbox:
You can use your favorite IDE with a dw.json file, your favourite uploader or with a WebDav client in order to deploy them to https://<your-instance>/on/demandware.servlet/webdav/Sites/Cartridges folder with a  WebDAV access key from BM (https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2Fcontent%2Fb2c_commerce%2Ftopics%2Fadmin%2Fb2c_access_keys_for_business_manager.html)

Remember that every folder in the social channels integrations (https://github.com/SalesforceCommerceCloud/social_channel_integrations) repository.has a README file with the included cartridges and their purpose:

    1. social_feeds → https://github.com/SalesforceCommerceCloud/social_channel_integrations/tree/main/social_feeds
    2. social_channels → https://github.com/SalesforceCommerceCloud/social_channel_integrations/tree/main/social_channels
    3. social_checkout → https://github.com/SalesforceCommerceCloud/social_channel_integrations/tree/main/social_checkout


## Integration with Tiktok

   Pre-setup on tiktok
        1. create a business user

        Follow https://www.tiktok.com/business/en-SG/apps/business-account

        2. create a business center account

        Follow https://business.tiktok.com/

        3. catalog

        Follow https://ads.tiktok.com/help/article?aid=10001005

        4. Ad Account & Pixel

        Follow https://ads.tiktok.com/help/article?aid=9663


## How does this work?

For integrating with TikTok for Ads, you only need 2 cartridges: bm_socialchannels, int_tiktok from social_channels folder (https://github.com/SalesforceCommerceCloud/social_channel_integrations/tree/main/social_channels)

* bm_socialchannels: This cartridge contains the Business Manager controllers/UI logic that allow to provide a new Business Manager extension that the site admin can use to integrate with different social channels like TikTok, Snapchat, etc.
* int_tiktok: This cartridge contains the logic to integrate with TikTok. It contains the service definitions, logic to handle the customer object that stores the TikTok details, and the job which allow to sync the B2C Commerce product catalog with TikTok.
* int_tiktok_pixel: This cartridge contains the server side event tracking for TikTok. It will quue the events into a custom object and call the TikTok event batch API to push the events to TikTok. In high traffic sites the job to call TikTok batch API should be more frequent to avoid filling up the custom objects. 

## How to install the integration?

In order to install this integration, you need to follow these steps:

1. Upload both bm_socialchannels and int_tiktok cartridges to your active code version
2. Add bm_socialchannels cartridge to the Business Manager cartridge path (Administration >  Sites >  Manage Sites > Business Manager - Settings)
3. Add int_tiktok to your site cartridge path (Administration >  Sites >  Manage Sites > <your site> - Settings) this is important as the export catalog job will call directly TikTok API
4. After updating both (BM and site) cartridge paths Zip the content of the data folder and import the zip file through the Administration > Site Development > Site Import & Export menu
5. Give permission to the TikTok for Business Business Manager menu to the required users

## Setup the integration

In order to start the integration setup, 

1) Go to Merchant Tools > Social Channels > TikTok for Business 
2) Accept Data Sharing Agreements

3) Fill ill in required API params 

   ### Salesforce B2C Commerce details ###

   a. API Client Id  <this is the commerce API client you setup in Account Manager>

   b. API Client Secret < this is the secret for the API client>

   c. Tenant Id <this is realm_instance eg:- zzte_047> 

   d.  Org Id <get it from Administration > Site Development > Salesforce Commerce API Settings. eg:- f_ecom_zzte_047>

   ### Tiktok Details ###

   Email - <email for the business user>
   Phone < Phone number of the business user>
   Country Code <region where the website is setup>
   WebSite URL <the url for the site>
   Industry Id <Industry for your site>

4) Click Launch

Note: you might need to log in first to your business TikTok account in the same machine in order to accept Commerce Cloud Connection to your business TikTok account
Log in first using Advertising on TikTok (https://ads.tiktok.com/i18n/login/) page

5) Select an account

6) Connect your account

7) Once logged in, the Tiktok business plugIn/Integration App will be loaded. Inside the integration app, 

   a. Connect to the chosen business center

   b. Connect to the ad account

   c. Connect to a Pixel

   d. Connect to a Catalog that is setup already on Tiktok

   e. Finish the setup

1. Click on “Start later”
2. You’ll be redirected to the Business Manager showing your Connected TikTok application details: Business Center Id and Pixel Id in case there’s any already created

Click on Manage your TikTok App to launch the PlugIn, from where you can create Ads

## Product Catalog sync

Once the integration between B2C Commerce and TikTok is setup, you can enable the product catalog sync by enabling the B2C Commerce job that sends the products to TikTok. In order to do so, go to the Administration > Operations > Jobs Business Manager menu, click on the TikTok-ExportCatalog job and schedule it.

1. Go to Administration > Jobs and search for TikTok-ExportCatalog Job

2. Execute or schedule it per desired schedule/frequency

3. Check export catalog details directly by clicking on Manage your TikTok App

4. On the Plug, goto the Catalog section to open the Catalog Manager in TikTok
and TikTok’s Catalog Manager

## *Shopper Activities Synchronization & Web Events Monitoring*

Sending shopper activities to TikTok enables you to track conversions, build custom audiences and optimize product discovery. 
*Click here* (https://ads.tiktok.com/help/article?aid=10010829) for instructions to embed the TikTok pixel into your site to send shopper activities into TikTok.

Once the TikTok pixel is injected into the site, make sure you are able to track attributed events to view Content, Add To Cart, Page view, Place Order on TIkTok, as shown below.

## *Server side event tracking*

The **int_tiktok_pixel** enables server side event tracking by queing the events in custom objects and leveraging [TikTok tracking batch api](https://ads.tiktok.com/marketing_api/docs?id=1740858565852225) to send the events to TikTok. 

Curently the following events are can be tracked:
+ ViewContent (Product Show)
+ AddToCart (Add to Cart) 
+ InitiateCheckout (Begin Checkout)
+ CompletePayment (Place Order)
    
The tracking can be enabled or disabled via custom object settings. Also you have to disable/enable tracking for specific events. 
    
***NOTE:*** Please make sure the job for the batch TikTok batch API has been enabled and scheduled, otherwise the events will fill up the custom objects. Default the ViewContent event is a real time API call.  

