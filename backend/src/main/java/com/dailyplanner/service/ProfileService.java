package com.dailyplanner.service;

import com.dailyplanner.dto.ChangePasswordRequest;
import com.dailyplanner.dto.UpdateProfileRequest;
import com.dailyplanner.dto.UserProfileDto;
import com.dailyplanner.entity.AuthProvider;
import com.dailyplanner.entity.User;
import com.dailyplanner.repository.RefreshTokenRepository;
import com.dailyplanner.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserProfileDto.from(user);
    }

    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        return UserProfileDto.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getAuthProvider() != AuthProvider.LOCAL || user.getPassword() == null) {
            throw new IllegalArgumentException("Cannot change password for Google accounts");
        }

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Invalidate all refresh tokens
        refreshTokenRepository.deleteByUserId(userId);
    }

    @Transactional
    public void deleteAccount(Long userId) {
        // CASCADE delete handles all related data
        userRepository.deleteById(userId);
    }
}
