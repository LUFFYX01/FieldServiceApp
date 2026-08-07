package com.KeyStone.Field.Exception;

public class WorkOrderNotFoundException extends RuntimeException {

    public WorkOrderNotFoundException(Long id) {
        super("Work Order not found with id: " + id);
    }
}