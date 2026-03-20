package com.dailyplanner.controller;

import com.dailyplanner.dto.ChangePasswordRequest;
import com.dailyplanner.dto.UpdateProfileRequest;
import com.dailyplanner.dto.UserProfileDto;
import com.dailyplanner.security.SecurityUtil;
import com.dailyplanner.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public UserProfileDto getProfile() {
        return profileService.getProfile(SecurityUtil.getCurrentUserId());
    }

    @PutMapping
    public UserProfileDto updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(SecurityUtil.getCurrentUserId(), request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(SecurityUtil.getCurrentUserId(), request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount() {
        profileService.deleteAccount(SecurityUtil.getCurrentUserId());
    }
}
