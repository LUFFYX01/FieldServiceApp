package com.KeyStone.Field.Exception;

public class InvalidWorkOrderStateException extends RuntimeException {

    public InvalidWorkOrderStateException(String message) {
        super(message);
    }
}