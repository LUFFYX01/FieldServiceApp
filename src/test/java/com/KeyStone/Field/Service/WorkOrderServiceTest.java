package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.AssignTechnicianRequest;
import com.KeyStone.Field.DTO.CreateWorkOrderRequest;
import com.KeyStone.Field.DTO.TechnicianStatusUpdateRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderRequest;
import com.KeyStone.Field.DTO.WorkOrderResponse;
import com.KeyStone.Field.Entity.*;
import com.KeyStone.Field.Exception.InvalidTechnicianException;
import com.KeyStone.Field.Exception.InvalidWorkOrderStateException;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SiteRepository siteRepository;

    @Mock
    private WorkOrderHistoryRepository historyRepository;

    @InjectMocks
    private WorkOrderService workOrderService;

    private User technician;
    private User otherTechnician;
    private Customer customer;
    private Site site;
    private WorkOrder workOrder;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        technician = User.builder()
                .id(1L)
                .userName("tech1")
                .email("tech1@keystone.com")
                .role(Role.TECHNICIAN)
                .active(true)
                .build();

        otherTechnician = User.builder()
                .id(2L)
                .userName("tech2")
                .email("tech2@keystone.com")
                .role(Role.TECHNICIAN)
                .active(true)
                .build();

        customer = Customer.builder()
                .id(10L)
                .companyName("Acme Corp")
                .build();

        site = Site.builder()
                .id(20L)
                .siteName("Plant 1")
                .customer(customer)
                .build();

        workOrder = WorkOrder.builder()
                .id(100L)
                .title("Pump Repair")
                .description("Fix leak")
                .status(WorkOrderStatus.OPEN)
                .priority(WorkOrderPriority.MEDIUM)
                .customer(customer)
                .site(site)
                .build();
    }

    @Test
    @DisplayName("Valid status transitions succeed")
    void testValidStatusTransitions() {
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(any(WorkOrder.class))).thenReturn(workOrder);

        UpdateWorkOrderRequest request = UpdateWorkOrderRequest.builder()
                .status(WorkOrderStatus.IN_PROGRESS)
                .build();

        WorkOrderResponse response = workOrderService.updateWorkOrder(100L, request);

        assertEquals(WorkOrderStatus.IN_PROGRESS, response.getStatus());
        verify(historyRepository).save(any(WorkOrderHistory.class));
    }

    @Test
    @DisplayName("Invalid status transition: OPEN directly to COMPLETED is rejected")
    void testInvalidStatusTransition_OpenToCompleted_Rejected() {
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));

        UpdateWorkOrderRequest request = UpdateWorkOrderRequest.builder()
                .status(WorkOrderStatus.COMPLETED)
                .build();

        assertThrows(InvalidWorkOrderStateException.class, () ->
                workOrderService.updateWorkOrder(100L, request)
        );
    }

    @Test
    @DisplayName("Invalid status transition: cannot modify status of COMPLETED work order")
    void testModifyCompletedWorkOrder_Rejected() {
        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));

        UpdateWorkOrderRequest request = UpdateWorkOrderRequest.builder()
                .status(WorkOrderStatus.IN_PROGRESS)
                .build();

        assertThrows(InvalidWorkOrderStateException.class, () ->
                workOrderService.updateWorkOrder(100L, request)
        );
    }

    @Test
    @DisplayName("Technician can update status to IN_PROGRESS on their assigned work order")
    void testTechnicianUpdateStatus_AssignedWorkOrder_Succeeds() {
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setAssignedTechnician(technician);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(technician, null, technician.getAuthorities())
        );

        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(any(WorkOrder.class))).thenReturn(workOrder);

        TechnicianStatusUpdateRequest request = TechnicianStatusUpdateRequest.builder()
                .status(WorkOrderStatus.IN_PROGRESS)
                .notes("Started diagnostics")
                .build();

        WorkOrderResponse response = workOrderService.updateTechnicianStatus(100L, request);

        assertEquals(WorkOrderStatus.IN_PROGRESS, response.getStatus());
        assertTrue(workOrder.getNotes().contains("Started diagnostics"));
    }

    @Test
    @DisplayName("Technician cannot update status of work order assigned to another technician")
    void testTechnicianUpdateStatus_UnauthorizedWorkOrder_AccessDenied() {
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setAssignedTechnician(technician);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(otherTechnician, null, otherTechnician.getAuthorities())
        );

        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));

        TechnicianStatusUpdateRequest request = TechnicianStatusUpdateRequest.builder()
                .status(WorkOrderStatus.IN_PROGRESS)
                .build();

        assertThrows(AccessDeniedException.class, () ->
                workOrderService.updateTechnicianStatus(100L, request)
        );
    }

    @Test
    @DisplayName("Cannot assign technician to a COMPLETED work order")
    void testAssignTechnician_CompletedWorkOrder_ThrowsInvalidWorkOrderStateException() {
        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));

        AssignTechnicianRequest request = AssignTechnicianRequest.builder()
                .technicianId(1L)
                .build();

        assertThrows(InvalidWorkOrderStateException.class, () ->
                workOrderService.assignTechnician(100L, request)
        );
    }

    @Test
    @DisplayName("Cannot assign inactive technician")
    void testAssignTechnician_InactiveTechnician_ThrowsInvalidTechnicianException() {
        technician.setActive(false);

        when(workOrderRepository.findById(100L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findById(1L)).thenReturn(Optional.of(technician));

        AssignTechnicianRequest request = AssignTechnicianRequest.builder()
                .technicianId(1L)
                .build();

        assertThrows(InvalidTechnicianException.class, () ->
                workOrderService.assignTechnician(100L, request)
        );
    }
}
