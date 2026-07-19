-- Immutable inventory operations and explicit confirmed work-order usage.
alter table public.parts alter column sku drop not null;
alter table public.parts alter column sku_normalized drop not null;
alter table public.parts add column category text;
alter table public.work_order_parts add column reversed_at timestamptz, add column reversed_by uuid references auth.users(id) on delete set null;
alter table public.inventory_movements add column reverses_movement_id uuid unique references public.inventory_movements(id) on delete restrict;
create index inventory_movements_part_created_idx on public.inventory_movements(part_id, created_at desc);
create index parts_low_stock_idx on public.parts(quantity_on_hand, reorder_threshold) where archived_at is null;

create function public.record_inventory_movement(target_part_id uuid, target_work_order_part_id uuid, movement public.inventory_movement_type, delta numeric, movement_reason text default null, reversal_of uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare part_record record; movement_id uuid; resulting numeric;
begin
  select * into part_record from public.parts where id=target_part_id for update;
  if part_record.id is null then raise exception 'Part not found'; end if;
  resulting := part_record.quantity_on_hand + delta;
  if resulting < 0 then raise exception 'Insufficient stock. Available quantity is %', part_record.quantity_on_hand; end if;
  update public.parts set quantity_on_hand=resulting where id=target_part_id;
  insert into public.inventory_movements(part_id,work_order_part_id,movement_type,quantity_delta,resulting_quantity,reason,reverses_movement_id,created_by)
  values(target_part_id,target_work_order_part_id,movement,delta,resulting,movement_reason,reversal_of,auth.uid()) returning id into movement_id;
  return movement_id;
end; $$;

create function public.restock_part(target_part_id uuid, quantity numeric, reason text default null)
returns uuid language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  if quantity <= 0 then raise exception 'Restock quantity must be positive'; end if;
  return public.record_inventory_movement(target_part_id,null,'restock',quantity,reason);
end; $$;

create function public.create_part(part_name text, part_sku text, part_category text, part_unit text, opening_quantity numeric, threshold numeric, cost_minor integer, selling_minor integer)
returns uuid language plpgsql security definer set search_path=public as $$
declare new_part_id uuid;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  if opening_quantity < 0 or threshold < 0 or selling_minor < 0 then raise exception 'Part quantities and selling price cannot be negative'; end if;
  if cost_minor is not null and not public.has_role(array['admin']::public.staff_role[]) then raise exception 'Administrator access required for cost information'; end if;
  insert into public.parts(name,sku,category,unit,quantity_on_hand,reorder_threshold,cost_price_minor,sell_price_minor)
  values(part_name,nullif(trim(part_sku),''),nullif(trim(part_category),''),part_unit,0,threshold,cost_minor,selling_minor) returning id into new_part_id;
  if opening_quantity > 0 then perform public.record_inventory_movement(new_part_id,null,'restock',opening_quantity,'Initial stock entry'); end if;
  return new_part_id;
end; $$;

create function public.correct_inventory(target_part_id uuid, quantity_delta numeric, reason text)
returns uuid language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin']::public.staff_role[]) then raise exception 'Administrator access required'; end if;
  if quantity_delta = 0 or nullif(trim(reason),'') is null then raise exception 'A non-zero correction and reason are required'; end if;
  return public.record_inventory_movement(target_part_id,null,'manual_adjustment',quantity_delta,reason);
end; $$;

create function public.confirm_work_order_part_usage(target_work_order_id uuid, target_part_id uuid, quantity numeric)
returns uuid language plpgsql security definer set search_path=public as $$
declare part_record record; part_line_id uuid;
begin
  if not (public.has_role(array['admin','front_desk']::public.staff_role[]) or public.is_assigned_technician(target_work_order_id)) then raise exception 'You cannot use parts on this work order'; end if;
  if quantity <= 0 then raise exception 'Used quantity must be positive'; end if;
  if exists(select 1 from public.work_order_parts where work_order_id=target_work_order_id and part_id=target_part_id) then raise exception 'This part is already recorded for this work order. Reverse it before correcting the line'; end if;
  select * into part_record from public.parts where id=target_part_id and archived_at is null;
  if part_record.id is null then raise exception 'Part is unavailable'; end if;
  insert into public.work_order_parts(work_order_id,part_id,quantity,sku_snapshot,part_name_snapshot,unit_snapshot,unit_price_minor)
  values(target_work_order_id,target_part_id,quantity,coalesce(part_record.sku,''),part_record.name,part_record.unit,part_record.sell_price_minor) returning id into part_line_id;
  perform public.record_inventory_movement(target_part_id,part_line_id,'work_order_usage',-quantity,format('Confirmed use on work order %s',target_work_order_id));
  return part_line_id;
end; $$;

create function public.reverse_work_order_part_usage(target_work_order_part_id uuid, reason text)
returns uuid language plpgsql security definer set search_path=public as $$
declare line_record record; usage_movement record;
begin
  select * into line_record from public.work_order_parts where id=target_work_order_part_id for update;
  if line_record.id is null then raise exception 'Used part line not found'; end if;
  if not (public.has_role(array['admin','front_desk']::public.staff_role[]) or public.is_assigned_technician(line_record.work_order_id)) then raise exception 'You cannot reverse this part use'; end if;
  if line_record.reversed_at is not null then raise exception 'This part use has already been reversed'; end if;
  if nullif(trim(reason),'') is null then raise exception 'A reversal reason is required'; end if;
  select * into usage_movement from public.inventory_movements where work_order_part_id=target_work_order_part_id and movement_type='work_order_usage' for update;
  if usage_movement.id is null then raise exception 'Original stock movement not found'; end if;
  perform public.record_inventory_movement(line_record.part_id,target_work_order_part_id,'usage_reversal',line_record.quantity,reason,usage_movement.id);
  update public.work_order_parts set reversed_at=now(),reversed_by=auth.uid() where id=target_work_order_part_id;
  return usage_movement.id;
end; $$;

grant execute on function public.restock_part(uuid,numeric,text) to authenticated;
grant execute on function public.create_part(text,text,text,text,numeric,numeric,integer,integer) to authenticated;
grant execute on function public.correct_inventory(uuid,numeric,text) to authenticated;
grant execute on function public.confirm_work_order_part_usage(uuid,uuid,numeric) to authenticated;
grant execute on function public.reverse_work_order_part_usage(uuid,text) to authenticated;
