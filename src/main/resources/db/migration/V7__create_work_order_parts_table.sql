CREATE TABLE work_order_parts (
                                  work_order_part_id BIGSERIAL PRIMARY KEY,

                                  work_order_id BIGINT NOT NULL,
                                  part_id BIGINT NOT NULL,

                                  required_quantity INTEGER NOT NULL,
                                  used_quantity INTEGER NOT NULL DEFAULT 0,

                                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT fk_work_order_parts_work_order
                                      FOREIGN KEY (work_order_id)
                                          REFERENCES work_orders(workorder_id),

                                  CONSTRAINT fk_work_order_parts_part
                                      FOREIGN KEY (part_id)
                                          REFERENCES parts(part_id),

                                  CONSTRAINT uq_work_order_part
                                      UNIQUE (work_order_id, part_id),

                                  CONSTRAINT chk_required_quantity
                                      CHECK (required_quantity > 0),

                                  CONSTRAINT chk_used_quantity
                                      CHECK (used_quantity >= 0),

                                  CONSTRAINT chk_used_not_greater_required
                                      CHECK (used_quantity <= required_quantity)
);