package com.KeyStone.Field.Exception;

public class PartNotFoundException
        extends RuntimeException {

    public PartNotFoundException(Long id) {
        super("Part not found with id: " + id);
    }
}