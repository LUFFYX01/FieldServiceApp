package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateWorkOrderRequest;
import com.KeyStone.Field.DTO.WorkOrderResponse;
import com.KeyStone.Field.Service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workorders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping
    public WorkOrderResponse createWorkOrder(
            @Valid @RequestBody CreateWorkOrderRequest request) {

        return workOrderService.createWorkOrder(request);
    }
}