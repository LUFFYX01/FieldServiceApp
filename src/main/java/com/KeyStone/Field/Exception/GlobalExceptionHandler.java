package com.KeyStone.Field.Exception;

import com.KeyStone.Field.DTO.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex){

        HttpStatus status = HttpStatus.NOT_FOUND;
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(status)
                .body(errorResponse);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex){
        HttpStatus status = HttpStatus.CONFLICT;
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .message(ex.getMessage())
                .build();

        return ResponseEntity.status(status)
                .body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception){
        HttpStatus status = HttpStatus.BAD_REQUEST;

        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            errors.put(
                    fieldError.getField(),
                    fieldError.getDefaultMessage()
            );
        }
        ErrorResponse errorResponse =ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .message("Validation failed")
                .errors(errors)
                .build();


        return ResponseEntity
                .status(status)
                .body(errorResponse);
    }
}
