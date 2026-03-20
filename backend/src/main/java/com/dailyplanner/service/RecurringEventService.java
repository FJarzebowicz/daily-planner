package com.dailyplanner.service;

import com.dailyplanner.dto.RecurringEventDto;
import com.dailyplanner.entity.RecurringEvent;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.RecurringEventRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecurringEventService {

    private final RecurringEventRepository repository;

    public RecurringEventService(RecurringEventRepository repository) {
        this.repository = repository;
    }

    public List<RecurringEventDto> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return repository.findByUserIdOrderByStartTimeAsc(userId).stream()
                .map(RecurringEventDto::from).toList();
    }

    @Transactional
    public RecurringEventDto create(RecurringEventDto dto) {
        User user = SecurityUtil.getCurrentUser();
        RecurringEvent event = new RecurringEvent();
        event.setUser(user);
        event.setName(dto.name());
        event.setStartTime(dto.startTime());
        event.setEndTime(dto.endTime());
        event.setActive(true);
        return RecurringEventDto.from(repository.save(event));
    }

    @Transactional
    public RecurringEventDto update(Long id, RecurringEventDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        RecurringEvent event = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring event not found: " + id));
        if (dto.name() != null) event.setName(dto.name());
        if (dto.startTime() != null) event.setStartTime(dto.startTime());
        if (dto.endTime() != null) event.setEndTime(dto.endTime());
        event.setActive(dto.active());
        return RecurringEventDto.from(repository.save(event));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Recurring event not found: " + id);
        }
        repository.deleteByIdAndUserId(id, userId);
    }
}
