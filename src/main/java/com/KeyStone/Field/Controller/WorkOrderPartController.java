package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.WorkOrderPartResponse;
import com.KeyStone.Field.Service.WorkOrderPartService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workorders/{workOrderId}/parts")
public class WorkOrderPartController {

    private final WorkOrderPartService workOrderPartService;

    public WorkOrderPartController(
            WorkOrderPartService workOrderPartService) {

        this.workOrderPartService = workOrderPartService;
    }

    @PostMapping
    public WorkOrderPartResponse addPart(
            @PathVariable Long workOrderId,
            @Valid @RequestBody CreateWorkOrderPartRequest request) {

        return workOrderPartService.addPart(
                workOrderId,
                request
        );
    }

    @GetMapping
    public List<WorkOrderPartResponse> getPartsForWorkOrder(
            @PathVariable Long workOrderId) {

        return workOrderPartService.getPartsForWorkOrder(
                workOrderId
        );
    }
}