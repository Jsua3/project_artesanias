package com.inventory.report.listener;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.report.dto.InventoryEvent;
import com.inventory.report.model.MovementLog;
import com.inventory.report.model.StockSnapshot;
import com.inventory.report.repository.MovementLogRepository;
import com.inventory.report.repository.StockSnapshotRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class InventoryEventListener {

    private final MovementLogRepository movementLogRepository;
    private final StockSnapshotRepository stockSnapshotRepository;
    private final ObjectMapper objectMapper;

    public InventoryEventListener(MovementLogRepository movementLogRepository,
                                  StockSnapshotRepository stockSnapshotRepository,
                                  ObjectMapper objectMapper) {
        this.movementLogRepository = movementLogRepository;
        this.stockSnapshotRepository = stockSnapshotRepository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "inventory-events", groupId = "report-service-group")
    public void handleInventoryEvent(String message) {
        try {
            InventoryEvent event = objectMapper.readValue(message, InventoryEvent.class);
            processEvent(event);
        } catch (JsonProcessingException e) {
            System.err.println("Error deserializing event: " + e.getMessage());
        }
    }

    private void processEvent(InventoryEvent event) {
        MovementLog log = new MovementLog(
                UUID.randomUUID(),
                event.productId(),
                event.quantity(),
                event.type(),
                event.performedBy(),
                event.timestamp()
        );

        movementLogRepository.save(log)
                .then(stockSnapshotRepository.findById(event.productId())
                        .flatMap(snapshot -> {
                            int newQuantity = event.type().equals("ENTRY") 
                                    ? snapshot.getCurrentQuantity() + event.quantity() 
                                    : snapshot.getCurrentQuantity() - event.quantity();
                            snapshot.setCurrentQuantity(newQuantity);
                            snapshot.setLastUpdated(LocalDateTime.now());
                            return stockSnapshotRepository.save(snapshot);
                        })
                        .switchIfEmpty(stockSnapshotRepository.save(new StockSnapshot(
                                event.productId(),
                                event.type().equals("ENTRY") ? event.quantity() : -event.quantity(),
                                LocalDateTime.now()
                        ))))
                .subscribe();
    }
}
