package com.inventory.report.controller;

import com.inventory.report.model.MovementLog;
import com.inventory.report.model.StockSnapshot;
import com.inventory.report.service.ReportService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public Flux<StockSnapshot> getSummary(@RequestHeader("X-User-Role") String role) {
        validateAdmin(role);
        return reportService.getStockSummary();
    }

    @GetMapping("/history")
    public Flux<MovementLog> getHistory(@RequestHeader("X-User-Role") String role) {
        validateAdmin(role);
        return reportService.getMovementHistory();
    }

    @GetMapping("/alerts")
    public Flux<StockSnapshot> getAlerts(
            @RequestParam(defaultValue = "5") int threshold,
            @RequestHeader("X-User-Role") String role) {
        validateAdmin(role);
        return reportService.getLowStockAlerts(threshold);
    }

    private void validateAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN can access reports");
        }
    }
}
