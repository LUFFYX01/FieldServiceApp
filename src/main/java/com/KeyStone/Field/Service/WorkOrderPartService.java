package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.UpdateRequiredQuantityRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.WorkOrderPartResponse;
import com.KeyStone.Field.Entity.*;
import com.KeyStone.Field.Exception.*;
import com.KeyStone.Field.Repository.*;
import com.KeyStone.Field.Security.SecurityUtils;
import com.KeyStone.Field.enums.InventoryTransactionType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class WorkOrderPartService {

    private final WorkOrderPartRepository workOrderPartRepository;
    private final WorkOrderRepository workOrderRepository;
    private final PartRepository partRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final WorkOrderHistoryRepository historyRepository;

    public WorkOrderPartService(
            WorkOrderPartRepository workOrderPartRepository,
            WorkOrderRepository workOrderRepository,
            PartRepository partRepository,
            InventoryTransactionRepository inventoryTransactionRepository,
            WorkOrderHistoryRepository historyRepository) {

        this.workOrderPartRepository = workOrderPartRepository;
        this.workOrderRepository = workOrderRepository;
        this.partRepository = partRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.historyRepository = historyRepository;
    }

    private void checkWorkOrderAccess(WorkOrder workOrder) {
        if (SecurityUtils.isCurrentUserTechnician()) {
            User currentUser = SecurityUtils.getCurrentUser().orElse(null);
            if (currentUser != null) {
                if (workOrder.getAssignedTechnician() == null ||
                        !workOrder.getAssignedTechnician().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException("You do not have permission to access this work order");
                }
            }
        }
    }

    public WorkOrderPartResponse addPart(
            Long workOrderId,
            CreateWorkOrderPartRequest request) {

        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        checkWorkOrderAccess(workOrder);

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

        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(workOrder)
                .status(workOrder.getStatus())
                .description("Required part added: " + part.getName() + " (Qty: " + request.getRequiredQuantity() + ")")
                .build();
        historyRepository.save(history);

        return mapToResponse(saved);
    }

    public List<WorkOrderPartResponse> getPartsForWorkOrder(
            Long workOrderId) {

        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        checkWorkOrderAccess(workOrder);

        List<WorkOrderPart> workOrderParts =
                workOrderPartRepository.findByWorkOrder(workOrder);

        List<WorkOrderPartResponse> responseList = new ArrayList<>();
        for (WorkOrderPart workOrderPart : workOrderParts) {
            responseList.add(mapToResponse(workOrderPart));
        }

        return responseList;
    }

    @Transactional
    public WorkOrderPartResponse updateUsedQuantity(
            Long workOrderId,
            Long workOrderPartId,
            UpdateWorkOrderPartRequest request) {

        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        checkWorkOrderAccess(workOrder);

        WorkOrderPart workOrderPart =
                workOrderPartRepository.findById(workOrderPartId)
                        .orElseThrow(() ->
                                new WorkOrderPartNotFoundException(workOrderPartId));

        if (!workOrderPart.getWorkOrder().getId().equals(workOrderId)) {
            throw new InvalidPartUsageException(
                    "Work order part does not belong to this work order"
            );
        }

        Integer oldUsedQuantity = workOrderPart.getUsedQuantity();
        Integer newUsedQuantity = request.getUsedQuantity();

        if (newUsedQuantity == null || newUsedQuantity < 0) {
            throw new InvalidPartUsageException("Used quantity cannot be null or negative");
        }

        if (newUsedQuantity > workOrderPart.getRequiredQuantity()) {
            throw new InvalidPartUsageException(
                    "Used quantity cannot be greater than required quantity"
            );
        }

        int difference = newUsedQuantity - oldUsedQuantity;

        // Fetch part with pessimistic write lock for concurrent safety
        Part part = partRepository.findByIdWithLock(workOrderPart.getPart().getId())
                .orElse(workOrderPart.getPart());

        User currentUser = SecurityUtils.getCurrentUser().orElse(null);

        if (difference > 0) {
            if (part.getQuantity() < difference) {
                throw new InsufficientPartStockException(
                        part.getPartNumber()
                );
            }

            int prevStock = part.getQuantity();
            int newStock = prevStock - difference;
            part.setQuantity(newStock);
            partRepository.save(part);

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .part(part)
                    .transactionType(InventoryTransactionType.USAGE)
                    .quantityChanged(-difference)
                    .previousQuantity(prevStock)
                    .newQuantity(newStock)
                    .workOrder(workOrder)
                    .user(currentUser)
                    .reason("Used " + difference + " unit(s) on Work Order #" + workOrderId)
                    .build();
            inventoryTransactionRepository.save(transaction);

        } else if (difference < 0) {
            int restoreQty = Math.abs(difference);
            int prevStock = part.getQuantity();
            int newStock = prevStock + restoreQty;
            part.setQuantity(newStock);
            partRepository.save(part);

            InventoryTransaction transaction = InventoryTransaction.builder()
                    .part(part)
                    .transactionType(InventoryTransactionType.USAGE_RETURN)
                    .quantityChanged(restoreQty)
                    .previousQuantity(prevStock)
                    .newQuantity(newStock)
                    .workOrder(workOrder)
                    .user(currentUser)
                    .reason("Returned " + restoreQty + " unit(s) from Work Order #" + workOrderId)
                    .build();
            inventoryTransactionRepository.save(transaction);
        }

        workOrderPart.setUsedQuantity(newUsedQuantity);
        WorkOrderPart updatedWorkOrderPart = workOrderPartRepository.save(workOrderPart);

        return mapToResponse(updatedWorkOrderPart);
    }

    @Transactional
    public WorkOrderPartResponse updateRequiredQuantity(
            Long workOrderId,
            Long workOrderPartId,
            UpdateRequiredQuantityRequest request) {

        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        if (SecurityUtils.isCurrentUserTechnician()) {
            throw new AccessDeniedException("Technicians cannot modify required parts quantities");
        }

        WorkOrderPart workOrderPart =
                workOrderPartRepository.findById(workOrderPartId)
                        .orElseThrow(() ->
                                new WorkOrderPartNotFoundException(workOrderPartId));

        if (!workOrderPart.getWorkOrder().getId().equals(workOrderId)) {
            throw new InvalidPartUsageException(
                    "Work order part does not belong to this work order"
            );
        }

        if (request.getRequiredQuantity() < workOrderPart.getUsedQuantity()) {
            throw new InvalidPartUsageException(
                    "Required quantity cannot fall below already used quantity (" +
                            workOrderPart.getUsedQuantity() + ")"
            );
        }

        int oldRequired = workOrderPart.getRequiredQuantity();
        workOrderPart.setRequiredQuantity(request.getRequiredQuantity());
        WorkOrderPart saved = workOrderPartRepository.save(workOrderPart);

        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(workOrder)
                .status(workOrder.getStatus())
                .description("Part " + workOrderPart.getPart().getName() +
                        " required quantity changed from " + oldRequired +
                        " to " + request.getRequiredQuantity())
                .build();
        historyRepository.save(history);

        return mapToResponse(saved);
    }

    @Transactional
    public void removePart(Long workOrderId, Long workOrderPartId) {
        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        if (SecurityUtils.isCurrentUserTechnician()) {
            throw new AccessDeniedException("Technicians cannot remove parts from work orders");
        }

        WorkOrderPart workOrderPart =
                workOrderPartRepository.findById(workOrderPartId)
                        .orElseThrow(() ->
                                new WorkOrderPartNotFoundException(workOrderPartId));

        if (!workOrderPart.getWorkOrder().getId().equals(workOrderId)) {
            throw new InvalidPartUsageException(
                    "Work order part does not belong to this work order"
            );
        }

        // If any used quantity, restore to stock
        if (workOrderPart.getUsedQuantity() > 0) {
            Part part = partRepository.findByIdWithLock(workOrderPart.getPart().getId())
                    .orElse(workOrderPart.getPart());
            int returnQty = workOrderPart.getUsedQuantity();
            int prevStock = part.getQuantity();
            int newStock = prevStock + returnQty;
            part.setQuantity(newStock);
            partRepository.save(part);

            User currentUser = SecurityUtils.getCurrentUser().orElse(null);
            InventoryTransaction transaction = InventoryTransaction.builder()
                    .part(part)
                    .transactionType(InventoryTransactionType.USAGE_RETURN)
                    .quantityChanged(returnQty)
                    .previousQuantity(prevStock)
                    .newQuantity(newStock)
                    .workOrder(workOrder)
                    .user(currentUser)
                    .reason("Part removed from Work Order #" + workOrderId + "; restored " + returnQty + " unit(s)")
                    .build();
            inventoryTransactionRepository.save(transaction);
        }

        workOrderPartRepository.delete(workOrderPart);
    }

    private WorkOrderPartResponse mapToResponse(WorkOrderPart workOrderPart) {
        Part part = workOrderPart.getPart();
        BigDecimal unitPrice = part.getPrice() != null ? part.getPrice() : BigDecimal.ZERO;
        BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(workOrderPart.getUsedQuantity()));

        return WorkOrderPartResponse.builder()
                .id(workOrderPart.getId())
                .partId(part.getId())
                .partName(part.getName())
                .partNumber(part.getPartNumber())
                .requiredQuantity(workOrderPart.getRequiredQuantity())
                .usedQuantity(workOrderPart.getUsedQuantity())
                .unitPrice(unitPrice)
                .availableStock(part.getQuantity())
                .lineTotal(lineTotal)
                .build();
    }
}
