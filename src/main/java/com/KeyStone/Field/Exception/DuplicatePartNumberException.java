package com.KeyStone.Field.Exception;

public class DuplicatePartNumberException
        extends RuntimeException {

    public DuplicatePartNumberException(
            String partNumber) {

        super(
                "Part with part number "
                        + partNumber
                        + " already exists"
        );
    }
}