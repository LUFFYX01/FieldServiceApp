package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.User;
import com.KeyStone.Field.Entity.WorkOrder;
import com.KeyStone.Field.enums.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    List<WorkOrder> findByAssignedTechnician(User technician);

    List<WorkOrder> findByAssignedTechnician_Id(Long technicianId);

    List<WorkOrder> findByStatus(WorkOrderStatus status);

    List<WorkOrder> findByCustomer_Id(Long customerId);

    List<WorkOrder> findBySite_Id(Long siteId);

    boolean existsByCustomer_Id(Long customerId);

    boolean existsBySite_Id(Long siteId);

    long countByStatus(WorkOrderStatus status);

    long countByAssignedTechnician_Id(Long technicianId);
}
