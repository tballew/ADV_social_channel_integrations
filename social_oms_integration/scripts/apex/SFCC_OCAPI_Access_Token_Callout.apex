/*
    adjust boolean value to test with hard-coded values or via AuthHelper / custom metadata values
        true = use custom metadata values
        false = use hard-coded values below, replace example values with your own values
 */
Boolean useCustomMetadataValues = true;

if (useCustomMetadataValues) {
    OrderStatusExportAuthHelper authHelper = new OrderStatusExportAuthHelper();
    Order_Status_Update_Params__mdt params = new Order_Status_Update_Params__mdt();

    String orderStatusInstanceName = authHelper.runningInASandbox() ? 'Non_Prod' : 'Prod';
    System.debug('Using custom metadata values based on instance: "' + orderStatusInstanceName + '"');

    params = authHelper.getOAuthConnInfo();
    String token = authHelper.getOAuthToken(params);
    System.debug('OAUTH TOKEN: ' + token);
} else {
    /*
        example values to use for custom metadata.
        Replace the following variables with your own values
            - sfccHost
            - clientId -> your OCAPI Client ID
            - clientSecret -> your OCAPI Client Secret
            - username -> Business Manager username
            - accessKey -> Business Manager "Agent User Login and OCAPI" access key
    */
    String sfccHost = 'https://abcd-001.dx.commercecloud.salesforce.com';
    String clientId = 'ocapi_client_id'; // client_id
    String clientSecret = 'ocapi_client_secret'; // client_credential__c
    String username = 'admin@salesforce.com'; // username
    String accessKey = 'biz_mngr_agent_user_login_and_ocapi_access_key'; // accesskey

    String authHeader = username + ':' + accessKey + ':' + clientSecret;
    String authBase64 = EncodingUtil.base64Encode(Blob.valueOf(authHeader));
    String oAuthEndpoint = sfccHost + '/dw/oauth2/access_token?'; // endpoint, OCAPI access token endpoint
    String endPoint = oAuthEndpoint + 'client_id=' + clientId;
    String grantType = 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken';
    String payload = 'grant_type=' + EncodingUtil.urlEncode(grantType, 'UTF-8');

    System.debug('testing using hard-coded values');
    System.debug('Oauth Endpoint: ' + oAuthEndpoint);
    System.debug('Authorization Header: ' + authBase64);

    Http http = new Http();
    HttpRequest request = new HttpRequest();
    HttpResponse response = new HttpResponse();

    request.setEndpoint(endPoint);
    request.setMethod('POST');
    request.setHeader('x-dw-client-id', clientId);
    request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.setHeader('Authorization','Basic ' + authBase64);
    request.setBody(payload);

    try {
        response = http.send(request);
    } catch (CalloutException e) {
        System.debug('The following exception has occurred: ' + e.getMessage());
    }

    if (response.getStatusCode() != 200) {
        System.debug('The status code returned was not expected: ' + response.getBody());
    } else {
        System.debug(response.getBody());
    }
}
