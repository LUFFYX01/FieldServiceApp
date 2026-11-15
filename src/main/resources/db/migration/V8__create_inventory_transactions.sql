CREATE TABLE inventory_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    part_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    quantity_changed INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    work_order_id BIGINT,
    user_id BIGINT,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inv_trans_part
        FOREIGN KEY (part_id)
            REFERENCES parts(part_id),

    CONSTRAINT fk_inv_trans_work_order
        FOREIGN KEY (work_order_id)
            REFERENCES work_orders(workorder_id),

    CONSTRAINT fk_inv_trans_user
        FOREIGN KEY (user_id)
            REFERENCES users(user_id)
);
