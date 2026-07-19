-- Controlled work-order lifecycle, immutable service snapshots, and concise audit trail.
alter table public.work_orders
  add column estimated_completion_at timestamptz,
  add column reported_mileage integer check (reported_mileage >= 0);
alter table public.work_order_services
  add column service_description_snapshot text;

create function public.write_work_order_activity(target_work_order_id uuid, event_action text, event_data jsonb default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into public.activity_log(entity_type, entity_id, action, after_data, created_by)
  values ('work_order', target_work_order_id, event_action, event_data, auth.uid());
end; $$;

create function public.create_work_order(
  target_customer_id uuid, target_vehicle_id uuid, target_technician_id uuid,
  concern text, internal_note text, estimated_completion timestamptz,
  intake_mileage integer, selected_services jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare new_work_order_id uuid; selected_service jsonb; catalog_service record;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  if jsonb_typeof(selected_services) <> 'array' or jsonb_array_length(selected_services) = 0 then raise exception 'At least one service is required'; end if;
  if not exists(select 1 from public.vehicles where id=target_vehicle_id and customer_id=target_customer_id and archived_at is null) then raise exception 'Vehicle must belong to the selected active customer'; end if;
  if target_technician_id is not null and not exists(select 1 from public.profiles where id=target_technician_id and role='technician' and account_status='active') then raise exception 'Assigned staff member must be an active technician'; end if;
  insert into public.work_orders(customer_id, vehicle_id, assigned_technician_id, intake_notes, technical_notes, estimated_completion_at, reported_mileage)
  values(target_customer_id, target_vehicle_id, target_technician_id, concern, internal_note, estimated_completion, intake_mileage)
  returning id into new_work_order_id;
  for selected_service in select value from jsonb_array_elements(selected_services) loop
    select id, name, description, standard_price_minor into catalog_service from public.service_catalog
    where id=(selected_service->>'serviceId')::uuid and archived_at is null;
    if catalog_service.id is null then raise exception 'A selected service is unavailable'; end if;
    insert into public.work_order_services(work_order_id, service_catalog_id, service_name_snapshot, service_description_snapshot, unit_price_minor)
    values(new_work_order_id, catalog_service.id, catalog_service.name, catalog_service.description, catalog_service.standard_price_minor);
  end loop;
  perform public.write_work_order_activity(new_work_order_id, 'created', jsonb_build_object('assignedTechnicianId', target_technician_id));
  return new_work_order_id;
end; $$;

create function public.update_work_order_details(
  target_work_order_id uuid, target_technician_id uuid, concern text, internal_note text,
  estimated_completion timestamptz, intake_mileage integer, selected_services jsonb
) returns void language plpgsql security definer set search_path=public as $$
declare current_order record; selected_service jsonb; catalog_service record; old_technician_id uuid;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  select * into current_order from public.work_orders where id=target_work_order_id for update;
  if current_order.id is null then raise exception 'Work order not found'; end if;
  if current_order.status not in ('draft','assigned') then raise exception 'Only draft or assigned work orders can be edited'; end if;
  if jsonb_typeof(selected_services) <> 'array' or jsonb_array_length(selected_services) = 0 then raise exception 'At least one service is required'; end if;
  if target_technician_id is not null and not exists(select 1 from public.profiles where id=target_technician_id and role='technician' and account_status='active') then raise exception 'Assigned staff member must be an active technician'; end if;
  old_technician_id := current_order.assigned_technician_id;
  update public.work_orders set assigned_technician_id=target_technician_id, intake_notes=concern, technical_notes=internal_note,
    estimated_completion_at=estimated_completion, reported_mileage=intake_mileage where id=target_work_order_id;
  delete from public.work_order_services where work_order_id=target_work_order_id;
  for selected_service in select value from jsonb_array_elements(selected_services) loop
    select id, name, description, standard_price_minor into catalog_service from public.service_catalog
    where id=(selected_service->>'serviceId')::uuid and archived_at is null;
    if catalog_service.id is null then raise exception 'A selected service is unavailable'; end if;
    insert into public.work_order_services(work_order_id, service_catalog_id, service_name_snapshot, service_description_snapshot, unit_price_minor)
    values(target_work_order_id, catalog_service.id, catalog_service.name, catalog_service.description, catalog_service.standard_price_minor);
  end loop;
  if old_technician_id is distinct from target_technician_id then perform public.write_work_order_activity(target_work_order_id, 'assignment_changed', jsonb_build_object('from', old_technician_id, 'to', target_technician_id)); end if;
  perform public.write_work_order_activity(target_work_order_id, 'services_updated');
end; $$;

create function public.transition_work_order(target_work_order_id uuid, next_status public.work_order_status, note text default null)
returns void language plpgsql security definer set search_path=public as $$
declare current_status public.work_order_status; actor_role public.staff_role;
begin
  select status into current_status from public.work_orders where id=target_work_order_id for update;
  if current_status is null then raise exception 'Work order not found'; end if;
  actor_role := public.current_staff_role();
  if actor_role is null then raise exception 'Active staff required'; end if;
  if actor_role='technician' and not public.is_assigned_technician(target_work_order_id) then raise exception 'Only the assigned technician can update this work order'; end if;
  if actor_role='technician' and not ((current_status='assigned' and next_status='in_progress') or (current_status='in_progress' and next_status='ready_for_review')) then raise exception 'Technician transition is not permitted'; end if;
  if actor_role in ('admin','front_desk') and not ((current_status='draft' and next_status in ('assigned','cancelled')) or (current_status='assigned' and next_status in ('in_progress','cancelled')) or (current_status='in_progress' and next_status in ('ready_for_review','cancelled')) or (current_status='ready_for_review' and next_status in ('completed','cancelled')) or (current_status='completed' and next_status='invoiced')) then raise exception 'Illegal work-order transition'; end if;
  update public.work_orders set status=next_status, completed_at=case when next_status='completed' then now() else completed_at end,
    cancelled_at=case when next_status='cancelled' then now() else cancelled_at end,
    cancellation_reason=case when next_status='cancelled' then nullif(trim(note),'') else cancellation_reason end where id=target_work_order_id;
  perform public.write_work_order_activity(target_work_order_id, case when next_status='cancelled' then 'cancelled' when next_status='completed' then 'completed' else 'status_changed' end, jsonb_build_object('from',current_status,'to',next_status,'note',note));
end; $$;

create function public.add_technician_note(target_work_order_id uuid, note text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_assigned_technician(target_work_order_id) then raise exception 'Only the assigned technician can add notes'; end if;
  if nullif(trim(note),'') is null then raise exception 'A note is required'; end if;
  update public.work_orders set technical_notes=concat_ws(E'\n', technical_notes, trim(note)) where id=target_work_order_id;
  perform public.write_work_order_activity(target_work_order_id, 'technician_note_added');
end; $$;

grant execute on function public.create_work_order(uuid,uuid,uuid,text,text,timestamptz,integer,jsonb) to authenticated;
grant execute on function public.update_work_order_details(uuid,uuid,text,text,timestamptz,integer,jsonb) to authenticated;
grant execute on function public.transition_work_order(uuid,public.work_order_status,text) to authenticated;
grant execute on function public.add_technician_note(uuid,text) to authenticated;

create policy "profiles_front_desk_select_technicians" on public.profiles for select to authenticated
using(public.has_role(array['front_desk']::public.staff_role[]) and role='technician' and account_status='active');
