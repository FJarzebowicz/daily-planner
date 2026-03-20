package com.dailyplanner.service;

import com.dailyplanner.dto.ThoughtDto;
import com.dailyplanner.entity.Day;
import com.dailyplanner.entity.Thought;
import com.dailyplanner.exception.DayClosedException;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.ThoughtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class ThoughtService {

    private final ThoughtRepository thoughtRepository;
    private final DayService dayService;

    public ThoughtService(ThoughtRepository thoughtRepository, DayService dayService) {
        this.thoughtRepository = thoughtRepository;
        this.dayService = dayService;
    }

    public List<ThoughtDto> getByDay(LocalDate date) {
        Day day = dayService.getOrCreateDay(date);
        return thoughtRepository.findByDayIdOrderByCreatedAtAsc(day.getId()).stream()
                .map(ThoughtDto::from).toList();
    }

    @Transactional
    public ThoughtDto create(LocalDate date, ThoughtDto dto) {
        Day day = dayService.getOrCreateDay(date);
        if (day.isClosed()) throw new DayClosedException();

        Thought thought = new Thought();
        thought.setDay(day);
        thought.setContent(dto.content());
        return ThoughtDto.from(thoughtRepository.save(thought));
    }

    @Transactional
    public void delete(Long id) {
        Thought thought = thoughtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thought not found: " + id));
        if (thought.getDay().isClosed()) throw new DayClosedException();
        thoughtRepository.delete(thought);
    }
}
