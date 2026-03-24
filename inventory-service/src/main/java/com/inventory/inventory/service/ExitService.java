package com.inventory.inventory.service;

import com.inventory.inventory.dto.ExitRequest;
import com.inventory.inventory.dto.InventoryEvent;
import com.inventory.inventory.dto.MovementType;
import com.inventory.inventory.model.StockExit;
import com.inventory.inventory.publisher.InventoryEventPublisher;
import com.inventory.inventory.repository.StockExitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ExitService {

    private final StockExitRepository exitRepository;
    private final StockService stockService;
    private final InventoryEventPublisher eventPublisher;

    public ExitService(StockExitRepository exitRepository, StockService stockService, InventoryEventPublisher eventPublisher) {
        this.exitRepository = exitRepository;
        this.stockService = stockService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Mono<StockExit> createExit(ExitRequest request, UUID performedBy) {
        if (request.quantity() <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        StockExit exit = new StockExit(
                UUID.randomUUID(),
                request.productId(),
                request.quantity(),
                request.notes(),
                performedBy,
                LocalDateTime.now()
        );

        return stockService.updateStock(request.productId(), -request.quantity())
                .then(exitRepository.save(exit))
                .flatMap(savedExit -> eventPublisher.publish(new InventoryEvent(
                        request.productId(),
                        request.quantity(),
                        MovementType.EXIT,
                        performedBy,
                        LocalDateTime.now()
                )).thenReturn(savedExit));
    }
}
