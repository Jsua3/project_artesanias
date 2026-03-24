package com.inventory.inventory.controller;

import com.inventory.inventory.dto.ExitRequest;
import com.inventory.inventory.model.StockExit;
import com.inventory.inventory.service.ExitService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.UUID;

@RestController
@RequestMapping("/api/exits")
public class ExitController {

    private final ExitService exitService;

    public ExitController(ExitService exitService) {
        this.exitService = exitService;
    }

    @PostMapping
    public Mono<StockExit> create(
            @RequestBody ExitRequest request,
            @RequestHeader("X-User-Id") String userId) {
        return exitService.createExit(request, UUID.fromString(userId));
    }
}
