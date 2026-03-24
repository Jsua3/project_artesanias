package com.inventory.report.service;

import com.inventory.report.model.MovementLog;
import com.inventory.report.model.StockSnapshot;
import com.inventory.report.repository.MovementLogRepository;
import com.inventory.report.repository.StockSnapshotRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class ReportService {

    private final MovementLogRepository movementLogRepository;
    private final StockSnapshotRepository stockSnapshotRepository;

    public ReportService(MovementLogRepository movementLogRepository,
                         StockSnapshotRepository stockSnapshotRepository) {
        this.movementLogRepository = movementLogRepository;
        this.stockSnapshotRepository = stockSnapshotRepository;
    }

    public Flux<StockSnapshot> getStockSummary() {
        return stockSnapshotRepository.findAll();
    }

    public Flux<MovementLog> getMovementHistory() {
        return movementLogRepository.findAll();
    }

    public Flux<StockSnapshot> getLowStockAlerts(int threshold) {
        return stockSnapshotRepository.findAll()
                .filter(snapshot -> snapshot.getCurrentQuantity() <= threshold);
    }
}
