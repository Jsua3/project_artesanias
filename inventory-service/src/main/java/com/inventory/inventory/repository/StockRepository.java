package com.inventory.inventory.repository;

import com.inventory.inventory.model.Stock;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import java.util.UUID;

public interface StockRepository extends ReactiveCrudRepository<Stock, UUID> {
}
