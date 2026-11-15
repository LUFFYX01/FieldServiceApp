package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.WorkOrderHistoryResponse;
import com.KeyStone.Field.Service.WorkOrderHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workorders")
public class WorkOrderHistoryController {

    private final WorkOrderHistoryService historyService;

    public WorkOrderHistoryController(
            WorkOrderHistoryService historyService) {

        this.historyService = historyService;
    }

    @GetMapping("/{workOrderId}/history")
    public List<WorkOrderHistoryResponse> getHistory(
            @PathVariable Long workOrderId) {

        return historyService.getHistory(workOrderId);
    }
}