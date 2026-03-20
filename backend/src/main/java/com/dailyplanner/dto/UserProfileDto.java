package com.dailyplanner.dto;

import com.dailyplanner.entity.User;

public record UserProfileDto(
    Long id,
    String email,
    String displayName,
    String avatarUrl,
    String authProvider
) {
    public static UserProfileDto from(User user) {
        return new UserProfileDto(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getAvatarUrl(),
            user.getAuthProvider().name()
        );
    }
}
