package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.UpdateRequiredQuantityRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderPartRequest;
import com.KeyStone.Field.DTO.WorkOrderPartResponse;
import com.KeyStone.Field.Entity.*;
import com.KeyStone.Field.Exception.*;
import com.KeyStone.Field.Repository.*;
import com.KeyStone.Field.enums.Role;
import com.KeyStone.Field.enums.WorkOrderPriority;
import com.KeyStone.Field.enums.WorkOrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkOrderPartServiceTest {

    @Mock
    private WorkOrderPartRepository workOrderPartRepository;

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private PartRepository partRepository;

    @Mock
    private InventoryTransactionRepository inventoryTransactionRepository;

    @Mock
    private WorkOrderHistoryRepository historyRepository;

    @InjectMocks
    private WorkOrderPartService workOrderPartService;

    private WorkOrder workOrder;
    private Part part;
    private WorkOrderPart workOrderPart;
    private User technician;
    private User otherTechnician;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        technician = User.builder()
                .id(10L)
                .userName("tech1")
                .email("tech1@keystone.com")
                .role(Role.TECHNICIAN)
                .active(true)
                .build();

        otherTechnician = User.builder()
                .id(20L)
                .userName("tech2")
                .email("tech2@keystone.com")
                .role(Role.TECHNICIAN)
                .active(true)
                .build();

        workOrder = WorkOrder.builder()
                .id(1L)
                .title("Test Work Order")
                .description("Test Description")
                .priority(WorkOrderPriority.HIGH)
                .status(WorkOrderStatus.ASSIGNED)
                .assignedTechnician(technician)
                .build();

        part = Part.builder()
                .id(100L)
                .name("Hydraulic Pump")
                .partNumber("HPM-101")
                .quantity(10)
                .price(new BigDecimal("250.00"))
                .lowStockThreshold(5)
                .active(true)
                .build();

        workOrderPart = WorkOrderPart.builder()
                .id(50L)
                .workOrder(workOrder)
                .part(part)
                .requiredQuantity(5)
                .usedQuantity(0)
                .build();
    }

    @Test
    @DisplayName("1. Add a required part: WorkOrderPart is created with usedQuantity = 0")
    void testAddRequiredPart_Success() {
        CreateWorkOrderPartRequest request = CreateWorkOrderPartRequest.builder()
                .partId(100L)
                .requiredQuantity(3)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(partRepository.findById(100L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.findByWorkOrderAndPart(workOrder, part)).thenReturn(Optional.empty());
        when(workOrderPartRepository.save(any(WorkOrderPart.class))).thenAnswer(invocation -> {
            WorkOrderPart saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        WorkOrderPartResponse response = workOrderPartService.addPart(1L, request);

        assertNotNull(response);
        assertEquals(3, response.getRequiredQuantity());
        assertEquals(0, response.getUsedQuantity());
        assertEquals(100L, response.getPartId());
        verify(workOrderPartRepository).save(any(WorkOrderPart.class));
        verify(historyRepository).save(any(WorkOrderHistory.class));
    }

    @Test
    @DisplayName("2. Add the same part twice to one work order: duplicate operation is rejected")
    void testAddPart_Duplicate_ThrowsDuplicateWorkOrderPartException() {
        CreateWorkOrderPartRequest request = CreateWorkOrderPartRequest.builder()
                .partId(100L)
                .requiredQuantity(2)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(partRepository.findById(100L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.findByWorkOrderAndPart(workOrder, part)).thenReturn(Optional.of(workOrderPart));

        assertThrows(DuplicateWorkOrderPartException.class, () -> workOrderPartService.addPart(1L, request));
        verify(workOrderPartRepository, never()).save(any(WorkOrderPart.class));
    }

    @Test
    @DisplayName("3. Increase used quantity: inventory decreases by the increase")
    void testUpdateUsedQuantity_IncreaseUsage_DecreasesInventory() {
        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(2)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));
        when(partRepository.findByIdWithLock(100L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.save(any(WorkOrderPart.class))).thenReturn(workOrderPart);

        WorkOrderPartResponse response = workOrderPartService.updateUsedQuantity(1L, 50L, request);

        assertNotNull(response);
        assertEquals(2, response.getUsedQuantity());
        assertEquals(8, part.getQuantity()); // 10 - 2 = 8
        verify(partRepository).save(part);
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("4. Decrease used quantity: inventory is restored by the decrease")
    void testUpdateUsedQuantity_DecreaseUsage_RestoresInventory() {
        workOrderPart.setUsedQuantity(3);
        part.setQuantity(7);

        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(1)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));
        when(partRepository.findByIdWithLock(100L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.save(any(WorkOrderPart.class))).thenReturn(workOrderPart);

        WorkOrderPartResponse response = workOrderPartService.updateUsedQuantity(1L, 50L, request);

        assertNotNull(response);
        assertEquals(1, response.getUsedQuantity());
        assertEquals(9, part.getQuantity()); // 7 + (3 - 1) = 9
        verify(partRepository).save(part);
        verify(inventoryTransactionRepository).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("5. Set usage equal to required quantity: operation succeeds if stock permits")
    void testUpdateUsedQuantity_EqualToRequired_Succeeds() {
        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(5) // required is 5
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));
        when(partRepository.findByIdWithLock(100L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.save(any(WorkOrderPart.class))).thenReturn(workOrderPart);

        WorkOrderPartResponse response = workOrderPartService.updateUsedQuantity(1L, 50L, request);

        assertNotNull(response);
        assertEquals(5, response.getUsedQuantity());
        assertEquals(5, part.getQuantity()); // 10 - 5 = 5
    }

    @Test
    @DisplayName("6. Set usage above required quantity: request is rejected")
    void testUpdateUsedQuantity_AboveRequired_ThrowsInvalidPartUsageException() {
        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(6) // required is 5
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));

        assertThrows(InvalidPartUsageException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 50L, request)
        );
        verify(partRepository, never()).save(any(Part.class));
    }

    @Test
    @DisplayName("7. Use more parts than available stock: request is rejected")
    void testUpdateUsedQuantity_MoreThanStock_ThrowsInsufficientPartStockException() {
        part.setQuantity(2); // Only 2 in stock, but required is 5

        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(3)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));
        when(partRepository.findByIdWithLock(100L)).thenReturn(Optional.of(part));

        assertThrows(InsufficientPartStockException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 50L, request)
        );
        assertEquals(2, part.getQuantity()); // untouched
    }

    @Test
    @DisplayName("8. Update a nonexistent WorkOrderPart: return 404 Not Found")
    void testUpdateUsedQuantity_NonexistentPart_ThrowsWorkOrderPartNotFoundException() {
        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(1)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(WorkOrderPartNotFoundException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 999L, request)
        );
    }

    @Test
    @DisplayName("9. Update a part belonging to another work order: reject the operation")
    void testUpdateUsedQuantity_BelongsToAnotherWorkOrder_ThrowsInvalidPartUsageException() {
        WorkOrder otherWorkOrder = WorkOrder.builder()
                .id(2L)
                .title("Other Work Order")
                .build();
        workOrderPart.setWorkOrder(otherWorkOrder);

        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(1)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));

        assertThrows(InvalidPartUsageException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 50L, request)
        );
    }

    @Test
    @DisplayName("10. Submit a negative quantity: reject the operation")
    void testUpdateUsedQuantity_NegativeQuantity_ThrowsInvalidPartUsageException() {
        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(-1)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));

        assertThrows(InvalidPartUsageException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 50L, request)
        );
    }

    @Test
    @DisplayName("11. Submit a null quantity: reject the operation")
    void testUpdateUsedQuantity_NullQuantity_ThrowsInvalidPartUsageException() {
        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(null)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));

        assertThrows(InvalidPartUsageException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 50L, request)
        );
    }

    @Test
    @DisplayName("12. Submit the same update twice: inventory must not be deducted twice")
    void testUpdateUsedQuantity_SameQuantityTwice_IsIdempotent() {
        workOrderPart.setUsedQuantity(2);
        part.setQuantity(8);

        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(2) // same quantity
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));
        when(partRepository.findByIdWithLock(100L)).thenReturn(Optional.of(part));
        when(workOrderPartRepository.save(any(WorkOrderPart.class))).thenReturn(workOrderPart);

        WorkOrderPartResponse response = workOrderPartService.updateUsedQuantity(1L, 50L, request);

        assertNotNull(response);
        assertEquals(2, response.getUsedQuantity());
        assertEquals(8, part.getQuantity()); // unchanged
        verify(partRepository, never()).save(part);
        verify(inventoryTransactionRepository, never()).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("13. Technician cannot access work order assigned to another technician")
    void testTechnicianAccess_UnauthorizedTechnician_ThrowsAccessDeniedException() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(otherTechnician, null, otherTechnician.getAuthorities())
        );

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));

        UpdateWorkOrderPartRequest request = UpdateWorkOrderPartRequest.builder()
                .usedQuantity(1)
                .build();

        assertThrows(AccessDeniedException.class, () ->
                workOrderPartService.updateUsedQuantity(1L, 50L, request)
        );
    }

    @Test
    @DisplayName("14. Update required quantity: cannot fall below used quantity")
    void testUpdateRequiredQuantity_BelowUsedQuantity_ThrowsInvalidPartUsageException() {
        workOrderPart.setUsedQuantity(3);

        UpdateRequiredQuantityRequest request = UpdateRequiredQuantityRequest.builder()
                .requiredQuantity(2) // Less than used quantity 3
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(workOrder));
        when(workOrderPartRepository.findById(50L)).thenReturn(Optional.of(workOrderPart));

        assertThrows(InvalidPartUsageException.class, () ->
                workOrderPartService.updateRequiredQuantity(1L, 50L, request)
        );
    }
}
