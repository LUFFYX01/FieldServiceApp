package com.KeyStone.Field.Service;


import com.KeyStone.Field.DTO.CreateUserRequest;
import com.KeyStone.Field.DTO.UpdateUserRequest;
import com.KeyStone.Field.DTO.UserResponse;
import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Exception.DuplicateEmailException;
import com.KeyStone.Field.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.KeyStone.Field.Exception.UserNotFoundException;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException();
        }

        User user = new User();

        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setPassword(passwordEncoder.encode(request.getPassword()));


        User savedUser = userRepository.save(user);

        UserResponse response = new UserResponse();
        response.setUserName(savedUser.getUserName());
        response.setRole(savedUser.getRole());
        response.setId(savedUser.getId());
        response.setActive(true);
        response.setEmail(savedUser.getEmail());

        return response;


    }

    public List<UserResponse> getAllUsers(){


        List<User> users = userRepository.findAll();

        List<UserResponse> responseList = new ArrayList<>();

        for(User user : users){

            UserResponse response = new UserResponse(user.getId(),user.getUserName(),user.getEmail(),user.getRole(),user.getActive());
            responseList.add(response);
        }

        return responseList;

    }

    public UserResponse getUserById(Long id){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        return new UserResponse(
                user.getId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole(),
                user.getActive()

        );
    }

    public UserResponse updateUser(Long id , UpdateUserRequest request){
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        user.setEmail(request.getEmail());
        user.setUserName(request.getUserName());
        user.setRole(request.getRole());

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateEmailException();
        }

        User updatedUser = userRepository.save(user);

        UserResponse response = new UserResponse();
        response.setUserName(updatedUser.getUserName());
        response.setEmail(updatedUser.getEmail());
        response.setRole(updatedUser.getRole());
        response.setId(updatedUser.getId());
        response.setActive(updatedUser.getActive());

        return response;

    }

    public void deleteUser(Long id){

        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        userRepository.delete(user);
    }

}
