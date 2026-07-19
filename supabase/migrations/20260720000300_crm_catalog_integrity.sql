-- CRM workflow additions. Archived vehicles do not reserve a plate for a new active record.
alter table public.vehicles add column mileage integer check (mileage >= 0);
alter table public.vehicles add column mileage_recorded_at timestamptz;
create unique index vehicles_active_plate_unique_idx on public.vehicles(plate_normalized) where plate_normalized is not null and archived_at is null;
