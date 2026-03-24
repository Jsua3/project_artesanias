package com.inventory.inventory.service;

import com.inventory.inventory.dto.EntryRequest;
import com.inventory.inventory.dto.InventoryEvent;
import com.inventory.inventory.dto.MovementType;
import com.inventory.inventory.model.StockEntry;
import com.inventory.inventory.publisher.InventoryEventPublisher;
import com.inventory.inventory.repository.StockEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class EntryService {

    private final StockEntryRepository entryRepository;
    private final StockService stockService;
    private final InventoryEventPublisher eventPublisher;

    public EntryService(StockEntryRepository entryRepository, StockService stockService, InventoryEventPublisher eventPublisher) {
        this.entryRepository = entryRepository;
        this.stockService = stockService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Mono<StockEntry> createEntry(EntryRequest request, UUID performedBy) {
        if (request.quantity() <= 0) {
            return Mono.error(new IllegalArgumentException("Quantity must be greater than 0"));
        }

        StockEntry entry = new StockEntry(
                UUID.randomUUID(),
                request.productId(),
                request.quantity(),
                request.notes(),
                performedBy,
                LocalDateTime.now()
        );

        return entryRepository.save(entry)
                .flatMap(savedEntry -> stockService.updateStock(request.productId(), request.quantity())
                        .then(eventPublisher.publish(new InventoryEvent(
                                request.productId(),
                                request.quantity(),
                                MovementType.ENTRY,
                                performedBy,
                                LocalDateTime.now()
                        )))
                        .thenReturn(savedEntry));
    }
}
