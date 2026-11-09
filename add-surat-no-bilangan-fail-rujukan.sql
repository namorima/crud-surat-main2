-- Surat: "No Bilangan Surat" (Tindakan, under Fail) and
-- Fail: "No Rujukan Fail" (Tetapan → Setup Fail, under No. Fail).
-- Both optional text; NULL on older rows. Safe to run more than once.

alter table surat add column if not exists no_bilangan_surat text;
alter table fail add column if not exists no_rujukan_fail text;

comment on column surat.no_bilangan_surat is 'No Bilangan Surat (nombor rujukan surat itu sendiri); optional';
comment on column fail.no_rujukan_fail is 'No Rujukan Fail; optional';
