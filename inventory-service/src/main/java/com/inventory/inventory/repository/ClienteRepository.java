package com.inventory.inventory.repository;

import com.inventory.inventory.model.Cliente;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface ClienteRepository extends ReactiveCrudRepository<Cliente, UUID> {}
