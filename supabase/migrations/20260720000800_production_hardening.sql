-- Production hardening. Keep operational state changes behind authorized RPCs.

revoke execute on all functions in schema public from public, anon;

revoke insert, update, delete on public.appointments, public.appointment_services,
  public.work_orders, public.work_order_services, public.work_order_parts,
  public.parts, public.inventory_movements, public.invoices, public.invoice_items,
  public.payments, public.attachments, public.service_catalog from authenticated;

-- Direct writes to protected operational tables would bypass the state-machine
-- and ledger functions. Reads remain governed by the existing RLS matrix.
revoke insert, update, delete on public.business_settings from authenticated;

create extension if not exists btree_gist;
alter table public.appointments drop constraint if exists appointments_active_technician_no_overlap;
alter table public.appointments add constraint appointments_active_technician_no_overlap
  exclude using gist (
    assigned_technician_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (
    assigned_technician_id is not null
    and status not in ('cancelled', 'no_show', 'completed')
  ) deferrable initially immediate;

create index if not exists payments_received_at_idx on public.payments(received_at desc)
  where status = 'recorded';
create index if not exists work_orders_completed_at_idx on public.work_orders(completed_at desc)
  where status in ('completed', 'invoiced');

drop policy if exists "services_admin_front_desk" on public.service_catalog;
create policy "services_admin_write" on public.service_catalog for all to authenticated
  using (public.has_role(array['admin']::public.staff_role[]))
  with check (public.has_role(array['admin']::public.staff_role[]));

create or replace function public.prevent_last_admin_loss()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.role = 'admin' and old.account_status = 'active'
    and (new.role <> 'admin' or new.account_status <> 'active')
    and not exists (
      select 1 from public.profiles
      where id <> old.id and role = 'admin' and account_status = 'active'
    ) then
    raise exception 'At least one active administrator is required';
  end if;
  if old.id = auth.uid() and old.role = 'admin' and new.role <> 'admin' then
    raise exception 'Administrators cannot remove their own administrator role';
  end if;
  return new;
end; $$;
drop trigger if exists profiles_keep_active_admin on public.profiles;
create trigger profiles_keep_active_admin before update of role, account_status on public.profiles
  for each row execute procedure public.prevent_last_admin_loss();

create or replace function public.save_part(
  target_part_id uuid, part_name text, part_sku text, part_category text, part_unit text,
  threshold numeric, cost_minor integer, selling_minor integer
) returns uuid language plpgsql security definer set search_path=public as $$
declare saved_id uuid;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then
    raise exception 'Operational staff required';
  end if;
  if threshold < 0 or selling_minor < 0 or nullif(trim(part_name), '') is null or nullif(trim(part_unit), '') is null then
    raise exception 'Invalid part details';
  end if;
  if cost_minor is not null and not public.has_role(array['admin']::public.staff_role[]) then
    raise exception 'Administrator access required for cost information';
  end if;
  if target_part_id is null then
    raise exception 'Part identifier is required';
  end if;
  update public.parts set
    name = trim(part_name), sku = nullif(trim(part_sku), ''), category = nullif(trim(part_category), ''),
    unit = trim(part_unit), reorder_threshold = threshold, sell_price_minor = selling_minor,
    cost_price_minor = case when public.has_role(array['admin']::public.staff_role[]) then cost_minor else cost_price_minor end
  where id = target_part_id
  returning id into saved_id;
  if saved_id is null then raise exception 'Part not found'; end if;
  return saved_id;
end; $$;

create or replace function public.set_part_archived(target_part_id uuid, archived boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  update public.parts set archived_at = case when archived then now() else null end,
    archived_by = case when archived then auth.uid() else null end where id = target_part_id;
  if not found then raise exception 'Part not found'; end if;
end; $$;

create or replace function public.save_service(
  target_service_id uuid, service_name text, service_category text, service_description text,
  price_minor integer, duration_minutes integer
) returns uuid language plpgsql security definer set search_path=public as $$
declare saved_id uuid;
begin
  if not public.has_role(array['admin']::public.staff_role[]) then raise exception 'Administrator access required'; end if;
  if nullif(trim(service_name), '') is null or price_minor < 0 or duration_minutes < 1 then raise exception 'Invalid service details'; end if;
  if target_service_id is null then
    insert into public.service_catalog(name, category, description, standard_price_minor, default_duration_minutes)
    values(trim(service_name), nullif(trim(service_category), ''), nullif(trim(service_description), ''), price_minor, duration_minutes)
    returning id into saved_id;
  else
    update public.service_catalog set name = trim(service_name), category = nullif(trim(service_category), ''),
      description = nullif(trim(service_description), ''), standard_price_minor = price_minor,
      default_duration_minutes = duration_minutes where id = target_service_id returning id into saved_id;
  end if;
  if saved_id is null then raise exception 'Service not found'; end if;
  return saved_id;
end; $$;

create or replace function public.set_customer_archived(target_customer_id uuid, archived boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then
    raise exception 'Operational staff required';
  end if;
  update public.customers set archived_at = case when archived then now() else null end,
    archived_by = case when archived then auth.uid() else null end
  where id = target_customer_id;
  if not found then raise exception 'Customer not found'; end if;
end; $$;

create or replace function public.set_vehicle_archived(target_vehicle_id uuid, archived boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then
    raise exception 'Operational staff required';
  end if;
  update public.vehicles set archived_at = case when archived then now() else null end,
    archived_by = case when archived then auth.uid() else null end
  where id = target_vehicle_id;
  if not found then raise exception 'Vehicle not found'; end if;
end; $$;

create or replace function public.set_service_archived(target_service_id uuid, archived boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin']::public.staff_role[]) then raise exception 'Administrator access required'; end if;
  update public.service_catalog set archived_at = case when archived then now() else null end,
    archived_by = case when archived then auth.uid() else null end where id = target_service_id;
  if not found then raise exception 'Service not found'; end if;
end; $$;

create or replace function public.invoice_items_match_total()
returns trigger language plpgsql security definer set search_path=public as $$
declare target_invoice uuid; expected_total integer; actual_total integer;
begin
  target_invoice := coalesce(new.invoice_id, old.invoice_id, new.id, old.id);
  select total_minor into expected_total from public.invoices where id = target_invoice;
  if expected_total is null then return null; end if;
  select coalesce(sum(line_total_minor), 0)::integer into actual_total from public.invoice_items where invoice_id = target_invoice;
  if actual_total <> expected_total then raise exception 'Invoice total must equal its line-item total'; end if;
  return null;
end; $$;
drop trigger if exists invoice_items_total_guard on public.invoice_items;
create constraint trigger invoice_items_total_guard after insert or update or delete on public.invoice_items
  deferrable initially deferred for each row execute procedure public.invoice_items_match_total();

create or replace function public.can_access_storage_object(target_bucket text, target_path text)
returns boolean language sql stable security definer set search_path=public,storage as $$
  select public.has_role(array['admin','front_desk']::public.staff_role[])
    and target_bucket = 'vehicle-attachments'
    and exists(select 1 from public.attachments a where a.bucket_id = target_bucket and a.object_path = target_path and a.archived_at is null)
  or (target_bucket = 'vehicle-attachments' and exists (
    select 1 from public.attachments a where a.bucket_id = target_bucket and a.object_path = target_path
      and a.archived_at is null and a.work_order_id is not null and public.is_assigned_technician(a.work_order_id)
  ));
$$;
create or replace function public.can_upload_work_order_attachment(target_bucket text, target_path text)
returns boolean language sql stable security definer set search_path=public as $$
  select target_bucket = 'vehicle-attachments'
    and split_part(target_path, '/', 1) = 'work-orders'
    and nullif(split_part(target_path, '/', 2), '') is not null
    and (public.has_role(array['admin','front_desk']::public.staff_role[])
      or public.is_assigned_technician(nullif(split_part(target_path, '/', 2), '')::uuid));
$$;

-- Application-facing functions only. Internal helpers remain non-callable.
grant execute on function public.current_staff_role(), public.is_active_staff(), public.has_role(public.staff_role[]), public.is_assigned_technician(uuid) to authenticated;
grant execute on function public.create_work_order(uuid,uuid,uuid,text,text,timestamptz,integer,jsonb), public.update_work_order_details(uuid,uuid,text,text,timestamptz,integer,jsonb), public.transition_work_order(uuid,public.work_order_status,text), public.add_technician_note(uuid,text) to authenticated;
grant execute on function public.save_appointment(uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,jsonb,integer,boolean), public.reschedule_appointment(uuid,timestamptz,timestamptz,integer,boolean), public.transition_appointment(uuid,public.appointment_status,integer), public.convert_appointment_to_work_order(uuid,integer) to authenticated;
grant execute on function public.restock_part(uuid,numeric,text), public.create_part(text,text,text,text,numeric,numeric,integer,integer), public.correct_inventory(uuid,numeric,text), public.confirm_work_order_part_usage(uuid,uuid,numeric), public.reverse_work_order_part_usage(uuid,text), public.save_part(uuid,text,text,text,text,numeric,integer,integer), public.set_part_archived(uuid,boolean) to authenticated;
grant execute on function public.create_invoice_from_work_order(uuid), public.record_offline_payment(uuid,public.payment_method,text,text), public.void_invoice(uuid,text), public.register_work_order_attachment(uuid,uuid,public.attachment_category,text,text,text,integer,text), public.save_service(uuid,text,text,text,integer,integer), public.set_service_archived(uuid,boolean) to authenticated;
grant execute on function public.set_customer_archived(uuid,boolean), public.set_vehicle_archived(uuid,boolean) to authenticated;
