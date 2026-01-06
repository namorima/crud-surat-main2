-- RBAC Seed Data for CRUD Surat Application
-- Run this AFTER rbac-schema.sql to populate default roles and permissions

-- ============================================
-- INSERT DEFAULT PERMISSIONS
-- ============================================

INSERT INTO permissions (resource, action, display_name, description) VALUES
-- Surat permissions
('surat', 'view', 'Lihat Surat', 'Boleh melihat senarai dan detail surat'),
('surat', 'create', 'Tambah Surat', 'Boleh menambah surat baru'),
('surat', 'edit', 'Edit Surat', 'Boleh mengedit surat sedia ada'),
('surat', 'delete', 'Padam Surat', 'Boleh memadam surat'),

-- Bayaran permissions
('bayaran', 'view', 'Lihat Bayaran', 'Boleh melihat senarai dan detail bayaran'),
('bayaran', 'create', 'Tambah Bayaran', 'Boleh menambah bayaran baru'),
('bayaran', 'edit', 'Edit Bayaran', 'Boleh mengedit bayaran sedia ada'),
('bayaran', 'delete', 'Padam Bayaran', 'Boleh memadam bayaran'),
('bayaran', 'approve', 'Approve Bayaran', 'Boleh approve bayaran (untuk KEWANGAN)'),

-- Statistik permissions
('statistik', 'view', 'Lihat Statistik', 'Boleh melihat dashboard statistik'),

-- Pengguna permissions
('pengguna', 'view', 'Lihat Pengguna', 'Boleh melihat senarai pengguna'),
('pengguna', 'create', 'Tambah Pengguna', 'Boleh menambah pengguna baru'),
('pengguna', 'edit', 'Edit Pengguna', 'Boleh mengedit pengguna sedia ada'),
('pengguna', 'delete', 'Padam Pengguna', 'Boleh memadam pengguna'),
('pengguna', 'manage_roles', 'Urus Role', 'Boleh mengurus role dan permissions'),

-- Tetapan permissions
('tetapan', 'view', 'Lihat Tetapan', 'Boleh melihat tetapan'),
('tetapan', 'edit', 'Edit Tetapan', 'Boleh mengedit tetapan'),

-- Dashboard permissions
('dashboard', 'view', 'Lihat Dashboard', 'Boleh melihat dashboard utama')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================
-- INSERT DEFAULT ROLES
-- ============================================

INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('semua', 'Super Admin', 'Akses penuh kepada semua fungsi sistem', TRUE),
('admin', 'Admin', 'Akses admin standard', TRUE),
('PERLADANGAN', 'Perladangan', 'Akses untuk unit Perladangan', TRUE),
('PENGURUS', 'Pengurus', 'Akses untuk Pengurus', TRUE),
('KEWANGAN', 'Kewangan', 'Akses untuk unit Kewangan', TRUE),
('PEMASARAN', 'Pemasaran', 'Akses untuk unit Pemasaran', TRUE),
('PERANCANG', 'Perancang', 'Akses untuk Perancang', TRUE),
('MSPO', 'MSPO', 'Akses untuk MSPO', TRUE),
('viewer', 'Viewer', 'Akses view sahaja', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- Super Admin (semua) - Full access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'semua'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin - Same as super admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- KEWANGAN - Focus on bayaran only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'KEWANGAN'
AND (
  (p.resource = 'bayaran') OR
  (p.resource = 'dashboard' AND p.action = 'view')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PERLADANGAN - Access to surat, bayaran, dashboard, tetapan
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'PERLADANGAN'
AND (
  (p.resource = 'surat') OR
  (p.resource = 'bayaran') OR
  (p.resource = 'dashboard' AND p.action = 'view') OR
  (p.resource = 'tetapan')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PENGURUS - Similar to PERLADANGAN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'PENGURUS'
AND (
  (p.resource = 'surat') OR
  (p.resource = 'bayaran') OR
  (p.resource = 'dashboard' AND p.action = 'view') OR
  (p.resource = 'tetapan')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PEMASARAN - Access to surat, statistik, tetapan
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'PEMASARAN'
AND (
  (p.resource = 'surat' AND p.action = 'view') OR
  (p.resource = 'statistik') OR
  (p.resource = 'dashboard' AND p.action = 'view') OR
  (p.resource = 'tetapan' AND p.action = 'view')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- PERANCANG - Access to surat, statistik, tetapan
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'PERANCANG'
AND (
  (p.resource = 'surat' AND p.action = 'view') OR
  (p.resource = 'statistik') OR
  (p.resource = 'dashboard' AND p.action = 'view') OR
  (p.resource = 'tetapan' AND p.action = 'view')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MSPO - Access to surat, statistik, tetapan
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'MSPO'
AND (
  (p.resource = 'surat' AND p.action = 'view') OR
  (p.resource = 'statistik') OR
  (p.resource = 'dashboard' AND p.action = 'view') OR
  (p.resource = 'tetapan' AND p.action = 'view')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Viewer - View only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'viewer'
AND p.action = 'view'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- MIGRATE EXISTING USERS TO NEW ROLE SYSTEM
-- ============================================

-- Update users.role_id based on their legacy role
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role = r.name
AND u.role_id IS NULL;

-- For any users with role 'semua', map to super admin
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role = 'semua'
AND r.name = 'semua'
AND u.role_id IS NULL;

-- Verify migration
SELECT 
  u.username,
  u.name,
  u.role as old_role,
  r.display_name as new_role,
  COUNT(p.id) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY u.username, u.name, u.role, r.display_name
ORDER BY u.username;
