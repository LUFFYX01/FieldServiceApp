package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreatePartRequest;
import com.KeyStone.Field.DTO.PartResponse;
import com.KeyStone.Field.DTO.StockAdjustmentRequest;
import com.KeyStone.Field.Entity.InventoryTransaction;
import com.KeyStone.Field.Entity.Part;
import com.KeyStone.Field.Exception.DuplicatePartNumberException;
import com.KeyStone.Field.Exception.PartNotFoundException;
import com.KeyStone.Field.Repository.InventoryTransactionRepository;
import com.KeyStone.Field.Repository.PartRepository;
import com.KeyStone.Field.Repository.WorkOrderPartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PartServiceTest {

    @Mock
    private PartRepository partRepository;

    @Mock
    private WorkOrderPartRepository workOrderPartRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @InjectMocks
    private PartService partService;

    private Part part;

    @BeforeEach
    void setUp() {
        part = Part.builder()
                .id(1L)
                .name("Filter Element")
                .partNumber("FLT-001")
                .quantity(20)
                .price(new BigDecimal("15.50"))
                .lowStockThreshold(5)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Create part with unique part number succeeds")
    void testCreatePart_Success() {
        CreatePartRequest request = CreatePartRequest.builder()
                .name("Filter Element")
                .partNumber("FLT-001")
                .quantity(20)
                .price(new BigDecimal("15.50"))
                .lowStockThreshold(5)
                .build();

        when(partRepository.existsByPartNumber("FLT-001")).thenReturn(false);
        when(partRepository.save(any(Part.class))).thenAnswer(invocation -> {
            Part p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        PartResponse response = partService.createPart(request);

        assertNotNull(response);
        assertEquals("FLT-001", response.getPartNumber());
        assertEquals(20, response.getQuantity());
        assertFalse(response.getIsLowStock());
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Create part with duplicate part number is rejected")
    void testCreatePart_DuplicatePartNumber_ThrowsException() {
        CreatePartRequest request = CreatePartRequest.builder()
                .name("Filter Element")
                .partNumber("FLT-001")
                .quantity(20)
                .price(new BigDecimal("15.50"))
                .build();

        when(partRepository.existsByPartNumber("FLT-001")).thenReturn(true);

        assertThrows(DuplicatePartNumberException.class, () -> partService.createPart(request));
        verify(partRepository, never()).save(any(Part.class));
    }

    @Test
    @DisplayName("Soft-delete: Deleting a part referenced by work orders deactivates it")
    void testDeletePart_ReferencedByWorkOrder_SoftDeletes() {
        when(partRepository.findById(1L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.existsByPart_Id(1L)).thenReturn(true);

        partService.deletePart(1L);

        assertFalse(part.getActive());
        verify(partRepository).save(part);
        verify(partRepository, never()).delete(part);
    }

    @Test
    @DisplayName("Hard-delete: Deleting an unreferenced part removes it from the database")
    void testDeletePart_NotReferenced_HardDeletes() {
        when(partRepository.findById(1L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.existsByPart_Id(1L)).thenReturn(false);

        partService.deletePart(1L);

        verify(partRepository).delete(part);
    }

    @Test
    @DisplayName("Restock increases inventory and logs transaction")
    void testAdjustStock_Restock_Succeeds() {
        when(partRepository.findByIdWithLock(1L)).thenReturn(Optional.of(part));
        when(partRepository.save(any(Part.class))).thenReturn(part);

        StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                .quantity(10)
                .reason("Received shipment from supplier")
                .build();

        PartResponse response = partService.adjustStock(1L, request);

        assertEquals(30, response.getQuantity());
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Adjustment reducing quantity below zero is rejected")
    void testAdjustStock_BelowZero_ThrowsException() {
        when(partRepository.findByIdWithLock(1L)).thenReturn(Optional.of(part));

        StockAdjustmentRequest request = StockAdjustmentRequest.builder()
                .quantity(-25) // Current is 20
                .reason("Damaged stock")
                .build();

        assertThrows(IllegalArgumentException.class, () -> partService.adjustStock(1L, request));
        assertEquals(20, part.getQuantity());
    }
}
