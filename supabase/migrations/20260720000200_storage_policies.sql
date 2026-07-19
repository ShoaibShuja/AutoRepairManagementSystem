-- Private operational files. Browser access is always via an authorized path or signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vehicle-attachments', 'vehicle-attachments', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('invoice-pdfs', 'invoice-pdfs', false, 15728640, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create function public.can_access_storage_object(target_bucket text, target_path text)
returns boolean language sql stable security definer set search_path=public,storage as $$
  select public.has_role(array['admin','front_desk']::public.staff_role[])
    or (target_bucket = 'vehicle-attachments' and exists (
      select 1 from public.attachments a
      where a.bucket_id = target_bucket and a.object_path = target_path
      and a.work_order_id is not null and public.is_assigned_technician(a.work_order_id)
    ));
$$;
create function public.can_upload_work_order_attachment(target_bucket text, target_path text)
returns boolean language sql stable security definer set search_path=public as $$
  select public.has_role(array['admin','front_desk']::public.staff_role[])
    or (target_bucket = 'vehicle-attachments'
      and split_part(target_path, '/', 1) = 'work-orders'
      and public.is_assigned_technician(nullif(split_part(target_path, '/', 2), '')::uuid));
$$;

create policy "staff_read_private_operational_files" on storage.objects for select to authenticated using (public.can_access_storage_object(bucket_id, name));
create policy "staff_upload_private_operational_files" on storage.objects for insert to authenticated with check (public.can_upload_work_order_attachment(bucket_id, name));
create policy "staff_update_private_operational_files" on storage.objects for update to authenticated using (public.can_access_storage_object(bucket_id, name)) with check (public.can_upload_work_order_attachment(bucket_id, name));
create policy "staff_delete_private_operational_files" on storage.objects for delete to authenticated using (public.can_access_storage_object(bucket_id, name));
