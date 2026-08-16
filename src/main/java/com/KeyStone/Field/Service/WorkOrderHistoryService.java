package com.KeyStone.Field.Service;

import com.KeyStone.Field.DTO.WorkOrderHistoryResponse;
import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.Entity.WorkOrderHistory;
import com.KeyStone.Field.Exception.WorkOrderNotFoundException;
import com.KeyStone.Field.Repository.WorkOrderHistoryRepository;
import com.KeyStone.Field.Repository.WorkOrderRepository;
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

    public List<WorkOrderHistoryResponse> getHistory(
            Long workOrderId) {

        // First verify that the Work Order exists
        WorkOrder workOrder =
                workOrderRepository.findById(workOrderId)
                        .orElseThrow(() ->
                                new WorkOrderNotFoundException(
                                        workOrderId
                                ));

        List<WorkOrderHistory> historyList =
                historyRepository
                        .findByWorkOrderIdOrderByCreatedAtAsc(
                                workOrder.getId()
                        );

        List<WorkOrderHistoryResponse> responseList =
                new ArrayList<>();

        for (WorkOrderHistory history : historyList) {

            WorkOrderHistoryResponse response =
                    WorkOrderHistoryResponse.builder()
                            .id(history.getId())
                            .workOrderId(
                                    history.getWorkOrder()
                                            .getId()
                            )
                            .status(history.getStatus())
                            .description(
                                    history.getDescription()
                            )
                            .createdAt(
                                    history.getCreatedAt()
                            )
                            .build();

            responseList.add(response);
        }

        return responseList;
    }
}