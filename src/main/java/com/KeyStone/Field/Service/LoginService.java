package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.LoginRequest;
import com.KeyStone.Field.DTO.LoginResponse;
import com.KeyStone.Field.Entity.User;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginService(AuthenticationManager authenticationManager,JwtService jwtService){
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    request.getEmail(),
                                    request.getPassword()
                            )
                    );

            User user = (User) authentication.getPrincipal();

            String token = jwtService.generateToken(user);

            return new LoginResponse(token, "Bearer");

        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
}

