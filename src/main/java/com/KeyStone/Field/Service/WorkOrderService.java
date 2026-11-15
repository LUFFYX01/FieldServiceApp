package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.AssignTechnicianRequest;
import com.KeyStone.Field.DTO.CreateWorkOrderRequest;
import com.KeyStone.Field.DTO.TechnicianStatusUpdateRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderRequest;
import com.KeyStone.Field.DTO.WorkOrderResponse;
import com.KeyStone.Field.Entity.*;
import com.KeyStone.Field.Exception.*;
import com.KeyStone.Field.Repository.*;
import com.KeyStone.Field.Security.SecurityUtils;
import com.KeyStone.Field.enums.Role;
import com.KeyStone.Field.enums.WorkOrderStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final SiteRepository siteRepository;
    private final WorkOrderHistoryRepository historyRepository;

    private static final Map<WorkOrderStatus, Set<WorkOrderStatus>> PERMITTED_TRANSITIONS = Map.of(
            WorkOrderStatus.OPEN, Set.of(WorkOrderStatus.OPEN, WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED),
            WorkOrderStatus.ASSIGNED, Set.of(WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED),
            WorkOrderStatus.IN_PROGRESS, Set.of(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED),
            WorkOrderStatus.COMPLETED, Set.of(),
            WorkOrderStatus.CANCELLED, Set.of()
    );

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            CustomerRepository customerRepository,
                            UserRepository userRepository,
                            SiteRepository siteRepository,
                            WorkOrderHistoryRepository historyRepository) {
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.siteRepository = siteRepository;
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

    private void validateStatusTransition(WorkOrderStatus currentStatus, WorkOrderStatus newStatus) {
        if (currentStatus == newStatus) {
            return;
        }

        Set<WorkOrderStatus> allowed = PERMITTED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!allowed.contains(newStatus)) {
            throw new InvalidWorkOrderStateException(
                    "Invalid status transition from " + currentStatus + " to " + newStatus
            );
        }
    }

    private WorkOrderResponse mapToResponse(WorkOrder workOrder) {
        boolean isOverdue = workOrder.getScheduledDate() != null
                && workOrder.getScheduledDate().isBefore(LocalDateTime.now())
                && workOrder.getStatus() != WorkOrderStatus.COMPLETED
                && workOrder.getStatus() != WorkOrderStatus.CANCELLED;

        return WorkOrderResponse.builder()
                .id(workOrder.getId())
                .title(workOrder.getTitle())
                .description(workOrder.getDescription())
                .priority(workOrder.getPriority())
                .status(workOrder.getStatus())
                .customerId(workOrder.getCustomer().getId())
                .customerName(workOrder.getCustomer().getCompanyName())
                .siteId(workOrder.getSite().getId())
                .siteName(workOrder.getSite().getSiteName())
                .siteAddress(workOrder.getSite().getAddress())
                .technicianId(
                        workOrder.getAssignedTechnician() != null
                                ? workOrder.getAssignedTechnician().getId()
                                : null
                )
                .technicianName(
                        workOrder.getAssignedTechnician() != null
                                ? workOrder.getAssignedTechnician().getUserName()
                                : null
                )
                .createdAt(workOrder.getCreatedAt())
                .scheduledDate(workOrder.getScheduledDate())
                .completedDate(workOrder.getCompletedDate())
                .notes(workOrder.getNotes())
                .isOverdue(isOverdue)
                .build();
    }

    @Transactional
    public WorkOrderResponse createWorkOrder(CreateWorkOrderRequest request) {
        if (SecurityUtils.isCurrentUserTechnician()) {
            throw new AccessDeniedException("Technicians cannot create work orders");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() ->
                        new CustomerNotFoundException(request.getCustomerId()));

        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() ->
                        new SiteNotFoundException(request.getSiteId()));

        if (!site.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException(
                    "Site does not belong to the selected customer"
            );
        }

        WorkOrder workOrder = new WorkOrder();
        workOrder.setTitle(request.getTitle());
        workOrder.setDescription(request.getDescription());
        workOrder.setPriority(request.getPriority());
        workOrder.setStatus(WorkOrderStatus.OPEN);
        workOrder.setCustomer(customer);
        workOrder.setSite(site);

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(savedWorkOrder)
                .status(WorkOrderStatus.OPEN)
                .description("Work order created")
                .build();
        historyRepository.save(history);

        return mapToResponse(savedWorkOrder);
    }

    public List<WorkOrderResponse> getAllWorkOrders() {
        List<WorkOrder> workOrders;

        if (SecurityUtils.isCurrentUserTechnician()) {
            User currentUser = SecurityUtils.getCurrentUser().orElse(null);
            if (currentUser != null) {
                workOrders = workOrderRepository.findByAssignedTechnician(currentUser);
            } else {
                workOrders = List.of();
            }
        } else {
            workOrders = workOrderRepository.findAll();
        }

        List<WorkOrderResponse> responseList = new ArrayList<>();
        for (WorkOrder workOrder : workOrders) {
            responseList.add(mapToResponse(workOrder));
        }

        return responseList;
    }

    public WorkOrderResponse getWorkOrderById(Long id) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        checkWorkOrderAccess(workOrder);

        return mapToResponse(workOrder);
    }

    @Transactional
    public WorkOrderResponse updateWorkOrder(Long id, UpdateWorkOrderRequest request) {
        if (SecurityUtils.isCurrentUserTechnician()) {
            throw new AccessDeniedException("Technicians must use the dedicated status update operation");
        }

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        WorkOrderStatus oldStatus = workOrder.getStatus();

        if (request.getStatus() != null) {
            validateStatusTransition(oldStatus, request.getStatus());
            workOrder.setStatus(request.getStatus());

            if (request.getStatus() == WorkOrderStatus.COMPLETED && workOrder.getCompletedDate() == null) {
                workOrder.setCompletedDate(
                        request.getCompletedDate() != null ? request.getCompletedDate() : LocalDateTime.now()
                );
            } else if (request.getCompletedDate() != null) {
                workOrder.setCompletedDate(request.getCompletedDate());
            }
        }

        if (request.getPriority() != null) {
            workOrder.setPriority(request.getPriority());
        }

        if (request.getScheduledDate() != null) {
            workOrder.setScheduledDate(request.getScheduledDate());
        }

        if (request.getNotes() != null) {
            workOrder.setNotes(request.getNotes());
        }

        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);

        if (request.getStatus() != null && oldStatus != request.getStatus()) {
            WorkOrderHistory history = WorkOrderHistory.builder()
                    .workOrder(updatedWorkOrder)
                    .status(request.getStatus())
                    .description("Status changed from " + oldStatus + " to " + request.getStatus())
                    .build();
            historyRepository.save(history);
        }

        return mapToResponse(updatedWorkOrder);
    }

    @Transactional
    public WorkOrderResponse updateTechnicianStatus(Long id, TechnicianStatusUpdateRequest request) {
        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        checkWorkOrderAccess(workOrder);

        WorkOrderStatus oldStatus = workOrder.getStatus();
        WorkOrderStatus newStatus = request.getStatus();

        if (newStatus != WorkOrderStatus.IN_PROGRESS && newStatus != WorkOrderStatus.COMPLETED) {
            throw new InvalidWorkOrderStateException("Technicians can only transition to IN_PROGRESS or COMPLETED");
        }

        validateStatusTransition(oldStatus, newStatus);
        workOrder.setStatus(newStatus);

        if (newStatus == WorkOrderStatus.COMPLETED) {
            workOrder.setCompletedDate(LocalDateTime.now());
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String existingNotes = workOrder.getNotes() != null ? workOrder.getNotes() + "\n" : "";
            workOrder.setNotes(existingNotes + "[Technician Note] " + request.getNotes());
        }

        WorkOrder saved = workOrderRepository.save(workOrder);

        String desc = "Technician updated status to " + newStatus;
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            desc += " with notes: " + request.getNotes();
        }

        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(saved)
                .status(newStatus)
                .description(desc)
                .build();
        historyRepository.save(history);

        return mapToResponse(saved);
    }

    @Transactional
    public void deleteWorkOrder(Long id) {
        if (SecurityUtils.isCurrentUserTechnician()) {
            throw new AccessDeniedException("Technicians cannot delete work orders");
        }

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        workOrderRepository.delete(workOrder);
    }

    @Transactional
    public WorkOrderResponse assignTechnician(Long workOrderId, AssignTechnicianRequest request) {
        if (SecurityUtils.isCurrentUserTechnician()) {
            throw new AccessDeniedException("Technicians cannot assign work orders");
        }

        WorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new WorkOrderNotFoundException(workOrderId));

        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED ||
                workOrder.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new InvalidWorkOrderStateException(
                    "Cannot assign technician to a completed or cancelled work order"
            );
        }

        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() ->
                        new UserNotFoundException(request.getTechnicianId()));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new InvalidTechnicianException(
                    "User with id " + technician.getId() + " is not a technician"
            );
        }

        if (!Boolean.TRUE.equals(technician.getActive())) {
            throw new InvalidTechnicianException("Technician is inactive and cannot be assigned");
        }

        User previousTechnician = workOrder.getAssignedTechnician();
        workOrder.setAssignedTechnician(technician);
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        String description = previousTechnician == null
                ? "Technician assigned: " + technician.getUserName()
                : "Technician reassigned from " + previousTechnician.getUserName() + " to " + technician.getUserName();

        WorkOrderHistory history = WorkOrderHistory.builder()
                .workOrder(savedWorkOrder)
                .status(WorkOrderStatus.ASSIGNED)
                .description(description)
                .build();
        historyRepository.save(history);

        return mapToResponse(savedWorkOrder);
    }
}
