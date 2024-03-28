trigger OrderTrigger on Order (after insert, after update) {
    if (Trigger.IsInsert) {
        OrderTriggerHandler.handleCancellationReason(trigger.new);
    }else if (Trigger.IsUpdate) {
        OrderTriggerHandler.handleCancellationReason(trigger.new);
    }
}