package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.WorkOrderHistoryResponse;
import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.Entity.WorkOrderHistory;
import com.KeyStone.Field.Exception.WorkOrderNotFoundException;
import com.KeyStone.Field.Repository.WorkOrderHistoryRepository;
import com.KeyStone.Field.Repository.WorkOrderRepository;
import com.KeyStone.Field.Security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WorkOrderHistoryService {

    private final WorkOrderHistoryRepository historyRepository;
    private final WorkOrderRepository workOrderRepository;

    public WorkOrderHistoryService(
            WorkOrderHistoryRepository historyRepository,
            WorkOrderRepository workOrderRepository) {

        this.historyRepository = historyRepository;
        this.workOrderRepository = workOrderRepository;
    }

    public List<WorkOrderHistoryResponse> getHistory(Long workOrderId) {
        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(workOrderId));

        if (SecurityUtils.isCurrentUserTechnician()) {
            User currentUser = SecurityUtils.getCurrentUser().orElse(null);
            if (currentUser != null) {
                if (workOrder.getAssignedTechnician() == null ||
                        !workOrder.getAssignedTechnician().getId().equals(currentUser.getId())) {
                    throw new AccessDeniedException("You do not have permission to view this work order's history");
                }
            }
        }

        List<WorkOrderHistory> historyList =
                historyRepository.findByWorkOrderIdOrderByCreatedAtAsc(workOrder.getId());

        List<WorkOrderHistoryResponse> responseList = new ArrayList<>();
        for (WorkOrderHistory history : historyList) {
            responseList.add(
                    WorkOrderHistoryResponse.builder()
                            .id(history.getId())
                            .workOrderId(history.getWorkOrder().getId())
                            .status(history.getStatus())
                            .description(history.getDescription())
                            .createdAt(history.getCreatedAt())
                            .build()
            );
        }

        return responseList;
    }
}
