package com.inventory.auth.repository;

import com.inventory.auth.model.UserAccount;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserAccountRepository extends ReactiveCrudRepository<UserAccount, UUID> {
    Mono<UserAccount> findByUsername(String username);
}
