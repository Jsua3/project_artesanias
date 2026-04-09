package com.inventory.catalog.repository;

import com.inventory.catalog.model.Artesano;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface ArtesanoRepository extends ReactiveCrudRepository<Artesano, UUID> {}
