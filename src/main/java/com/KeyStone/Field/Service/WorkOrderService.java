package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.CreateWorkOrderRequest;
import com.KeyStone.Field.DTO.WorkOrderResponse;
import com.KeyStone.Field.enums.WorkOrderStatus;
import com.KeyStone.Field.Entity.Customer;
import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.Exception.CustomerNotFoundException;
import com.KeyStone.Field.Repository.CustomerRepository;
import com.KeyStone.Field.Repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final CustomerRepository customerRepository;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            CustomerRepository customerRepository) {
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
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

        return WorkOrderResponse.builder()
                .id(savedWorkOrder.getId())
                .title(savedWorkOrder.getTitle())
                .description(savedWorkOrder.getDescription())
                .priority(savedWorkOrder.getPriority())
                .status(savedWorkOrder.getStatus())
                .customerId(savedWorkOrder.getCustomer().getId())
                .customerName(savedWorkOrder.getCustomer().getCompanyName())
                .createdAt(savedWorkOrder.getCreatedAt())
                .build();
    }
}