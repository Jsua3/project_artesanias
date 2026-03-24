package com.inventory.inventory.repository;

import com.inventory.inventory.model.StockExit;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import java.util.UUID;

public interface StockExitRepository extends ReactiveCrudRepository<StockExit, UUID> {
}
