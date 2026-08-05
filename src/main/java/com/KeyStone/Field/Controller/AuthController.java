package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateUserRequest;
import com.KeyStone.Field.DTO.LoginRequest;
import com.KeyStone.Field.DTO.LoginResponse;
import com.KeyStone.Field.DTO.UserResponse;
import com.KeyStone.Field.Service.LoginService;
import com.KeyStone.Field.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final LoginService loginService;
    private final UserService userService;

    public AuthController(LoginService loginService,
                          UserService userService) {
        this.loginService = loginService;
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {

        System.out.println(">>> Login controller reached <<<");

        return loginService.login(request);
    }
}

