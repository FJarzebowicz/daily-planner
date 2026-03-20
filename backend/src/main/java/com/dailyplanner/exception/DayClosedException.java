package com.dailyplanner.exception;

public class DayClosedException extends RuntimeException {
    public DayClosedException() {
        super("Day is closed and cannot be modified");
    }
}
