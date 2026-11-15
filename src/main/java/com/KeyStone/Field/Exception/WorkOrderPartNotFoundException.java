package com.KeyStone.Field.Exception;

public class WorkOrderPartNotFoundException extends RuntimeException {

    public WorkOrderPartNotFoundException(Long id) {
        super("Work order part with id " + id + " not found");
    }
}