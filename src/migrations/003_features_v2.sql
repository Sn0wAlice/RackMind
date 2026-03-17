-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action ENUM('create', 'update', 'delete', 'quantity_change', 'import') NOT NULL,
  entity_type ENUM('item', 'location', 'category', 'item_type', 'user') NOT NULL,
  entity_id INT NOT NULL,
  entity_name VARCHAR(255) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_entity (entity_type, entity_id),
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_created (created_at)
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6b7280',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Item status + low stock threshold
ALTER TABLE items ADD COLUMN status ENUM('in_stock', 'in_use', 'broken', 'to_order') DEFAULT 'in_stock' AFTER quantity;
ALTER TABLE items ADD COLUMN low_stock_threshold INT DEFAULT NULL AFTER status;
ALTER TABLE items ADD INDEX idx_items_status (status);

-- Multi-images
CREATE TABLE IF NOT EXISTS item_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_item_images_item (item_id)
);

-- Item links/relationships
CREATE TABLE IF NOT EXISTS item_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_item_id INT NOT NULL,
  child_item_id INT NOT NULL,
  relationship VARCHAR(100) DEFAULT 'contains',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (child_item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_link (parent_item_id, child_item_id),
  INDEX idx_link_parent (parent_item_id),
  INDEX idx_link_child (child_item_id)
);

-- Saved filters
CREATE TABLE IF NOT EXISTS saved_filters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  filters JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_saved_filters_user (user_id)
);

-- Item comments
CREATE TABLE IF NOT EXISTS item_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_item (item_id)
);
