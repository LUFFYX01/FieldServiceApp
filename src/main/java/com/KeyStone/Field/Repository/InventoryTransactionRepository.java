package com.KeyStone.Field.Repository;

import com.KeyStone.Field.Entity.InventoryTransaction;
import com.KeyStone.Field.Entity.Part;
import com.KeyStone.Field.Entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByPartOrderByCreatedAtDesc(Part part);

    List<InventoryTransaction> findByPart_IdOrderByCreatedAtDesc(Long partId);

    List<InventoryTransaction> findByWorkOrder(WorkOrder workOrder);

    List<InventoryTransaction> findAllByOrderByCreatedAtDesc();
}
