package com.dailyplanner.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ReorderRequest(
    @NotNull List<Long> taskIds
) {}
