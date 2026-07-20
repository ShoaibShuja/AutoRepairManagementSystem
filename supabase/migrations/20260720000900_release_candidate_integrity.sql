-- Release-candidate attachment integrity. Applied migrations remain immutable.

create or replace function public.register_work_order_attachment(
  target_vehicle_id uuid,target_work_order_id uuid,target_category public.attachment_category,
  target_path text,target_filename text,target_mime text,target_bytes integer,target_caption text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare attachment_id uuid;
begin
  if not (public.has_role(array['admin','front_desk']::public.staff_role[]) or public.is_assigned_technician(target_work_order_id)) then
    raise exception 'You cannot attach files to this work order';
  end if;
  if not exists(select 1 from public.work_orders where id=target_work_order_id and vehicle_id=target_vehicle_id) then
    raise exception 'Attachment vehicle must match the work order vehicle';
  end if;
  if target_category not in ('before','damage','after','vehicle_document','work_order_document')
    or target_bytes <= 0 or target_bytes > 10485760
    or target_mime not in ('image/jpeg','image/png','image/webp','application/pdf') then
    raise exception 'Attachment metadata is not allowed';
  end if;
  if split_part(target_path,'/',1) <> 'work-orders' or split_part(target_path,'/',2) <> target_work_order_id::text then
    raise exception 'Invalid private attachment path';
  end if;
  insert into public.attachments(vehicle_id,work_order_id,category,bucket_id,object_path,original_filename,mime_type,byte_size,caption,created_by)
  values(target_vehicle_id,target_work_order_id,target_category,'vehicle-attachments',target_path,target_filename,target_mime,target_bytes,nullif(trim(target_caption),''),auth.uid())
  returning id into attachment_id;
  return attachment_id;
end; $$;

create function public.archive_work_order_attachment(target_attachment_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare attachment_record record;
begin
  select * into attachment_record from public.attachments where id=target_attachment_id for update;
  if attachment_record.id is null then raise exception 'Attachment not found'; end if;
  if not (public.has_role(array['admin','front_desk']::public.staff_role[]) or public.is_assigned_technician(attachment_record.work_order_id)) then
    raise exception 'You cannot archive this attachment';
  end if;
  update public.attachments set archived_at=now(), archived_by=auth.uid()
  where id=target_attachment_id and archived_at is null;
  if not found then raise exception 'Attachment is already archived'; end if;
end; $$;

grant execute on function public.register_work_order_attachment(uuid,uuid,public.attachment_category,text,text,text,integer,text) to authenticated;
grant execute on function public.archive_work_order_attachment(uuid) to authenticated;
