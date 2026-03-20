package com.dailyplanner.service;

import com.dailyplanner.dto.RecurringEventDto;
import com.dailyplanner.entity.Day;
import com.dailyplanner.entity.RecurringEvent;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.DayRepository;
import com.dailyplanner.repository.RecurringEventRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RecurringEventService {

    private final RecurringEventRepository repository;
    private final DayService dayService;
    private final DayRepository dayRepository;

    public RecurringEventService(RecurringEventRepository repository, DayService dayService, DayRepository dayRepository) {
        this.repository = repository;
        this.dayService = dayService;
        this.dayRepository = dayRepository;
    }

    public List<RecurringEventDto> getByDay(LocalDate date) {
        Day day = dayService.getOrCreateDay(date);
        return repository.findByDayIdOrderByStartTimeAsc(day.getId()).stream()
                .map(RecurringEventDto::from).toList();
    }

    @Transactional
    public RecurringEventDto create(LocalDate date, RecurringEventDto dto) {
        Day day = dayService.getOrCreateDay(date);
        RecurringEvent event = new RecurringEvent();
        event.setDay(day);
        event.setName(dto.name());
        event.setStartTime(dto.startTime());
        event.setEndTime(dto.endTime());
        event.setActive(true);
        return RecurringEventDto.from(repository.save(event));
    }

    @Transactional
    public void delete(Long id) {
        RecurringEvent event = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring event not found: " + id));
        Long userId = SecurityUtil.getCurrentUserId();
        if (!event.getDay().getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Recurring event not found: " + id);
        }
        repository.delete(event);
    }

    @Transactional
    public List<RecurringEventDto> copyFromPreviousDay(LocalDate date) {
        User user = SecurityUtil.getCurrentUser();
        LocalDate prevDate = date.minusDays(1);
        Day currentDay = dayService.getOrCreateDay(date);

        return dayRepository.findByUserIdAndDate(user.getId(), prevDate).map(prevDay -> {
            List<RecurringEvent> prevEvents = repository.findByDayIdOrderByStartTimeAsc(prevDay.getId());
            for (RecurringEvent src : prevEvents) {
                RecurringEvent copy = new RecurringEvent();
                copy.setDay(currentDay);
                copy.setName(src.getName());
                copy.setStartTime(src.getStartTime());
                copy.setEndTime(src.getEndTime());
                copy.setActive(src.isActive());
                repository.save(copy);
            }
            return repository.findByDayIdOrderByStartTimeAsc(currentDay.getId()).stream()
                    .map(RecurringEventDto::from).toList();
        }).orElse(repository.findByDayIdOrderByStartTimeAsc(currentDay.getId()).stream()
                .map(RecurringEventDto::from).toList());
    }
}
