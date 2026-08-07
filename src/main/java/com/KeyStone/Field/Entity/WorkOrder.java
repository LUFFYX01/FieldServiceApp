package com.KeyStone.Field.Entity;

import com.KeyStone.Field.enums.WorkOrderPriority;
import com.KeyStone.Field.enums.WorkOrderStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "work_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "workorder_id")
    private Long id;

    @NotBlank
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull
    private WorkOrderStatus status;

    @Enumerated(EnumType.STRING)
    @NotNull
    private WorkOrderPriority priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User assignedTechnician;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime scheduledDate;

    private LocalDateTime completedDate;

    @Column(columnDefinition = "TEXT")
    private String notes;
}