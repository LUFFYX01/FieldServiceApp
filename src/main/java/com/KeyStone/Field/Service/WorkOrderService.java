package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.AssignTechnicianRequest;
import com.KeyStone.Field.DTO.CreateWorkOrderRequest;
import com.KeyStone.Field.DTO.UpdateWorkOrderRequest;
import com.KeyStone.Field.DTO.WorkOrderResponse;
import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Exception.UserNotFoundException;
import com.KeyStone.Field.Exception.WorkOrderNotFoundException;
import com.KeyStone.Field.Repository.UserRepository;
import com.KeyStone.Field.enums.Role;
import com.KeyStone.Field.enums.WorkOrderStatus;
import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.Exception.CustomerNotFoundException;
import com.KeyStone.Field.Repository.CustomerRepository;
import com.KeyStone.Field.Repository.WorkOrderRepository;
import org.springframework.stereotype.Service;
import com.KeyStone.Field.Exception.InvalidTechnicianException;
import com.KeyStone.Field.Exception.InvalidWorkOrderStateException;

import java.util.ArrayList;
import java.util.List;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            CustomerRepository customerRepository,
                            UserRepository userRepository) {
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
    }

    private WorkOrderResponse mapToResponse(WorkOrder workOrder) {

        return WorkOrderResponse.builder()
                .id(workOrder.getId())
                .title(workOrder.getTitle())
                .description(workOrder.getDescription())
                .priority(workOrder.getPriority())
                .status(workOrder.getStatus())
                .customerId(workOrder.getCustomer().getId())
                .customerName(workOrder.getCustomer().getCompanyName())
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
                .build();
    }

    public WorkOrderResponse createWorkOrder(CreateWorkOrderRequest request) {

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() ->
                        new CustomerNotFoundException(request.getCustomerId()));

        WorkOrder workOrder = new WorkOrder();

        workOrder.setTitle(request.getTitle());
        workOrder.setDescription(request.getDescription());
        workOrder.setPriority(request.getPriority());
        workOrder.setStatus(WorkOrderStatus.OPEN);
        workOrder.setCustomer(customer);

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        return mapToResponse(savedWorkOrder);
    }

    public List<WorkOrderResponse> getAllWorkOrders() {

        List<WorkOrder> workOrders = workOrderRepository.findAll();

        List<WorkOrderResponse> responseList = new ArrayList<>();

        for (WorkOrder workOrder : workOrders) {

            WorkOrderResponse response = WorkOrderResponse.builder()
                    .id(workOrder.getId())
                    .title(workOrder.getTitle())
                    .description(workOrder.getDescription())
                    .priority(workOrder.getPriority())
                    .status(workOrder.getStatus())
                    .customerId(workOrder.getCustomer().getId())
                    .customerName(workOrder.getCustomer().getCompanyName())
                    .createdAt(workOrder.getCreatedAt())
                    .build();

            responseList.add(response);
        }

        return responseList;
    }

    public WorkOrderResponse getWorkOrderById(Long id) {

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        return mapToResponse(workOrder);
    }

    public WorkOrderResponse updateWorkOrder(Long id,
                                             UpdateWorkOrderRequest request) {

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        workOrder.setStatus(request.getStatus());
        workOrder.setPriority(request.getPriority());
        workOrder.setScheduledDate(request.getScheduledDate());
        workOrder.setCompletedDate(request.getCompletedDate());
        workOrder.setNotes(request.getNotes());


        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);

        return mapToResponse(updatedWorkOrder);
    }

    public void deleteWorkOrder(Long id) {

        WorkOrder workOrder = workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));

        workOrderRepository.delete(workOrder);
    }
    public WorkOrderResponse assignTechnician(Long workOrderId,
                                              AssignTechnicianRequest request) {

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
                    "User with id " + technician.getId()
                            + " is not a technician"
            );
        }

        workOrder.setAssignedTechnician(technician);
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);

        return mapToResponse(savedWorkOrder);
    }
}