-- Add missing tetapan:manage_all_units permission
-- Run this in Supabase SQL Editor

-- 1. Add the permission if it doesn't exist
INSERT INTO permissions (resource, action, display_name, description) VALUES
('tetapan', 'manage_all_units', 'Urus Semua Unit', 'Boleh melihat dan mengurus fail dari semua unit')
ON CONFLICT (resource, action) DO NOTHING;

-- 2. Assign to 'semua' role (Super Admin)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'semua'
AND p.resource = 'tetapan'
AND p.action = 'manage_all_units'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Assign to 'admin' role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.resource = 'tetapan'
AND p.action = 'manage_all_units'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Verify the permission was added
SELECT 
  r.name as role_name,
  r.display_name,
  p.resource,
  p.action,
  p.display_name as permission_name
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.resource = 'tetapan'
AND r.name IN ('semua', 'admin')
ORDER BY r.name, p.action;
