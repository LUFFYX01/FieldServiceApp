package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.AssignTechnicianRequest;
import com.KeyStone.Field.DTO.CreateWorkOrderRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderRequest;
import com.KeyStone.Field.DTO.WorkOrderResponse;
import com.KeyStone.Field.Service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping
    public List<WorkOrderResponse> getAllWorkOrders() {
        return workOrderService.getAllWorkOrders();
    }

    @GetMapping("/{id}")
    public WorkOrderResponse getWorkOrderById(@PathVariable Long id) {
        return workOrderService.getWorkOrderById(id);
    }

    @PutMapping("/{id}")
    public WorkOrderResponse updateWorkOrder(
            @PathVariable Long id,
            @RequestBody UpdateWorkOrderRequest request) {

        return workOrderService.updateWorkOrder(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteWorkOrder(@PathVariable Long id) {
        workOrderService.deleteWorkOrder(id);
    }

    @PatchMapping("/{id}/assign")
    public WorkOrderResponse assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTechnicianRequest request) {

        return workOrderService.assignTechnician(id, request);
    }
}