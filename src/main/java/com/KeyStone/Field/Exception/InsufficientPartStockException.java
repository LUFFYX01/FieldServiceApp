package com.KeyStone.Field.Exception;

public class InsufficientPartStockException extends RuntimeException {

    public InsufficientPartStockException(String partNumber) {
        super("Insufficient inventory for part " + partNumber);
    }
}