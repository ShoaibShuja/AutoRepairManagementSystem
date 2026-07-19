-- Development-only, non-sensitive data. Create staff through the Admin API, never in this file.
insert into public.service_catalog (name, standard_price_minor, default_duration_minutes)
values ('Basic exterior wash',50000,45),('Oil and filter service',250000,60)
on conflict (name_normalized) do nothing;
insert into public.parts (sku,name,unit,quantity_on_hand,reorder_threshold,sell_price_minor)
values ('DEMO-OIL-5W30','Demo 5W-30 engine oil','liter',48,8,85000),('DEMO-FILTER-01','Demo oil filter','each',20,5,65000)
on conflict (sku_normalized) do nothing;
