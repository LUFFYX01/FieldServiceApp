package com.KeyStone.Field.Exception;

public class DuplicateEmailException extends RuntimeException{
    public DuplicateEmailException(){
        super("This Email Already Exists. Enter another email.");
    }
}
