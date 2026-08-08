package com.KeyStone.Field.Exception;

public class SiteNotFoundException extends RuntimeException {

    public SiteNotFoundException(Long id) {
        super("Site not found with id: " + id);
    }
}