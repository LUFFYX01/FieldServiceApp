package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.ChangePasswordRequest;
import com.KeyStone.Field.DTO.CreateUserRequest;
import com.KeyStone.Field.DTO.UpdateUserRequest;
import com.KeyStone.Field.DTO.UserResponse;
import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Exception.DuplicateEmailException;
import com.KeyStone.Field.Exception.UserNotFoundException;
import com.KeyStone.Field.Repository.UserRepository;
import com.KeyStone.Field.Security.SecurityUtils;
import com.KeyStone.Field.enums.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException();
        }

        User user = new User();
        user.setUserName(request.getUserName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setActive(true);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserResponse> responseList = new ArrayList<>();
        for (User user : users) {
            responseList.add(mapToResponse(user));
        }
        return responseList;
    }

    public List<UserResponse> getUsersByRole(Role role) {
        List<User> users = userRepository.findByRole(role);
        List<UserResponse> responseList = new ArrayList<>();
        for (User user : users) {
            responseList.add(mapToResponse(user));
        }
        return responseList;
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateEmailException();
        }

        // Prevent deactivating or demoting the last active administrator
        if (user.getRole() == Role.ADMIN) {
            boolean changingRole = request.getRole() != Role.ADMIN;
            boolean deactivating = Boolean.FALSE.equals(request.getActive());

            if (changingRole || deactivating) {
                long activeAdminCount = userRepository.countByRoleAndActiveTrue(Role.ADMIN);
                if (activeAdminCount <= 1) {
                    throw new IllegalStateException("Cannot demote or deactivate the last remaining active administrator");
                }
            }
        }

        user.setEmail(request.getEmail());
        user.setUserName(request.getUserName());
        user.setRole(request.getRole());
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (user.getRole() == Role.ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndActiveTrue(Role.ADMIN);
            if (activeAdminCount <= 1) {
                throw new IllegalStateException("Cannot delete the last remaining active administrator");
            }
        }

        userRepository.delete(user);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .userName(user.getUserName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.getActive())
                .build();
    }
}
