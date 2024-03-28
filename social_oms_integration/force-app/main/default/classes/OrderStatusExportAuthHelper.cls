public class OrderStatusExportAuthHelper {

    
	public HttpResponse getOauthTokenResponse(Order_Status_Update_Params__mdt authParams) {
		String payload =
			'grant_type=' +
			EncodingUtil.urlEncode(authParams.grant_type__c, 'UTF-8');

		Http http = new Http();
		HttpRequest request = new HttpRequest();
		HttpResponse response = new HttpResponse();

		String oAuthEndpoint = getOAuthEndPoint(authParams);
		system.debug('oAuthEndpoint'+oAuthEndpoint);
		request.setEndpoint(oAuthEndpoint);
		request.setMethod('POST');
        request.setHeader('x-dw-client-id', authParams.client_id__c);
		request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        Blob headerValue = Blob.valueOf(getAuthorizationHeader(authParams));
    	request.setHeader('Authorization','Basic '+EncodingUtil.base64Encode(headerValue));
		request.setBody(payload);

		try {
			response = http.send(request);
		} catch (CalloutException e) {
			System.debug('The following exception has occurred: ' + e.getMessage());
		}

		if (response.getStatusCode() != 200) {
			System.debug(
				'The status code returned was not expected: ' + response.getBody()
			);
			throw new CalloutException('OAuth Authentication failed');
		} else {
			System.debug(response.getBody());
			return response;
		}
	}
    
    //Send the order update to = SFCC
    public HttpResponse sendOrderUpdate(Order_Status_Update_Params__mdt params,String token,String orderNumber,String payload){
       	Http http = new Http();
		HttpRequest request = new HttpRequest();
        HttpResponse updResponse = new HttpResponse();
        String orderEndpoint = getOrderUpdateEndPoint(params,orderNumber);
        System.debug('Order Update End Point: '+orderEndpoint);
        
        try {
				request.setEndpoint(orderEndpoint);
				request.setMethod('PATCH');
				request.setHeader('Authorization','Bearer ' + token);
				request.setHeader('Content-Type', 'application/json');
				request.setBody(payload);

				updResponse = http.send(request);
        		System.debug('Update Response'+updResponse.getBody());
		} catch (Exception e) {
			System.debug('The following exception has occurred: ' + e.getMessage());
		}
        
        return updResponse;
        
    }
    
    //get Oauth Token                                         
    public String getOAuthToken(Order_Status_Update_Params__mdt oAuthParams){
        HttpResponse res = getOauthTokenResponse(oAuthParams);
        String token =  parseOauthTokenResponse(res.getBody());
        System.debug('token'+token);
        return token;
    }
    
    //Get the OAuth Info MetaData Parameters
    public Order_Status_Update_Params__mdt getOAuthConnInfo() {

		Order_Status_Update_Params__mdt upgCreds = runningInASandbox()
		? Order_Status_Update_Params__mdt.getInstance('Non_Prod')
		: Order_Status_Update_Params__mdt.getInstance('Prod');
		/*Logic to check if the execution context is a test class, if so then use the test metadata. 
		This is because it is not possible to create custom metadata records in the test class.*/
		if (Test.isRunningTest()) {
			return Order_Status_Update_Params__mdt.getInstance('Test_Class');
		}else {
			return upgCreds;
		}
	}
    
    public  Boolean runningInASandbox() {
		return [SELECT Id, IsSandbox FROM Organization LIMIT 1].IsSandbox;
	}
    
    public String parseOauthTokenResponse(String responseBody) {
		// Parse the JSON response
		Map<String, Object> parsedResponse = deserializeToken(responseBody);
		return (String) parsedResponse.get('access_token');
    }
            
            //deserialise response and return token
	public Map<String, Object> deserializeToken(String responseBody) {
		// use default parsing for everything we can.
		Map<String, Object> parsedResponse = new Map<String, Object>();
		system.debug('Token response: ' + responseBody);
		parsedResponse = (Map<String, Object>) JSON.deserializeUntyped(
			responseBody
		);
		return parsedResponse;
	}
    
    public String getAuthorizationHeader(Order_Status_Update_Params__mdt authParams){
       	String authHeader = authParams.username__c +':'+authParams.accesskey__c+':'+authParams.client_credential__c;
        system.debug('Authorization Header' + authHeader);
        return authHeader;
    }
    
    public String getOAuthEndPoint(Order_Status_Update_Params__mdt authParams){
      
       	String endPoint = authParams.endpoint__c +'client_id='+authParams.client_id__c;
        system.debug('Oauth Endpoint ' + endPoint);
        return endPoint;
    }
    
    public String getOrderUpdateEndPoint(Order_Status_Update_Params__mdt params,String OrderNumber){
        
        	String orderUpdateEndpoint = params.Order_Status_Endpoint__c+'/s/'+params.Site_Id__c+'/dw/shop/'+
                params.API_Version__c+'/orders/'+OrderNumber+'?client_id='+params.client_id__c;
        	System.debug('Order Update End Point'+orderUpdateEndpoint);
        	return orderUpdateEndpoint;
    }
    
   
    
}