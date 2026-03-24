package com.inventory.inventory.controller;

import com.inventory.inventory.dto.StockResponse;
import com.inventory.inventory.service.StockService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
public class StockController {

    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping
    public Flux<StockResponse> getAll() {
        return stockService.getAllStock();
    }

    @GetMapping("/{productId}")
    public Mono<StockResponse> getByProduct(@PathVariable UUID productId) {
        return stockService.getStockByProduct(productId);
    }
}
