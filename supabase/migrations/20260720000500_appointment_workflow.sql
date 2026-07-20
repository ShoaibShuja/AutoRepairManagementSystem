-- Staff appointment scheduling, conflict controls, and work-order conversion.
alter table public.appointments add column assigned_technician_id uuid references public.profiles(id) on delete restrict;
alter table public.appointments add column revision integer not null default 1 check (revision > 0);
create table public.appointment_services (
  id uuid primary key default gen_random_uuid(), appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_catalog_id uuid not null references public.service_catalog(id) on delete restrict,
  created_at timestamptz not null default now(), created_by uuid references auth.users(id) on delete set null,
  unique(appointment_id, service_catalog_id)
);
create index appointments_technician_time_idx on public.appointments(assigned_technician_id, starts_at, ends_at) where status not in ('cancelled','no_show','completed');
create index appointment_services_appointment_idx on public.appointment_services(appointment_id);

create function public.write_appointment_activity(target_appointment_id uuid, event_action text, event_data jsonb default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.activity_log(entity_type, entity_id, action, after_data, created_by)
  values ('appointment', target_appointment_id, event_action, event_data, auth.uid());
end; $$;

create function public.assert_appointment_conflict(target_appointment_id uuid, target_technician_id uuid, target_starts_at timestamptz, target_ends_at timestamptz, allow_conflict boolean default false)
returns void language plpgsql security definer set search_path=public as $$
begin
  if target_technician_id is null then return; end if;
  if allow_conflict and public.has_role(array['admin']::public.staff_role[]) then return; end if;
  if exists(select 1 from public.appointments where id <> target_appointment_id and assigned_technician_id=target_technician_id and status not in ('cancelled','no_show','completed') and starts_at < target_ends_at and ends_at > target_starts_at) then raise exception 'The assigned technician already has an overlapping appointment'; end if;
end; $$;

create function public.save_appointment(target_appointment_id uuid, target_customer_id uuid, target_vehicle_id uuid, target_technician_id uuid, target_starts_at timestamptz, target_ends_at timestamptz, target_notes text, selected_services jsonb, expected_revision integer default null, allow_conflict boolean default false)
returns uuid language plpgsql security definer set search_path=public as $$
declare appointment_id uuid; service_name_list text;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  if target_ends_at <= target_starts_at then raise exception 'End time must be after start time'; end if;
  if jsonb_typeof(selected_services) <> 'array' or jsonb_array_length(selected_services)=0 then raise exception 'At least one service is required'; end if;
  if not exists(select 1 from public.vehicles where id=target_vehicle_id and customer_id=target_customer_id and archived_at is null) then raise exception 'Vehicle must belong to the selected active customer'; end if;
  if target_technician_id is not null and not exists(select 1 from public.profiles where id=target_technician_id and role='technician' and account_status='active') then raise exception 'Assigned staff member must be an active technician'; end if;
  perform public.assert_appointment_conflict(coalesce(target_appointment_id, '00000000-0000-0000-0000-000000000000'::uuid), target_technician_id, target_starts_at, target_ends_at, allow_conflict);
  select string_agg(name, ', ' order by name) into service_name_list from public.service_catalog where id in (select (value->>'serviceId')::uuid from jsonb_array_elements(selected_services));
  if service_name_list is null or (select count(*) from public.service_catalog where id in (select (value->>'serviceId')::uuid from jsonb_array_elements(selected_services)) and archived_at is null) <> jsonb_array_length(selected_services) then raise exception 'A selected service is unavailable'; end if;
  if target_appointment_id is null then
    insert into public.appointments(customer_id,vehicle_id,assigned_technician_id,requested_service_summary,starts_at,ends_at,notes) values(target_customer_id,target_vehicle_id,target_technician_id,service_name_list,target_starts_at,target_ends_at,target_notes) returning id into appointment_id;
    perform public.write_appointment_activity(appointment_id, 'created');
  else
    update public.appointments set customer_id=target_customer_id,vehicle_id=target_vehicle_id,assigned_technician_id=target_technician_id,requested_service_summary=service_name_list,starts_at=target_starts_at,ends_at=target_ends_at,notes=target_notes,revision=revision+1 where id=target_appointment_id and work_order_id is null and (expected_revision is null or revision=expected_revision) returning id into appointment_id;
    if appointment_id is null then raise exception 'Appointment was changed by another staff member. Refresh and try again'; end if;
  end if;
  delete from public.appointment_services where appointment_id=appointment_id;
  insert into public.appointment_services(appointment_id,service_catalog_id) select appointment_id,(value->>'serviceId')::uuid from jsonb_array_elements(selected_services);
  return appointment_id;
end; $$;

create function public.reschedule_appointment(target_appointment_id uuid, target_starts_at timestamptz, target_ends_at timestamptz, expected_revision integer, allow_conflict boolean default false)
returns void language plpgsql security definer set search_path=public as $$
declare appointment_record record;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  select * into appointment_record from public.appointments where id=target_appointment_id for update;
  if appointment_record.id is null then raise exception 'Appointment not found'; end if;
  if appointment_record.status in ('cancelled','completed','no_show') then raise exception 'Final appointments cannot be rescheduled'; end if;
  if target_ends_at <= target_starts_at then raise exception 'End time must be after start time'; end if;
  perform public.assert_appointment_conflict(target_appointment_id, appointment_record.assigned_technician_id, target_starts_at, target_ends_at, allow_conflict);
  update public.appointments set starts_at=target_starts_at,ends_at=target_ends_at,revision=revision+1 where id=target_appointment_id and revision=expected_revision;
  if not found then raise exception 'Appointment was changed by another staff member. Refresh and try again'; end if;
end; $$;

create function public.transition_appointment(target_appointment_id uuid, next_status public.appointment_status, expected_revision integer)
returns void language plpgsql security definer set search_path=public as $$
declare old_status public.appointment_status;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  select status into old_status from public.appointments where id=target_appointment_id for update;
  if old_status is null then raise exception 'Appointment not found'; end if;
  if not ((old_status='scheduled' and next_status in ('checked_in','cancelled','no_show')) or (old_status='checked_in' and next_status in ('in_progress','cancelled','no_show')) or (old_status='in_progress' and next_status in ('completed','cancelled')) or (old_status='completed' and next_status='completed')) then raise exception 'Illegal appointment transition'; end if;
  update public.appointments set status=next_status,revision=revision+1 where id=target_appointment_id and revision=expected_revision;
  if not found then raise exception 'Appointment was changed by another staff member. Refresh and try again'; end if;
end; $$;

create function public.convert_appointment_to_work_order(target_appointment_id uuid, expected_revision integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare appointment_record record; new_work_order_id uuid;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  select * into appointment_record from public.appointments where id=target_appointment_id for update;
  if appointment_record.id is null then raise exception 'Appointment not found'; end if;
  if appointment_record.work_order_id is not null then raise exception 'This appointment already has a work order'; end if;
  if appointment_record.revision <> expected_revision then raise exception 'Appointment was changed by another staff member. Refresh and try again'; end if;
  new_work_order_id := public.create_work_order(appointment_record.customer_id,appointment_record.vehicle_id,appointment_record.assigned_technician_id,appointment_record.requested_service_summary,appointment_record.notes,null,null,(select jsonb_agg(jsonb_build_object('serviceId', service_catalog_id)) from public.appointment_services where appointment_id=target_appointment_id));
  update public.work_orders set appointment_id=target_appointment_id where id=new_work_order_id;
  update public.appointments set work_order_id=new_work_order_id,status=case when status='scheduled' then 'checked_in' else status end,revision=revision+1 where id=target_appointment_id;
  perform public.write_appointment_activity(target_appointment_id, 'converted_to_work_order', jsonb_build_object('workOrderId', new_work_order_id));
  return new_work_order_id;
end; $$;

create policy "appointment_services_admin_front_desk" on public.appointment_services for all to authenticated using(public.has_role(array['admin','front_desk']::public.staff_role[])) with check(public.has_role(array['admin','front_desk']::public.staff_role[]));
create policy "appointment_services_technician_select" on public.appointment_services for select to authenticated using(exists(select 1 from public.appointments join public.work_orders on work_orders.appointment_id=appointments.id where appointments.id=appointment_services.appointment_id and public.is_assigned_technician(work_orders.id)));
alter table public.appointment_services enable row level security;
grant select,insert,update,delete on public.appointment_services to authenticated;
grant execute on function public.save_appointment(uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,jsonb,integer,boolean) to authenticated;
grant execute on function public.reschedule_appointment(uuid,timestamptz,timestamptz,integer,boolean) to authenticated;
grant execute on function public.transition_appointment(uuid,public.appointment_status,integer) to authenticated;
grant execute on function public.convert_appointment_to_work_order(uuid,integer) to authenticated;
