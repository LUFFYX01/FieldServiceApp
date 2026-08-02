package com.KeyStone.Field.Controller;


import com.KeyStone.Field.DTO.CreateUserRequest;
import com.KeyStone.Field.DTO.UpdateUserRequest;
import com.KeyStone.Field.DTO.UserResponse;
import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request){

        return userService.createUser(request);
    }

    @GetMapping
    public List<UserResponse> getAllUsers(){
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id){
        return userService.getUserById(id);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser
            (@PathVariable Long id,
             @Valid
             @RequestBody UpdateUserRequest request){
        return userService.updateUser(id,request);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id){
        userService.deleteUser(id);
    }
}
