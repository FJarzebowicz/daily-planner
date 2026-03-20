package com.dailyplanner.service;

import com.dailyplanner.dto.*;
import com.dailyplanner.entity.AuthProvider;
import com.dailyplanner.entity.RefreshToken;
import com.dailyplanner.entity.User;
import com.dailyplanner.repository.RefreshTokenRepository;
import com.dailyplanner.repository.UserRepository;
import com.dailyplanner.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        user.setAuthProvider(AuthProvider.LOCAL);
        user = userRepository.save(user);

        return createAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (user.getAuthProvider() != AuthProvider.LOCAL || user.getPassword() == null) {
            throw new IllegalArgumentException("This account uses Google login");
        }

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        return createAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new IllegalArgumentException("Refresh token expired");
        }

        // Rotate refresh token
        refreshTokenRepository.delete(stored);
        return createAuthResponse(stored.getUser());
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);
    }

    @Transactional
    public AuthResponse loginOrCreateGoogleUser(String email, String name, String avatarUrl) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setDisplayName(name != null ? name : email.split("@")[0]);
            user.setAvatarUrl(avatarUrl);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setEmailVerified(true);
            user = userRepository.save(user);
        } else if (user.getAuthProvider() != AuthProvider.GOOGLE) {
            throw new IllegalArgumentException("This email is registered with a different method");
        } else {
            if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
            user = userRepository.save(user);
        }

        return createAuthResponse(user);
    }

    private AuthResponse createAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshTokenStr = jwtUtil.generateRefreshToken(user.getId());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(refreshTokenStr);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshTokenExpMs() / 1000));
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshTokenStr, UserProfileDto.from(user));
    }
}
