package com.inventory.auth.repository;

import com.inventory.auth.model.UserAccount;
import com.inventory.auth.model.ApprovalStatus;
import com.inventory.auth.model.UserRole;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface UserAccountRepository extends ReactiveCrudRepository<UserAccount, UUID> {
    Mono<UserAccount> findByUsername(String username);
    Mono<Boolean> existsByUsername(String username);
    Flux<UserAccount> findAllByRoleAndApprovalStatus(UserRole role, ApprovalStatus approvalStatus);
}
