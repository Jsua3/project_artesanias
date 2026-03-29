package com.inventory.inventory.service;

import com.inventory.inventory.dto.StockResponse;
import com.inventory.inventory.model.Stock;
import com.inventory.inventory.repository.StockRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.UUID;

@Service
public class StockService {

    private final StockRepository stockRepository;

    public StockService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    public Mono<StockResponse> getStockByProduct(UUID productId) {
        return stockRepository.findById(productId)
                .map(stock -> new StockResponse(stock.getProductId(), stock.getQuantity()))
                .defaultIfEmpty(new StockResponse(productId, 0));
    }

    public Flux<StockResponse> getAllStock() {
        return stockRepository.findAll()
                .map(stock -> new StockResponse(stock.getProductId(), stock.getQuantity()));
    }

    public Mono<Stock> updateStock(UUID productId, Integer change) {
        return stockRepository.findById(productId)
                .flatMap(stock -> {
                    int newQuantity = stock.getQuantity() + change;
                    if (newQuantity < 0) {
                        return Mono.error(new RuntimeException("Stock cannot be negative"));
                    }
                    stock.setQuantity(newQuantity);
                    stock.markExisting(); // Evita que R2DBC intente INSERT en vez de UPDATE
                    return stockRepository.save(stock);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    if (change < 0) {
                        return Mono.error(new RuntimeException("Stock cannot be negative"));
                    }
                    Stock newStock = new Stock(productId, change);
                    return stockRepository.save(newStock);
                }));
    }
}
