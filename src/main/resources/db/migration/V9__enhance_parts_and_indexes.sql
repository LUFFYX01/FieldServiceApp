ALTER TABLE parts ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5;

CREATE INDEX idx_work_orders_technician ON work_orders(technician_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_site ON work_orders(site_id);
CREATE INDEX idx_parts_active ON parts(active);
CREATE INDEX idx_inv_trans_part ON inventory_transactions(part_id);
CREATE INDEX idx_inv_trans_work_order ON inventory_transactions(work_order_id);
