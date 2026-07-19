-- AutoCare Pro schema v1. Money is stored in integer minor units.
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.staff_role as enum ('admin','front_desk','technician');
create type public.staff_account_status as enum ('active','inactive');
create type public.appointment_status as enum ('scheduled','checked_in','cancelled','no_show');
create type public.work_order_status as enum ('draft','assigned','in_progress','ready_for_review','completed','invoiced','cancelled');
create type public.invoice_status as enum ('issued','paid','void');
create type public.payment_method as enum ('cash','card_in_person');
create type public.payment_status as enum ('recorded','voided');
create type public.attachment_category as enum ('before','damage','after','vehicle_document','work_order_document');
create type public.inventory_movement_type as enum ('restock','work_order_usage','usage_reversal','manual_adjustment');
create type public.invoice_item_source_type as enum ('service','part');

create function public.normalize_search_text(value text) returns text language sql immutable set search_path = public as $$ select lower(regexp_replace(trim(coalesce(value,'')), '\\s+', ' ', 'g')); $$;
create function public.normalize_phone(value text) returns text language sql immutable set search_path = public as $$ select nullif(regexp_replace(coalesce(value,''), '[^0-9+]', '', 'g'),''); $$;
create function public.normalize_plate(value text) returns text language sql immutable set search_path = public as $$ select nullif(upper(regexp_replace(coalesce(value,''), '[^A-Za-z0-9]', '', 'g')),''); $$;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict, email text not null unique,
 display_name text not null check (char_length(trim(display_name)) between 2 and 120), role public.staff_role not null,
 account_status public.staff_account_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.business_settings (
 singleton boolean primary key default true check (singleton), business_name text not null default 'AutoCare Pro', business_phone text, business_address text,
 timezone text not null default 'Asia/Kabul', currency_code char(3) not null default 'AFN' check (currency_code ~ '^[A-Z]{3}$'), invoice_prefix text not null default 'ACP-',
 next_invoice_sequence bigint not null default 1 check (next_invoice_sequence > 0), default_appointment_duration_minutes integer not null default 60 check (default_appointment_duration_minutes between 15 and 480), business_hours jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table public.customers (
 id uuid primary key default gen_random_uuid(), full_name text not null check (char_length(trim(full_name)) between 2 and 160), name_normalized text not null, phone text, phone_normalized text, email text, address text, notes text,
 archived_at timestamptz, archived_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.vehicles (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete restrict, plate_number text, plate_normalized text, vin text unique, make text, model text, model_year integer check (model_year between 1886 and 2100), color text, notes text,
 archived_at timestamptz, archived_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.service_catalog (
 id uuid primary key default gen_random_uuid(), name text not null check (char_length(trim(name)) between 2 and 160), name_normalized text not null unique, category text, description text, standard_price_minor integer not null check (standard_price_minor >= 0), default_duration_minutes integer not null default 60 check (default_duration_minutes between 1 and 1440),
 archived_at timestamptz, archived_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.appointments (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete restrict, vehicle_id uuid not null references public.vehicles(id) on delete restrict, requested_service_summary text not null, starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at), status public.appointment_status not null default 'scheduled', notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.work_orders (
 id uuid primary key default gen_random_uuid(), public_number bigint generated always as identity unique, customer_id uuid not null references public.customers(id) on delete restrict, vehicle_id uuid not null references public.vehicles(id) on delete restrict, appointment_id uuid unique references public.appointments(id) on delete restrict, assigned_technician_id uuid references public.profiles(id) on delete restrict, status public.work_order_status not null default 'draft', intake_notes text, technical_notes text, checked_in_at timestamptz, completed_at timestamptz, cancelled_at timestamptz, cancellation_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
alter table public.appointments add column work_order_id uuid unique references public.work_orders(id) on delete restrict;
create table public.work_order_services (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references public.work_orders(id) on delete restrict, service_catalog_id uuid references public.service_catalog(id) on delete restrict, service_name_snapshot text not null, quantity numeric(14,3) not null default 1 check(quantity>0), unit_price_minor integer not null check(unit_price_minor>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.parts (
 id uuid primary key default gen_random_uuid(), sku text not null, sku_normalized text not null unique, name text not null check(char_length(trim(name)) between 2 and 160), unit text not null default 'each', quantity_on_hand numeric(14,3) not null default 0 check(quantity_on_hand>=0), reorder_threshold numeric(14,3) not null default 0 check(reorder_threshold>=0), cost_price_minor integer check(cost_price_minor>=0), sell_price_minor integer not null check(sell_price_minor>=0),
 archived_at timestamptz, archived_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null
);
create table public.work_order_parts (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null references public.work_orders(id) on delete restrict, part_id uuid not null references public.parts(id) on delete restrict, quantity numeric(14,3) not null check(quantity>0), sku_snapshot text not null, part_name_snapshot text not null, unit_snapshot text not null, unit_price_minor integer not null check(unit_price_minor>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null, unique(work_order_id,part_id)
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), part_id uuid not null references public.parts(id) on delete restrict, work_order_part_id uuid references public.work_order_parts(id) on delete restrict, movement_type public.inventory_movement_type not null, quantity_delta numeric(14,3) not null check(quantity_delta<>0), resulting_quantity numeric(14,3) not null check(resulting_quantity>=0), reason text,
 created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null
);
create table public.invoices (
 id uuid primary key default gen_random_uuid(), work_order_id uuid not null unique references public.work_orders(id) on delete restrict, invoice_number text not null unique, status public.invoice_status not null default 'issued', currency_code char(3) not null check(currency_code ~ '^[A-Z]{3}$'), subtotal_minor integer not null check(subtotal_minor>=0), total_minor integer not null check(total_minor>=0), issued_at timestamptz not null default now(), voided_at timestamptz, voided_by uuid references auth.users(id) on delete set null, void_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null, check(total_minor=subtotal_minor)
);
create table public.invoice_items (
 id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete restrict, source_type public.invoice_item_source_type not null, source_line_id uuid, description text not null, quantity numeric(14,3) not null check(quantity>0), unit_price_minor integer not null check(unit_price_minor>=0), line_total_minor integer not null check(line_total_minor>=0), display_order integer not null default 0 check(display_order>=0), created_at timestamptz not null default now()
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), invoice_id uuid not null unique references public.invoices(id) on delete restrict, method public.payment_method not null, status public.payment_status not null default 'recorded', amount_minor integer not null check(amount_minor>=0), reference text, notes text, received_at timestamptz not null default now(), voided_at timestamptz, voided_by uuid references auth.users(id) on delete set null, void_reason text, created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null
);
create table public.attachments (
 id uuid primary key default gen_random_uuid(), vehicle_id uuid not null references public.vehicles(id) on delete restrict, work_order_id uuid references public.work_orders(id) on delete restrict, category public.attachment_category not null, bucket_id text not null check(bucket_id in ('vehicle-attachments','invoice-pdfs')), object_path text not null unique, original_filename text not null, mime_type text not null, byte_size integer not null check(byte_size>0), caption text, archived_at timestamptz, archived_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null
);
create table public.activity_log (
 id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, action text not null, before_data jsonb, after_data jsonb, created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null
);

create index customers_name_trgm_idx on public.customers using gin(name_normalized gin_trgm_ops);
create index customers_phone_idx on public.customers(phone_normalized) where phone_normalized is not null;
create index vehicles_customer_idx on public.vehicles(customer_id); create index vehicles_plate_idx on public.vehicles(plate_normalized) where plate_normalized is not null;
create index appointments_schedule_idx on public.appointments(starts_at,status); create index work_orders_assigned_idx on public.work_orders(assigned_technician_id,status,updated_at desc); create index work_orders_status_idx on public.work_orders(status,updated_at desc);
create index parts_low_stock_idx on public.parts(quantity_on_hand,reorder_threshold) where archived_at is null; create index inventory_movements_part_idx on public.inventory_movements(part_id,created_at desc); create index invoices_status_idx on public.invoices(status,issued_at desc); create index activity_log_entity_idx on public.activity_log(entity_type,entity_id,created_at desc);

create function public.set_audit_fields() returns trigger language plpgsql security definer set search_path=public as $$ begin if tg_op='INSERT' and auth.uid() is not null then new.created_by:=auth.uid(); end if; new.updated_at:=now(); if auth.uid() is not null then new.updated_by:=auth.uid(); end if; return new; end; $$;
create function public.touch_updated_at() returns trigger language plpgsql security definer set search_path=public as $$ begin new.updated_at:=now(); if auth.uid() is not null then new.updated_by:=auth.uid(); end if; return new; end; $$;
create function public.set_customer_normalized_fields() returns trigger language plpgsql set search_path=public as $$ begin new.name_normalized:=public.normalize_search_text(new.full_name); new.phone_normalized:=public.normalize_phone(new.phone); return new; end; $$;
create function public.set_vehicle_normalized_fields() returns trigger language plpgsql set search_path=public as $$ begin new.plate_normalized:=public.normalize_plate(new.plate_number); if new.vin is not null then new.vin:=upper(trim(new.vin)); end if; return new; end; $$;
create function public.set_service_normalized_fields() returns trigger language plpgsql set search_path=public as $$ begin new.name_normalized:=public.normalize_search_text(new.name); return new; end; $$;
create function public.set_part_normalized_fields() returns trigger language plpgsql set search_path=public as $$ begin new.sku_normalized:=public.normalize_search_text(new.sku); return new; end; $$;
create function public.assert_customer_vehicle_match() returns trigger language plpgsql set search_path=public as $$ begin if not exists(select 1 from public.vehicles where id=new.vehicle_id and customer_id=new.customer_id) then raise exception 'Vehicle must belong to the selected customer'; end if; return new; end; $$;
create function public.assert_assigned_technician() returns trigger language plpgsql set search_path=public as $$ begin if new.assigned_technician_id is not null and not exists(select 1 from public.profiles where id=new.assigned_technician_id and role='technician' and account_status='active') then raise exception 'Assigned staff member must be an active technician'; end if; return new; end; $$;
create function public.assert_attachment_match() returns trigger language plpgsql set search_path=public as $$ begin if new.work_order_id is not null and not exists(select 1 from public.work_orders where id=new.work_order_id and vehicle_id=new.vehicle_id) then raise exception 'Attachment work order must belong to its vehicle'; end if; return new; end; $$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public,auth as $$ declare requested_role public.staff_role; requested_name text; begin requested_role:=coalesce((new.raw_app_meta_data->>'role')::public.staff_role,'technician'); requested_name:=coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),split_part(new.email,'@',1)); insert into public.profiles(id,email,display_name,role) values(new.id,lower(new.email),requested_name,requested_role); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create trigger customers_normalize before insert or update of full_name,phone on public.customers for each row execute procedure public.set_customer_normalized_fields();
create trigger vehicles_normalize before insert or update of plate_number,vin on public.vehicles for each row execute procedure public.set_vehicle_normalized_fields();
create trigger services_normalize before insert or update of name on public.service_catalog for each row execute procedure public.set_service_normalized_fields();
create trigger parts_normalize before insert or update of sku on public.parts for each row execute procedure public.set_part_normalized_fields();
create trigger appointments_customer_vehicle before insert or update of customer_id,vehicle_id on public.appointments for each row execute procedure public.assert_customer_vehicle_match();
create trigger work_orders_customer_vehicle before insert or update of customer_id,vehicle_id on public.work_orders for each row execute procedure public.assert_customer_vehicle_match();
create trigger work_orders_technician before insert or update of assigned_technician_id on public.work_orders for each row execute procedure public.assert_assigned_technician();
create trigger attachments_match before insert or update of work_order_id,vehicle_id on public.attachments for each row execute procedure public.assert_attachment_match();
create trigger profiles_audit before insert or update on public.profiles for each row execute procedure public.set_audit_fields();
create trigger business_settings_audit before update on public.business_settings for each row execute procedure public.touch_updated_at();
create trigger customers_audit before insert or update on public.customers for each row execute procedure public.set_audit_fields(); create trigger vehicles_audit before insert or update on public.vehicles for each row execute procedure public.set_audit_fields(); create trigger services_audit before insert or update on public.service_catalog for each row execute procedure public.set_audit_fields(); create trigger appointments_audit before insert or update on public.appointments for each row execute procedure public.set_audit_fields(); create trigger work_orders_audit before insert or update on public.work_orders for each row execute procedure public.set_audit_fields(); create trigger work_order_services_audit before insert or update on public.work_order_services for each row execute procedure public.set_audit_fields(); create trigger parts_audit before insert or update on public.parts for each row execute procedure public.set_audit_fields(); create trigger work_order_parts_audit before insert or update on public.work_order_parts for each row execute procedure public.set_audit_fields(); create trigger invoices_audit before insert or update on public.invoices for each row execute procedure public.set_audit_fields();
insert into public.business_settings(singleton) values(true);

create function public.current_staff_role() returns public.staff_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() and account_status='active'; $$;
create function public.is_active_staff() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and account_status='active'); $$;
create function public.has_role(allowed_roles public.staff_role[]) returns boolean language sql stable security definer set search_path=public as $$ select public.current_staff_role()=any(allowed_roles); $$;
create function public.is_assigned_technician(target_work_order_id uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.work_orders where id=target_work_order_id and assigned_technician_id=auth.uid()) and public.has_role(array['technician']::public.staff_role[]); $$;

alter table public.profiles enable row level security; alter table public.business_settings enable row level security; alter table public.customers enable row level security; alter table public.vehicles enable row level security; alter table public.service_catalog enable row level security; alter table public.appointments enable row level security; alter table public.work_orders enable row level security; alter table public.work_order_services enable row level security; alter table public.parts enable row level security; alter table public.work_order_parts enable row level security; alter table public.inventory_movements enable row level security; alter table public.invoices enable row level security; alter table public.invoice_items enable row level security; alter table public.payments enable row level security; alter table public.attachments enable row level security; alter table public.activity_log enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using(id=auth.uid() or public.has_role(array['admin']::public.staff_role[]));
create policy "profiles_update_admin" on public.profiles for update to authenticated using(public.has_role(array['admin']::public.staff_role[])) with check(public.has_role(array['admin']::public.staff_role[]));
create policy "settings_select_staff" on public.business_settings for select to authenticated using(public.is_active_staff());
create policy "settings_update_admin" on public.business_settings for update to authenticated using(public.has_role(array['admin']::public.staff_role[])) with check(public.has_role(array['admin']::public.staff_role[]));
create policy "customers_admin_front_desk" on public.customers for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "customers_technician_select" on public.customers for select to authenticated using(exists(select 1 from public.work_orders where work_orders.customer_id=customers.id and public.is_assigned_technician(work_orders.id)));
create policy "vehicles_admin_front_desk" on public.vehicles for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "vehicles_technician_select" on public.vehicles for select to authenticated using(exists(select 1 from public.work_orders where work_orders.vehicle_id=vehicles.id and public.is_assigned_technician(work_orders.id)));
create policy "services_staff_select" on public.service_catalog for select to authenticated using(public.is_active_staff());
create policy "services_admin_front_desk" on public.service_catalog for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "appointments_admin_front_desk" on public.appointments for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "appointments_technician_select" on public.appointments for select to authenticated using(exists(select 1 from public.work_orders where work_orders.appointment_id=appointments.id and public.is_assigned_technician(work_orders.id)));
create policy "work_orders_admin_front_desk" on public.work_orders for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "work_orders_technician_select" on public.work_orders for select to authenticated using(public.is_assigned_technician(id));
create policy "work_order_services_admin_front_desk" on public.work_order_services for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "work_order_services_technician_select" on public.work_order_services for select to authenticated using(public.is_assigned_technician(work_order_id));
create policy "parts_staff_select" on public.parts for select to authenticated using(public.is_active_staff());
create policy "parts_admin_front_desk" on public.parts for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "work_order_parts_admin_front_desk" on public.work_order_parts for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "work_order_parts_technician_select" on public.work_order_parts for select to authenticated using(public.is_assigned_technician(work_order_id));
create policy "inventory_admin_front_desk_select" on public.inventory_movements for select to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "inventory_technician_select" on public.inventory_movements for select to authenticated using(work_order_part_id is not null and exists(select 1 from public.work_order_parts where work_order_parts.id=inventory_movements.work_order_part_id and public.is_assigned_technician(work_order_parts.work_order_id)));
create policy "invoices_admin_front_desk" on public.invoices for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "invoice_items_admin_front_desk" on public.invoice_items for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "payments_admin_front_desk" on public.payments for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "attachments_admin_front_desk" on public.attachments for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "attachments_technician_select" on public.attachments for select to authenticated using(work_order_id is not null and public.is_assigned_technician(work_order_id));
create policy "activity_admin_front_desk_select" on public.activity_log for select to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "activity_technician_select" on public.activity_log for select to authenticated using(entity_type='work_order' and public.is_assigned_technician(entity_id));

revoke all on all tables in schema public from anon;
grant select,insert,update on public.profiles,public.business_settings,public.customers,public.vehicles,public.service_catalog,public.appointments,public.work_orders,public.work_order_services,public.parts,public.work_order_parts,public.invoices,public.invoice_items,public.payments,public.attachments to authenticated;
grant select on public.inventory_movements,public.activity_log to authenticated;
grant execute on function public.current_staff_role(),public.is_active_staff(),public.has_role(public.staff_role[]),public.is_assigned_technician(uuid) to authenticated;
alter publication supabase_realtime add table public.appointments,public.work_orders,public.parts;
