package com.inventory.catalog.repository;

import com.inventory.catalog.model.Category;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface CategoryRepository extends ReactiveCrudRepository<Category, UUID> {
}
