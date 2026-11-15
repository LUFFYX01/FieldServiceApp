package com.KeyStone.Field.Exception;

public class DuplicateWorkOrderPartException extends RuntimeException {

    public DuplicateWorkOrderPartException(
            Long workOrderId,
            Long partId) {

        super(
                "Part with id " + partId
                        + " is already added to work order "
                        + workOrderId
        );
    }
}