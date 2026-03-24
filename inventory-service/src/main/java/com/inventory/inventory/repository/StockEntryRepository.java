package com.inventory.inventory.repository;

import com.inventory.inventory.model.StockEntry;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import java.util.UUID;

public interface StockEntryRepository extends ReactiveCrudRepository<StockEntry, UUID> {
}
