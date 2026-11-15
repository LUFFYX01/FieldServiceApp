package com.KeyStone.Field.Controller;

import com.KeyStone.Field.DTO.CreateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.UpdateRequiredQuantityRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.WorkOrderPartResponse;
import com.KeyStone.Field.Service.WorkOrderPartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    @ResponseStatus(HttpStatus.CREATED)
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

    @PutMapping("/{workOrderPartId}")
    public WorkOrderPartResponse updateUsedQuantity(
            @PathVariable Long workOrderId,
            @PathVariable Long workOrderPartId,
            @Valid @RequestBody UpdateWorkOrderPartRequest request) {

        return workOrderPartService.updateUsedQuantity(
                workOrderId,
                workOrderPartId,
                request
        );
    }

    @PatchMapping("/{workOrderPartId}/required-quantity")
    public WorkOrderPartResponse updateRequiredQuantity(
            @PathVariable Long workOrderId,
            @PathVariable Long workOrderPartId,
            @Valid @RequestBody UpdateRequiredQuantityRequest request) {

        return workOrderPartService.updateRequiredQuantity(
                workOrderId,
                workOrderPartId,
                request
        );
    }

    @DeleteMapping("/{workOrderPartId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePart(
            @PathVariable Long workOrderId,
            @PathVariable Long workOrderPartId) {

        workOrderPartService.removePart(
                workOrderId,
                workOrderPartId
        );
    }
}
