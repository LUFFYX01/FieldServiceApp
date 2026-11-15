package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreatePartRequest;
import com.KeyStone.Field.DTO.InventoryTransactionResponse;
import com.KeyStone.Field.DTO.PartResponse;
import com.KeyStone.Field.DTO.StockAdjustmentRequest;
import com.KeyStone.Field.DTO.UpdatePartRequest;
import com.KeyStone.Field.Entity.InventoryTransaction;
import com.KeyStone.Field.Entity.Part;
import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Exception.DuplicatePartNumberException;
import com.KeyStone.Field.Exception.PartNotFoundException;
import com.KeyStone.Field.Repository.InventoryTransactionRepository;
import com.KeyStone.Field.Repository.PartRepository;
import com.KeyStone.Field.Repository.WorkOrderPartRepository;
import com.KeyStone.Field.Security.SecurityUtils;
import com.KeyStone.Field.enums.InventoryTransactionType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PartService {

    private final PartRepository partRepository;
    private final WorkOrderPartRepository workOrderPartRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    public PartService(PartRepository partRepository,
                       WorkOrderPartRepository workOrderPartRepository,
                       InventoryTransactionRepository inventoryTransactionRepository) {
        this.partRepository = partRepository;
        this.workOrderPartRepository = workOrderPartRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
    }

    @Transactional
    public PartResponse createPart(CreatePartRequest request) {
        if (partRepository.existsByPartNumber(request.getPartNumber())) {
            throw new DuplicatePartNumberException(request.getPartNumber());
        }

        Part part = new Part();
        part.setName(request.getName());
        part.setPartNumber(request.getPartNumber());
        part.setDescription(request.getDescription());
        part.setQuantity(request.getQuantity());
        part.setPrice(request.getPrice());
        part.setActive(true);
        part.setLowStockThreshold(
                request.getLowStockThreshold() != null ? request.getLowStockThreshold() : 5
        );

        Part savedPart = partRepository.save(part);

        // Record initial inventory transaction if quantity > 0
        if (request.getQuantity() > 0) {
            User currentUser = SecurityUtils.getCurrentUser().orElse(null);
            InventoryTransaction tx = InventoryTransaction.builder()
                    .part(savedPart)
                    .transactionType(InventoryTransactionType.RESTOCK)
                    .quantityChanged(request.getQuantity())
                    .previousQuantity(0)
                    .newQuantity(request.getQuantity())
                    .user(currentUser)
                    .reason("Initial stock on part creation")
                    .build();
            inventoryTransactionRepository.save(tx);
        }

        return mapToResponse(savedPart);
    }

    public List<PartResponse> getAllParts() {
        List<Part> parts = partRepository.findAll();
        List<PartResponse> responseList = new ArrayList<>();
        for (Part part : parts) {
            responseList.add(mapToResponse(part));
        }
        return responseList;
    }

    public List<PartResponse> getActiveParts() {
        List<Part> parts = partRepository.findByActiveTrue();
        List<PartResponse> responseList = new ArrayList<>();
        for (Part part : parts) {
            responseList.add(mapToResponse(part));
        }
        return responseList;
    }

    public List<PartResponse> searchParts(String query) {
        List<Part> parts = (query == null || query.isBlank())
                ? partRepository.findAll()
                : partRepository.findByNameContainingIgnoreCaseOrPartNumberContainingIgnoreCase(query, query);

        List<PartResponse> responseList = new ArrayList<>();
        for (Part part : parts) {
            responseList.add(mapToResponse(part));
        }
        return responseList;
    }

    public PartResponse getPartById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new PartNotFoundException(id));
        return mapToResponse(part);
    }

    @Transactional
    public PartResponse updatePart(Long id, UpdatePartRequest request) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new PartNotFoundException(id));

        if (partRepository.existsByPartNumber(request.getPartNumber())
                && !part.getPartNumber().equals(request.getPartNumber())) {
            throw new DuplicatePartNumberException(request.getPartNumber());
        }

        int previousQuantity = part.getQuantity();

        part.setName(request.getName());
        part.setPartNumber(request.getPartNumber());
        part.setDescription(request.getDescription());
        part.setQuantity(request.getQuantity());
        part.setPrice(request.getPrice());
        part.setActive(request.getActive());
        if (request.getLowStockThreshold() != null) {
            part.setLowStockThreshold(request.getLowStockThreshold());
        }

        Part updatedPart = partRepository.save(part);

        // If quantity changed directly in update, log adjustment
        int diff = request.getQuantity() - previousQuantity;
        if (diff != 0) {
            User currentUser = SecurityUtils.getCurrentUser().orElse(null);
            InventoryTransaction tx = InventoryTransaction.builder()
                    .part(updatedPart)
                    .transactionType(diff > 0 ? InventoryTransactionType.RESTOCK : InventoryTransactionType.ADJUSTMENT)
                    .quantityChanged(diff)
                    .previousQuantity(previousQuantity)
                    .newQuantity(request.getQuantity())
                    .user(currentUser)
                    .reason("Stock adjusted during part details update")
                    .build();
            inventoryTransactionRepository.save(tx);
        }

        return mapToResponse(updatedPart);
    }

    @Transactional
    public PartResponse adjustStock(Long id, StockAdjustmentRequest request) {
        Part part = partRepository.findByIdWithLock(id)
                .orElseThrow(() -> new PartNotFoundException(id));

        int previousQuantity = part.getQuantity();
        int newQuantity = previousQuantity + request.getQuantity();

        if (newQuantity < 0) {
            throw new IllegalArgumentException(
                    "Resulting quantity cannot be negative. Current stock is " + previousQuantity
            );
        }

        part.setQuantity(newQuantity);
        Part saved = partRepository.save(part);

        User currentUser = SecurityUtils.getCurrentUser().orElse(null);
        InventoryTransaction tx = InventoryTransaction.builder()
                .part(saved)
                .transactionType(request.getQuantity() > 0 ? InventoryTransactionType.RESTOCK : InventoryTransactionType.ADJUSTMENT)
                .quantityChanged(request.getQuantity())
                .previousQuantity(previousQuantity)
                .newQuantity(newQuantity)
                .user(currentUser)
                .reason(request.getReason())
                .build();
        inventoryTransactionRepository.save(tx);

        return mapToResponse(saved);
    }

    public List<InventoryTransactionResponse> getPartTransactions(Long partId) {
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new PartNotFoundException(partId));

        List<InventoryTransaction> transactions =
                inventoryTransactionRepository.findByPartOrderByCreatedAtDesc(part);

        List<InventoryTransactionResponse> responses = new ArrayList<>();
        for (InventoryTransaction tx : transactions) {
            responses.add(
                    InventoryTransactionResponse.builder()
                            .id(tx.getId())
                            .partId(tx.getPart().getId())
                            .partName(tx.getPart().getName())
                            .partNumber(tx.getPart().getPartNumber())
                            .transactionType(tx.getTransactionType())
                            .quantityChanged(tx.getQuantityChanged())
                            .previousQuantity(tx.getPreviousQuantity())
                            .newQuantity(tx.getNewQuantity())
                            .workOrderId(tx.getWorkOrder() != null ? tx.getWorkOrder().getId() : null)
                            .workOrderTitle(tx.getWorkOrder() != null ? tx.getWorkOrder().getTitle() : null)
                            .userId(tx.getUser() != null ? tx.getUser().getId() : null)
                            .userName(tx.getUser() != null ? tx.getUser().getUserName() : "System")
                            .reason(tx.getReason())
                            .createdAt(tx.getCreatedAt())
                            .build()
            );
        }
        return responses;
    }

    @Transactional
    public void deletePart(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new PartNotFoundException(id));

        // If part is referenced by any work order, soft-delete by deactivating
        if (workOrderPartRepository.existsByPart_Id(id)) {
            part.setActive(false);
            partRepository.save(part);
        } else {
            partRepository.delete(part);
        }
    }

    private PartResponse mapToResponse(Part part) {
        int threshold = part.getLowStockThreshold() != null ? part.getLowStockThreshold() : 5;
        boolean isLowStock = part.getQuantity() <= threshold;

        return PartResponse.builder()
                .id(part.getId())
                .name(part.getName())
                .partNumber(part.getPartNumber())
                .description(part.getDescription())
                .quantity(part.getQuantity())
                .price(part.getPrice())
                .active(part.getActive())
                .lowStockThreshold(threshold)
                .isLowStock(isLowStock)
                .createdAt(part.getCreatedAt())
                .build();
    }
}
