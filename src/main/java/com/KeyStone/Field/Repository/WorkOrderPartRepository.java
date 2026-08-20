package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.Entity.WorkOrderPart;
import com.KeyStone.Field.Entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkOrderPartRepository
        extends JpaRepository<WorkOrderPart, Long> {

    List<WorkOrderPart> findByWorkOrder(WorkOrder workOrder);

    Optional<WorkOrderPart> findByWorkOrderAndPart(
            WorkOrder workOrder,
            Part part
    );
}