trigger ReturnOrderTrigger on ReturnOrder (after insert, after update) {
    ReturnOrderTriggerHandler.handleReturnRequest(trigger.new);
}