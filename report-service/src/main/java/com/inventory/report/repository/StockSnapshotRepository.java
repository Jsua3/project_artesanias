package com.inventory.report.repository;

import com.inventory.report.model.StockSnapshot;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import java.util.UUID;

public interface StockSnapshotRepository extends ReactiveCrudRepository<StockSnapshot, UUID> {
}
