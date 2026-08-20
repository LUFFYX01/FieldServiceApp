package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.WorkOrderPartResponse;
import com.KeyStone.Field.Entity.Part;
import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.Entity.WorkOrderPart;
import com.KeyStone.Field.Exception.DuplicateWorkOrderPartException;
import com.KeyStone.Field.Exception.PartNotFoundException;
import com.KeyStone.Field.Exception.WorkOrderNotFoundException;
import com.KeyStone.Field.Repository.PartRepository;
import com.KeyStone.Field.Repository.WorkOrderPartRepository;
import com.KeyStone.Field.Repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WorkOrderPartService {

    private final WorkOrderPartRepository workOrderPartRepository;
    private final WorkOrderRepository workOrderRepository;
    private final PartRepository partRepository;

    public WorkOrderPartService(
            WorkOrderPartRepository workOrderPartRepository,
            WorkOrderRepository workOrderRepository,
            PartRepository partRepository) {

        this.workOrderPartRepository = workOrderPartRepository;
        this.workOrderRepository = workOrderRepository;
        this.partRepository = partRepository;
    }

    public WorkOrderPartResponse addPart(
            Long workOrderId,
            CreateWorkOrderPartRequest request) {

        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        Part part =
                partRepository.findById(request.getPartId())
                        .orElseThrow(() ->
                                new PartNotFoundException(request.getPartId()));

        if (workOrderPartRepository
                .findByWorkOrderAndPart(workOrder, part)
                .isPresent()) {

            throw new DuplicateWorkOrderPartException(
                    workOrderId,
                    part.getId()
            );
        }

        WorkOrderPart workOrderPart =
                WorkOrderPart.builder()
                        .workOrder(workOrder)
                        .part(part)
                        .requiredQuantity(request.getRequiredQuantity())
                        .usedQuantity(0)
                        .build();

        WorkOrderPart saved =
                workOrderPartRepository.save(workOrderPart);

        return mapToResponse(saved);
    }

    public List<WorkOrderPartResponse> getPartsForWorkOrder(
            Long workOrderId) {

        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        List<WorkOrderPart> workOrderParts =
                workOrderPartRepository.findByWorkOrder(workOrder);

        List<WorkOrderPartResponse> responseList =
                new ArrayList<>();

        for (WorkOrderPart workOrderPart : workOrderParts) {
            responseList.add(
                    mapToResponse(workOrderPart)
            );
        }

        return responseList;
    }

    private WorkOrderPartResponse mapToResponse(
            WorkOrderPart workOrderPart) {

        return WorkOrderPartResponse.builder()
                .id(workOrderPart.getId())
                .partId(workOrderPart.getPart().getId())
                .partName(workOrderPart.getPart().getName())
                .partNumber(workOrderPart.getPart().getPartNumber())
                .requiredQuantity(
                        workOrderPart.getRequiredQuantity())
                .usedQuantity(
                        workOrderPart.getUsedQuantity())
                .build();
    }
}