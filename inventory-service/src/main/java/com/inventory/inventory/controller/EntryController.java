package com.inventory.inventory.controller;

import com.inventory.inventory.dto.EntryRequest;
import com.inventory.inventory.model.StockEntry;
import com.inventory.inventory.service.EntryService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.UUID;

@RestController
@RequestMapping("/api/entries")
public class EntryController {

    private final EntryService entryService;

    public EntryController(EntryService entryService) {
        this.entryService = entryService;
    }

    @PostMapping
    public Mono<StockEntry> create(
            @RequestBody EntryRequest request,
            @RequestHeader("X-User-Id") String userId) {
        return entryService.createEntry(request, UUID.fromString(userId));
    }
}
