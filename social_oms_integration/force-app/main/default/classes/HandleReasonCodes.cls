public class HandleReasonCodes {

    public static List<String> instagramCodes = new List<String>{'IG_CUSTOMER_REQUEST', 'IG_FRAUD','IG_PAYMENT_DECLINED','IG_SUPPORT','IG_AUTOCANCEL','IG_MERCHANT_INVENTORY','IG_CUSTOMER_REQUEST_VIA_MERCHANT','IG_OTHER'};
    @future (callout=true)
    public static void updatePicklistFieldInstagram()
    {
        MetadataService.MetadataPort service = createService();
        MetadataService.StandardValueSet sv =
        (MetadataService.StandardValueSet) service.readMetadata('StandardValueSet',
            new String[] { 'OrderItemSummaryChgRsn' }).getRecords()[0];
        List<MetadataService.StandardValue> svList = new list<MetadataService.StandardValue>();
        for (String code : instagramCodes) {
            if (!JSON.serialize(sv.standardValue).Contains(code)) {
                MetadataService.StandardValue svCode = new MetadataService.StandardValue();
                svCode.fullName = code;
                svCode.default_x=false;
                svCode.isActive=true;
                svCode.label = code;
                svList.add(svCode);
            }
        }
        sv.standardValue.addAll(svList);
        List<MetadataService.SaveResult> results =
            service.updateMetadata(
                new MetadataService.Metadata[] { sv });
        List<Reason_Code_Settings__mdt> metaList = [SELECT MasterLabel, DeveloperName,TikTok__c, Instagram__c FROM Reason_Code_Settings__mdt];

        Metadata.CustomMetadata mdata = new Metadata.CustomMetadata();
        mdata.fullName = 'Reason_Code_Settings__mdt.'+metaList[0].DeveloperName;
        mdata.label = metaList[0].MasterLabel;
        

        Metadata.CustomMetadataValue instance = new Metadata.CustomMetadataValue();
        instance.field = 'Instagram__c';
        instance.value = True;
        

        mdata.values.add(instance);
        

        Metadata.DeployContainer container = new Metadata.DeployContainer();
        container.addMetadata(mdata);
        

        Metadata.Operations.enqueueDeployment(container, null);
    }

    public static MetadataService.MetadataPort createService()
    {
        MetadataService.MetadataPort service = new MetadataService.MetadataPort();
        service.SessionHeader = new MetadataService.SessionHeader_element();
        service.SessionHeader.sessionId = UserInfo.getSessionId();
        return service;
    }
}
