package com.inventory.report.repository;

import com.inventory.report.model.MovementLog;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import java.util.UUID;

public interface MovementLogRepository extends ReactiveCrudRepository<MovementLog, UUID> {
}
