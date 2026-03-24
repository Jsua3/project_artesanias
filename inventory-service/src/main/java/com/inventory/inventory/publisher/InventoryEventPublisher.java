package com.inventory.inventory.publisher;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.inventory.dto.InventoryEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class InventoryEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public InventoryEventPublisher(KafkaTemplate<String, String> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public Mono<Void> publish(InventoryEvent event) {
        return Mono.fromRunnable(() -> {
            try {
                String message = objectMapper.writeValueAsString(event);
                kafkaTemplate.send("inventory-events", event.productId().toString(), message);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error serializing InventoryEvent", e);
            }
        }).then();
    }
}
