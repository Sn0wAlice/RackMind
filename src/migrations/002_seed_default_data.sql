-- Default categories
INSERT IGNORE INTO categories (name, icon, description, is_default) VALUES
('IT Hardware', 'fa-solid fa-server', 'Computers, networking, and IT infrastructure', 1),
('Electronics', 'fa-solid fa-microchip', 'Electronic components and boards', 1),
('Tools', 'fa-solid fa-screwdriver-wrench', 'Hand tools, measurement instruments, and equipment', 1),
('3D Printing', 'fa-solid fa-cube', 'Filaments, parts, and 3D printer accessories', 1);

-- IT Hardware types
INSERT IGNORE INTO item_types (category_id, name, icon, description, is_default) VALUES
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'PC', 'fa-solid fa-desktop', 'Desktop computer', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Laptop', 'fa-solid fa-laptop', 'Portable computer', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Server', 'fa-solid fa-server', 'Rack or tower server', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Switch', 'fa-solid fa-network-wired', 'Network switch', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Router', 'fa-solid fa-wifi', 'Network router', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Firewall', 'fa-solid fa-shield-halved', 'Network firewall appliance', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Access Point', 'fa-solid fa-tower-broadcast', 'Wireless access point', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Monitor', 'fa-solid fa-display', 'Display monitor', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Keyboard', 'fa-solid fa-keyboard', 'Input keyboard', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Mouse', 'fa-solid fa-computer-mouse', 'Input mouse', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Cable', 'fa-solid fa-ethernet', 'Network or power cable', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'USB Drive', 'fa-solid fa-usb', 'USB flash drive', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Hard Drive', 'fa-solid fa-hard-drive', 'HDD storage drive', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'SSD', 'fa-solid fa-bolt', 'Solid state drive', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'RAM Module', 'fa-solid fa-memory', 'Memory module', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'CPU', 'fa-solid fa-microchip', 'Processor', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'GPU', 'fa-solid fa-tv', 'Graphics card', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'PSU', 'fa-solid fa-plug', 'Power supply unit', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'Motherboard', 'fa-solid fa-border-all', 'Main circuit board', 1),
((SELECT id FROM categories WHERE name = 'IT Hardware'), 'NAS', 'fa-solid fa-database', 'Network attached storage', 1);

-- Electronics types
INSERT IGNORE INTO item_types (category_id, name, icon, description, is_default) VALUES
((SELECT id FROM categories WHERE name = 'Electronics'), 'Resistor', 'fa-solid fa-minus', 'Electrical resistor', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Capacitor', 'fa-solid fa-battery-half', 'Electrical capacitor', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Inductor', 'fa-solid fa-magnet', 'Electrical inductor', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Diode', 'fa-solid fa-arrow-right', 'Semiconductor diode', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'LED', 'fa-solid fa-lightbulb', 'Light emitting diode', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Transistor', 'fa-solid fa-t', 'Semiconductor transistor', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'IC', 'fa-solid fa-microchip', 'Integrated circuit', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Relay', 'fa-solid fa-toggle-on', 'Electromagnetic relay', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Fuse', 'fa-solid fa-fire', 'Electrical fuse', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Connector', 'fa-solid fa-link', 'Electrical connector', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'PCB', 'fa-solid fa-table-cells', 'Printed circuit board', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Arduino', 'fa-solid fa-a', 'Arduino board', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Raspberry Pi', 'fa-solid fa-r', 'Raspberry Pi board', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Sensor', 'fa-solid fa-eye', 'Electronic sensor', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Motor', 'fa-solid fa-gear', 'Electric motor', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Battery', 'fa-solid fa-battery-full', 'Battery or cell', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Crystal Oscillator', 'fa-solid fa-wave-square', 'Crystal oscillator', 1),
((SELECT id FROM categories WHERE name = 'Electronics'), 'Voltage Regulator', 'fa-solid fa-sliders', 'Voltage regulator IC', 1);

-- Tools types
INSERT IGNORE INTO item_types (category_id, name, icon, description, is_default) VALUES
((SELECT id FROM categories WHERE name = 'Tools'), 'Soldering Iron', 'fa-solid fa-pen', 'Soldering iron or station', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Multimeter', 'fa-solid fa-gauge-high', 'Digital multimeter', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Oscilloscope', 'fa-solid fa-chart-line', 'Signal oscilloscope', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Power Supply', 'fa-solid fa-car-battery', 'Lab power supply', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Wire Stripper', 'fa-solid fa-scissors', 'Wire stripping tool', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Crimping Tool', 'fa-solid fa-wrench', 'Cable crimper', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Heat Gun', 'fa-solid fa-wind', 'Heat gun', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Screwdriver Set', 'fa-solid fa-screwdriver', 'Screwdriver set', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Pliers', 'fa-solid fa-grip', 'Pliers set', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Tweezers', 'fa-solid fa-hand-point-up', 'Precision tweezers', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'Magnifying Glass', 'fa-solid fa-magnifying-glass', 'Magnifying glass or loupe', 1),
((SELECT id FROM categories WHERE name = 'Tools'), 'ESD Mat', 'fa-solid fa-square', 'Anti-static ESD mat', 1);

-- 3D Printing types
INSERT IGNORE INTO item_types (category_id, name, icon, description, is_default) VALUES
((SELECT id FROM categories WHERE name = '3D Printing'), 'Filament PLA', 'fa-solid fa-circle-notch', 'PLA filament spool', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Filament ABS', 'fa-solid fa-circle-notch', 'ABS filament spool', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Filament PETG', 'fa-solid fa-circle-notch', 'PETG filament spool', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Nozzle', 'fa-solid fa-diamond', 'Printer nozzle', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Print Bed', 'fa-solid fa-table', 'Heated print bed', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Stepper Motor', 'fa-solid fa-gear', 'Stepper motor', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Belt', 'fa-solid fa-rotate', 'Timing belt', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Hotend', 'fa-solid fa-temperature-high', 'Printer hotend assembly', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Extruder', 'fa-solid fa-arrow-down', 'Filament extruder', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Build Plate', 'fa-solid fa-square', 'Removable build plate', 1),
((SELECT id FROM categories WHERE name = '3D Printing'), 'Resin', 'fa-solid fa-droplet', 'UV resin bottle', 1);
