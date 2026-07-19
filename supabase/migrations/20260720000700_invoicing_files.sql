-- Authoritative offline invoices and technician-safe attachment registration.
create function public.create_invoice_from_work_order(target_work_order_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare invoice_id uuid; next_number text; subtotal integer;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  if exists(select 1 from public.invoices where work_order_id=target_work_order_id and status <> 'void') then raise exception 'An active invoice already exists for this work order'; end if;
  if not exists(select 1 from public.work_orders where id=target_work_order_id and status in ('completed','invoiced')) then raise exception 'Only completed work orders can be invoiced'; end if;
  update public.business_settings set next_invoice_sequence=next_invoice_sequence+1 where singleton=true returning invoice_prefix || lpad((next_invoice_sequence-1)::text, 6, '0') into next_number;
  select coalesce(sum((unit_price_minor * quantity)::numeric),0)::integer into subtotal from public.work_order_services where work_order_id=target_work_order_id;
  select subtotal + coalesce(sum((unit_price_minor * quantity)::numeric),0)::integer into subtotal from public.work_order_parts where work_order_id=target_work_order_id and reversed_at is null;
  insert into public.invoices(work_order_id,invoice_number,status,currency_code,subtotal_minor,total_minor)
  select target_work_order_id,next_number,'issued',currency_code,subtotal,subtotal from public.business_settings where singleton=true returning id into invoice_id;
  insert into public.invoice_items(invoice_id,source_type,source_line_id,description,quantity,unit_price_minor,line_total_minor,display_order)
  select invoice_id,'service',id,service_name_snapshot,quantity,unit_price_minor,(unit_price_minor*quantity)::integer,row_number() over(order by created_at) from public.work_order_services where work_order_id=target_work_order_id;
  insert into public.invoice_items(invoice_id,source_type,source_line_id,description,quantity,unit_price_minor,line_total_minor,display_order)
  select invoice_id,'part',id,part_name_snapshot,quantity,unit_price_minor,(unit_price_minor*quantity)::integer,1000+row_number() over(order by created_at) from public.work_order_parts where work_order_id=target_work_order_id and reversed_at is null;
  update public.work_orders set status='invoiced' where id=target_work_order_id and status='completed';
  return invoice_id;
end; $$;
create function public.record_offline_payment(target_invoice_id uuid, payment_method public.payment_method, payment_reference text default null, payment_notes text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare payment_id uuid; invoice_total integer;
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  select total_minor into invoice_total from public.invoices where id=target_invoice_id and status='issued' for update;
  if invoice_total is null then raise exception 'Invoice is not available for payment'; end if;
  insert into public.payments(invoice_id,method,amount_minor,reference,notes,created_by) values(target_invoice_id,payment_method,invoice_total,nullif(trim(payment_reference),''),nullif(trim(payment_notes),''),auth.uid()) returning id into payment_id;
  update public.invoices set status='paid' where id=target_invoice_id;
  return payment_id;
end; $$;
create function public.void_invoice(target_invoice_id uuid, reason text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin','front_desk']::public.staff_role[]) then raise exception 'Operational staff required'; end if;
  if nullif(trim(reason),'') is null then raise exception 'A void reason is required'; end if;
  update public.invoices set status='void',voided_at=now(),voided_by=auth.uid(),void_reason=trim(reason) where id=target_invoice_id and status='issued';
  if not found then raise exception 'Only unpaid invoices can be voided'; end if;
end; $$;
create function public.register_work_order_attachment(target_vehicle_id uuid,target_work_order_id uuid,target_category public.attachment_category,target_path text,target_filename text,target_mime text,target_bytes integer,target_caption text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare attachment_id uuid;
begin
  if not (public.has_role(array['admin','front_desk']::public.staff_role[]) or public.is_assigned_technician(target_work_order_id)) then raise exception 'You cannot attach files to this work order'; end if;
  if target_category not in ('before','damage','after','vehicle_document','work_order_document') or target_bytes <= 0 or target_bytes > 10485760 or target_mime not in ('image/jpeg','image/png','image/webp','application/pdf') then raise exception 'Attachment metadata is not allowed'; end if;
  if split_part(target_path,'/',1) <> 'work-orders' or split_part(target_path,'/',2) <> target_work_order_id::text then raise exception 'Invalid private attachment path'; end if;
  insert into public.attachments(vehicle_id,work_order_id,category,bucket_id,object_path,original_filename,mime_type,byte_size,caption,created_by) values(target_vehicle_id,target_work_order_id,target_category,'vehicle-attachments',target_path,target_filename,target_mime,target_bytes,nullif(trim(target_caption),''),auth.uid()) returning id into attachment_id;
  return attachment_id;
end; $$;
grant execute on function public.create_invoice_from_work_order(uuid) to authenticated;
grant execute on function public.record_offline_payment(uuid,public.payment_method,text,text) to authenticated;
grant execute on function public.void_invoice(uuid,text) to authenticated;
grant execute on function public.register_work_order_attachment(uuid,uuid,public.attachment_category,text,text,text,integer,text) to authenticated;
