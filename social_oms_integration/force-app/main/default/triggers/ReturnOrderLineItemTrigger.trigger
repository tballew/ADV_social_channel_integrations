trigger ReturnOrderLineItemTrigger on ReturnOrderLineItem (after insert, after update) {
    ReturnOrderLineItemTriggerHandler.handleReturnRequest(trigger.new);
}