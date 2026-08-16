CREATE TABLE work_order_history (
                                    history_id BIGSERIAL PRIMARY KEY,

                                    workorder_id BIGINT NOT NULL,

                                    status VARCHAR(50) NOT NULL,

                                    description TEXT,

                                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                    CONSTRAINT fk_work_order_history_workorder
                                        FOREIGN KEY (workorder_id)
                                            REFERENCES work_orders(workorder_id)
);