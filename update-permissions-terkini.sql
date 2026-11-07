-- Permissions brought up to date with the app (Pengguna → Role & Permissions).
-- * Names and descriptions say what each permission opens today.
-- * bayaran:approve is removed: nothing in the app checks it.
-- * statistik:view is removed: Statistik was merged into the Dashboard, and
--   every role that had it also has dashboard:view.
-- Safe to run more than once.

begin;

delete from role_permissions
where permission_id in (
  select id from permissions
  where (resource = 'bayaran' and action = 'approve') or (resource = 'statistik' and action = 'view')
);
delete from permissions
where (resource = 'bayaran' and action = 'approve') or (resource = 'statistik' and action = 'view');

update permissions as p set display_name = v.display_name, description = v.description
from (values
  ('dashboard', 'view',             'Lihat Dashboard',            'Dashboard Bayaran dan Surat: KPI, carta, butiran kontrak dan PDF'),
  ('surat',     'view',             'Lihat Surat',                'Senarai dan Maklumat Surat, komen, Surat Tertunggak dan Download Laporan Surat'),
  ('surat',     'create',           'Tambah Surat',               'Tambah surat baru dan Respon kepada surat'),
  ('surat',     'edit',             'Edit Surat',                 'Edit semua medan surat, termasuk status dan tarikh selesai'),
  ('surat',     'delete',           'Padam Surat',                'Padam surat'),
  ('bayaran',   'view',             'Lihat Rekod Bayaran',        'Senarai dan butiran Rekod Bayaran, Dashboard Bayaran dan Download Laporan Bayaran'),
  ('bayaran',   'create',           'Tambah Rekod Bayaran',       'Tambah rekod bayaran, Respon To Bayaran dari surat dan tambah Kawasan dari borang'),
  ('bayaran',   'edit',             'Edit Rekod Bayaran',         'Edit rekod bayaran dan kemaskini status secara pukal'),
  ('bayaran',   'delete',           'Padam Rekod Bayaran',        'Padam rekod bayaran'),
  ('pengguna',  'view',             'Lihat Pengguna',             'Buka halaman Pengguna dan senarai akaun'),
  ('pengguna',  'create',           'Tambah Pengguna',            'Tambah akaun baru, termasuk akaun ganti bila staf bertukar unit'),
  ('pengguna',  'edit',             'Edit Pengguna',              'Edit akaun dan reset kata laluan pengguna'),
  ('pengguna',  'delete',           'Padam Pengguna',             'Padam akaun pengguna'),
  ('pengguna',  'manage_roles',     'Urus Role & Unit PIC',       'Tab Role & Permissions dan tab Unit PIC'),
  ('tetapan',   'view',             'Lihat Tetapan',              'Buka Tetapan: Setup Fail dan Setup Locker unit sendiri'),
  ('tetapan',   'edit',             'Edit Tetapan',               'Tambah, edit dan padam dalam Tetapan (fail, locker, kontrak, kontraktor, kawasan)'),
  ('tetapan',   'manage_all_units', 'Urus Semua Unit & Kontrak',  'Fail dan locker semua unit, serta tab Pautan Kongsi, Kontrak, Kontraktor dan Kawasan')
) as v(resource, action, display_name, description)
where p.resource = v.resource and p.action = v.action;

commit;
