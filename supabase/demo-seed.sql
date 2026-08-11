-- Hashimi Pro demo data for a local or non-production Supabase project.
-- All names, emails, phones, VINs, locations, and notes below are fictional.
-- Do not run this in production or alongside real customer records.
--
-- This seed creates five inactive-for-login Auth users only to satisfy profile
-- foreign keys. Their passwords are random hashes and are intentionally unknown.
-- It is safe to re-run: every demo record uses a stable UUID in the ...d001 range.

begin;
set constraints all deferred;

with staff(id, email, display_name, staff_role) as (
  values
    ('00000000-0000-4000-8000-000000000d01'::uuid, 'demo.admin@autocare.test', 'Farid Rahmani', 'admin'::public.staff_role),
    ('00000000-0000-4000-8000-000000000d02'::uuid, 'demo.desk@autocare.test', 'Laila Sediqi', 'front_desk'::public.staff_role),
    ('00000000-0000-4000-8000-000000000d03'::uuid, 'demo.tech1@autocare.test', 'Omid Safi', 'technician'::public.staff_role),
    ('00000000-0000-4000-8000-000000000d04'::uuid, 'demo.tech2@autocare.test', 'Mina Ahmadi', 'technician'::public.staff_role),
    ('00000000-0000-4000-8000-000000000d05'::uuid, 'demo.tech3@autocare.test', 'Wali Hamdard', 'technician'::public.staff_role)
)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', staff_role),
  jsonb_build_object('display_name', display_name), now(), now()
from staff
on conflict (id) do update set email = excluded.email, raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data, updated_at = now();

insert into public.profiles (id, email, display_name, role, account_status)
values
  ('00000000-0000-4000-8000-000000000d01', 'demo.admin@autocare.test', 'Farid Rahmani', 'admin', 'active'),
  ('00000000-0000-4000-8000-000000000d02', 'demo.desk@autocare.test', 'Laila Sediqi', 'front_desk', 'active'),
  ('00000000-0000-4000-8000-000000000d03', 'demo.tech1@autocare.test', 'Omid Safi', 'technician', 'active'),
  ('00000000-0000-4000-8000-000000000d04', 'demo.tech2@autocare.test', 'Mina Ahmadi', 'technician', 'active'),
  ('00000000-0000-4000-8000-000000000d05', 'demo.tech3@autocare.test', 'Wali Hamdard', 'technician', 'active')
on conflict (id) do update set email = excluded.email, display_name = excluded.display_name,
  role = excluded.role, account_status = excluded.account_status;

insert into public.service_catalog (name, category, description, standard_price_minor, default_duration_minutes)
values
  ('Basic exterior wash', 'Car wash', 'Hand wash, rinse, dry, and tyre shine.', 120000, 45),
  ('Premium wash and interior', 'Car wash', 'Exterior wash, interior vacuum, dashboard clean, and tyre shine.', 250000, 90),
  ('Oil change and filter', 'Maintenance', 'Engine oil and standard oil-filter replacement.', 380000, 60),
  ('Brake inspection', 'Inspection', 'Brake pad, rotor, fluid, and road-test inspection.', 180000, 45),
  ('Brake pad replacement', 'Repair', 'Front or rear brake-pad replacement; parts billed separately.', 620000, 120),
  ('AC service and recharge', 'Maintenance', 'Cabin filter inspection, leak check, and refrigerant recharge.', 540000, 120)
on conflict (name_normalized) do update set category = excluded.category, description = excluded.description,
  standard_price_minor = excluded.standard_price_minor, default_duration_minutes = excluded.default_duration_minutes;

insert into public.customers (id, full_name, phone, email, address, notes)
values
  ('00000000-0000-4000-8000-000000000c01', 'Ahmad Watan', '+93000000001', 'ahmad.watan@example.test', 'Fictional District 3, Kabul', 'Prefers morning appointments.'),
  ('00000000-0000-4000-8000-000000000c02', 'Sahar Nawabi', '+93000000002', 'sahar.nawabi@example.test', 'Fictional Karte-e-No, Kabul', 'Call before replacing parts.'),
  ('00000000-0000-4000-8000-000000000c03', 'Jawad Faryabi', '+93000000003', 'jawad.faryabi@example.test', 'Fictional Qala-e-Fathullah, Kabul', null),
  ('00000000-0000-4000-8000-000000000c04', 'Maryam Kohistani', '+93000000004', 'maryam.kohistani@example.test', 'Fictional Taimani, Kabul', 'Company vehicle contact.'),
  ('00000000-0000-4000-8000-000000000c05', 'Naveed Hamidi', '+93000000005', 'naveed.hamidi@example.test', 'Fictional Khair Khana, Kabul', null),
  ('00000000-0000-4000-8000-000000000c06', 'Roya Farzan', '+93000000006', 'roya.farzan@example.test', 'Fictional Shahre Naw, Kabul', 'Sensitive to strong interior fragrances.'),
  ('00000000-0000-4000-8000-000000000c07', 'Samiullah Arman', '+93000000007', 'samiullah.arman@example.test', 'Fictional Darulaman, Kabul', null),
  ('00000000-0000-4000-8000-000000000c08', 'Zahra Zaman', '+93000000008', 'zahra.zaman@example.test', 'Fictional Macrorayan, Kabul', 'Please keep old parts after replacement.'),
  ('00000000-0000-4000-8000-000000000c09', 'Haroon Azimi', '+93000000009', 'haroon.azimi@example.test', 'Fictional Wazir Akbar Khan, Kabul', null),
  ('00000000-0000-4000-8000-000000000c10', 'Nargis Bahar', '+93000000010', 'nargis.bahar@example.test', 'Fictional Bagrami, Kabul', 'Prefers card-in-person payment.'),
  ('00000000-0000-4000-8000-000000000c11', 'Ehsan Rafiq', '+93000000011', 'ehsan.rafiq@example.test', 'Fictional Deh Afghanan, Kabul', null),
  ('00000000-0000-4000-8000-000000000c12', 'Parisa Amini', '+93000000012', 'parisa.amini@example.test', 'Fictional Pul-e-Surkh, Kabul', 'New customer; verify contact details.')
on conflict (id) do update set full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
  address = excluded.address, notes = excluded.notes, archived_at = null, archived_by = null;

insert into public.vehicles (id, customer_id, plate_number, vin, make, model, model_year, color, notes)
values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000c01', 'DME-101', 'DEMO0000000000001', 'Toyota', 'Corolla', 2015, 'Silver', 'Routine maintenance vehicle.'),
  ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-000000000c01', 'DME-102', 'DEMO0000000000002', 'Honda', 'Civic', 2018, 'White', 'Family vehicle.'),
  ('00000000-0000-4000-8000-000000000e03', '00000000-0000-4000-8000-000000000c02', 'DME-103', 'DEMO0000000000003', 'Toyota', 'RAV4', 2020, 'Blue', null),
  ('00000000-0000-4000-8000-000000000e04', '00000000-0000-4000-8000-000000000c03', 'DME-104', 'DEMO0000000000004', 'Hyundai', 'Elantra', 2017, 'Grey', null),
  ('00000000-0000-4000-8000-000000000e05', '00000000-0000-4000-8000-000000000c04', 'DME-105', 'DEMO0000000000005', 'Toyota', 'Hiace', 2014, 'White', 'Delivery van.'),
  ('00000000-0000-4000-8000-000000000e06', '00000000-0000-4000-8000-000000000c05', 'DME-106', 'DEMO0000000000006', 'Kia', 'Sportage', 2019, 'Black', null),
  ('00000000-0000-4000-8000-000000000e07', '00000000-0000-4000-8000-000000000c06', 'DME-107', 'DEMO0000000000007', 'Toyota', 'Yaris', 2016, 'Red', null),
  ('00000000-0000-4000-8000-000000000e08', '00000000-0000-4000-8000-000000000c07', 'DME-108', 'DEMO0000000000008', 'Nissan', 'Patrol', 2013, 'White', 'Customer supplied roof rack.'),
  ('00000000-0000-4000-8000-000000000e09', '00000000-0000-4000-8000-000000000c07', 'DME-109', 'DEMO0000000000009', 'Suzuki', 'Swift', 2021, 'Yellow', null),
  ('00000000-0000-4000-8000-000000000e10', '00000000-0000-4000-8000-000000000c08', 'DME-110', 'DEMO0000000000010', 'Honda', 'CR-V', 2018, 'Maroon', null),
  ('00000000-0000-4000-8000-000000000e11', '00000000-0000-4000-8000-000000000c09', 'DME-111', 'DEMO0000000000011', 'Toyota', 'Land Cruiser', 2016, 'Black', null),
  ('00000000-0000-4000-8000-000000000e12', '00000000-0000-4000-8000-000000000c10', 'DME-112', 'DEMO0000000000012', 'Hyundai', 'Tucson', 2022, 'Pearl white', null),
  ('00000000-0000-4000-8000-000000000e13', '00000000-0000-4000-8000-000000000c11', 'DME-113', 'DEMO0000000000013', 'Mazda', '3', 2017, 'Blue', null),
  ('00000000-0000-4000-8000-000000000e14', '00000000-0000-4000-8000-000000000c12', 'DME-114', 'DEMO0000000000014', 'Kia', 'Rio', 2019, 'Grey', null),
  ('00000000-0000-4000-8000-000000000e15', '00000000-0000-4000-8000-000000000c12', 'DME-115', 'DEMO0000000000015', 'Ford', 'Ranger', 2018, 'Orange', 'Fleet pickup.')
on conflict (id) do update set customer_id = excluded.customer_id, plate_number = excluded.plate_number, vin = excluded.vin,
  make = excluded.make, model = excluded.model, model_year = excluded.model_year, color = excluded.color,
  notes = excluded.notes, archived_at = null, archived_by = null;

insert into public.parts (id, sku, name, category, unit, quantity_on_hand, reorder_threshold, cost_price_minor, sell_price_minor)
values
  ('00000000-0000-4000-8000-000000000f01', 'DEMO-OIL-5W30', '5W-30 engine oil', 'Fluids', 'liter', 48, 12, 65000, 85000),
  ('00000000-0000-4000-8000-000000000f02', 'DEMO-OIL-10W40', '10W-40 engine oil', 'Fluids', 'liter', 36, 10, 60000, 80000),
  ('00000000-0000-4000-8000-000000000f03', 'DEMO-FILTER-OIL', 'Oil filter', 'Filters', 'each', 18, 6, 45000, 70000),
  ('00000000-0000-4000-8000-000000000f04', 'DEMO-FILTER-AIR', 'Engine air filter', 'Filters', 'each', 14, 5, 75000, 110000),
  ('00000000-0000-4000-8000-000000000f05', 'DEMO-FILTER-CABIN', 'Cabin air filter', 'Filters', 'each', 9, 5, 40000, 55000),
  ('00000000-0000-4000-8000-000000000f06', 'DEMO-PAD-FRONT', 'Front brake-pad set', 'Brakes', 'set', 6, 4, 160000, 220000),
  ('00000000-0000-4000-8000-000000000f07', 'DEMO-PAD-REAR', 'Rear brake-pad set', 'Brakes', 'set', 5, 4, 145000, 205000),
  ('00000000-0000-4000-8000-000000000f08', 'DEMO-BRAKE-FLUID', 'DOT 4 brake fluid', 'Fluids', 'liter', 11, 4, 55000, 78000),
  ('00000000-0000-4000-8000-000000000f09', 'DEMO-COOLANT', 'Long-life coolant', 'Fluids', 'liter', 22, 6, 50000, 72000),
  ('00000000-0000-4000-8000-000000000f10', 'DEMO-ATF', 'Automatic transmission fluid', 'Fluids', 'liter', 16, 5, 90000, 120000),
  ('00000000-0000-4000-8000-000000000f11', 'DEMO-WIPER-18', 'Wiper blade 18 inch', 'Electrical', 'each', 8, 3, 70000, 105000),
  ('00000000-0000-4000-8000-000000000f12', 'DEMO-WIPER-24', 'Wiper blade 24 inch', 'Electrical', 'each', 7, 3, 85000, 125000),
  ('00000000-0000-4000-8000-000000000f13', 'DEMO-SPARK-PLUG', 'Iridium spark plug', 'Ignition', 'each', 20, 8, 50000, 75000),
  ('00000000-0000-4000-8000-000000000f14', 'DEMO-BATTERY-60', '60Ah battery', 'Electrical', 'each', 4, 2, 420000, 500000),
  ('00000000-0000-4000-8000-000000000f15', 'DEMO-HEADLIGHT-H7', 'H7 headlight bulb', 'Electrical', 'each', 10, 4, 35000, 60000),
  ('00000000-0000-4000-8000-000000000f16', 'DEMO-TYRE-20555R16', 'Tyre 205/55R16', 'Tyres', 'each', 4, 4, 370000, 440000),
  ('00000000-0000-4000-8000-000000000f17', 'DEMO-TYRE-21560R17', 'Tyre 215/60R17', 'Tyres', 'each', 3, 4, 460000, 540000),
  ('00000000-0000-4000-8000-000000000f18', 'DEMO-BELT-SERP', 'Serpentine belt', 'Engine', 'each', 6, 3, 110000, 160000),
  ('00000000-0000-4000-8000-000000000f19', 'DEMO-AC-GAS', 'R134a refrigerant', 'AC', 'can', 12, 4, 90000, 135000),
  ('00000000-0000-4000-8000-000000000f20', 'DEMO-DETAIL-SHAMPOO', 'pH-neutral wash shampoo', 'Car wash', 'liter', 14, 5, 45000, 70000)
on conflict (id) do update set sku = excluded.sku, name = excluded.name, category = excluded.category, unit = excluded.unit,
  quantity_on_hand = excluded.quantity_on_hand, reorder_threshold = excluded.reorder_threshold,
  cost_price_minor = excluded.cost_price_minor, sell_price_minor = excluded.sell_price_minor, archived_at = null, archived_by = null;

insert into public.appointments (id, customer_id, vehicle_id, assigned_technician_id, requested_service_summary, starts_at, ends_at, status, notes, revision)
values
  ('00000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000d03', 'Oil change and filter', date_trunc('day', now()) - interval '4 days' + interval '9 hours', date_trunc('day', now()) - interval '4 days' + interval '10 hours', 'completed', 'Completed without issues.', 1),
  ('00000000-0000-4000-8000-000000000a02', '00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-000000000e03', '00000000-0000-4000-8000-000000000d04', 'Brake inspection', date_trunc('day', now()) - interval '3 days' + interval '10 hours', date_trunc('day', now()) - interval '3 days' + interval '10 hours 45 minutes', 'completed', 'Inspection converted to work order.', 1),
  ('00000000-0000-4000-8000-000000000a03', '00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-000000000e04', '00000000-0000-4000-8000-000000000d05', 'AC service and recharge', date_trunc('day', now()) - interval '2 days' + interval '13 hours', date_trunc('day', now()) - interval '2 days' + interval '15 hours', 'completed', 'Customer approved recharge.', 1),
  ('00000000-0000-4000-8000-000000000a04', '00000000-0000-4000-8000-000000000c04', '00000000-0000-4000-8000-000000000e05', '00000000-0000-4000-8000-000000000d03', 'Premium wash and interior', date_trunc('day', now()) - interval '1 day' + interval '8 hours', date_trunc('day', now()) - interval '1 day' + interval '9 hours 30 minutes', 'checked_in', 'Fleet vehicle; inspect cabin condition.', 1),
  ('00000000-0000-4000-8000-000000000a05', '00000000-0000-4000-8000-000000000c05', '00000000-0000-4000-8000-000000000e06', '00000000-0000-4000-8000-000000000d04', 'Oil change and filter', date_trunc('day', now()) + interval '1 day 9 hours', date_trunc('day', now()) + interval '1 day 10 hours', 'scheduled', null, 1),
  ('00000000-0000-4000-8000-000000000a06', '00000000-0000-4000-8000-000000000c06', '00000000-0000-4000-8000-000000000e07', '00000000-0000-4000-8000-000000000d05', 'Basic exterior wash', date_trunc('day', now()) + interval '1 day 11 hours', date_trunc('day', now()) + interval '1 day 11 hours 45 minutes', 'scheduled', 'No interior fragrance.', 1),
  ('00000000-0000-4000-8000-000000000a07', '00000000-0000-4000-8000-000000000c07', '00000000-0000-4000-8000-000000000e08', '00000000-0000-4000-8000-000000000d03', 'Brake pad replacement', date_trunc('day', now()) + interval '2 days 8 hours', date_trunc('day', now()) + interval '2 days 10 hours', 'scheduled', 'Call before changing rotors.', 1),
  ('00000000-0000-4000-8000-000000000a08', '00000000-0000-4000-8000-000000000c08', '00000000-0000-4000-8000-000000000e10', null, 'Basic exterior wash', date_trunc('day', now()) + interval '2 days 13 hours', date_trunc('day', now()) + interval '2 days 13 hours 45 minutes', 'scheduled', 'Front desk assignment pending.', 1),
  ('00000000-0000-4000-8000-000000000a09', '00000000-0000-4000-8000-000000000c09', '00000000-0000-4000-8000-000000000e11', '00000000-0000-4000-8000-000000000d04', 'AC service and recharge', date_trunc('day', now()) + interval '3 days 9 hours', date_trunc('day', now()) + interval '3 days 11 hours', 'scheduled', null, 1),
  ('00000000-0000-4000-8000-000000000a10', '00000000-0000-4000-8000-000000000c10', '00000000-0000-4000-8000-000000000e12', '00000000-0000-4000-8000-000000000d05', 'Premium wash and interior', date_trunc('day', now()) + interval '4 days 10 hours', date_trunc('day', now()) + interval '4 days 11 hours 30 minutes', 'scheduled', 'Card payment expected.', 1)
on conflict (id) do update set customer_id = excluded.customer_id, vehicle_id = excluded.vehicle_id,
  assigned_technician_id = excluded.assigned_technician_id, requested_service_summary = excluded.requested_service_summary,
  starts_at = excluded.starts_at, ends_at = excluded.ends_at, status = excluded.status, notes = excluded.notes;

delete from public.appointment_services where appointment_id between '00000000-0000-4000-8000-000000000a01' and '00000000-0000-4000-8000-000000000a10';
insert into public.appointment_services (appointment_id, service_catalog_id)
select appointment_id, service.id
from (values
  ('00000000-0000-4000-8000-000000000a01'::uuid, 'Oil change and filter'),
  ('00000000-0000-4000-8000-000000000a02'::uuid, 'Brake inspection'),
  ('00000000-0000-4000-8000-000000000a03'::uuid, 'AC service and recharge'),
  ('00000000-0000-4000-8000-000000000a04'::uuid, 'Premium wash and interior'),
  ('00000000-0000-4000-8000-000000000a05'::uuid, 'Oil change and filter'),
  ('00000000-0000-4000-8000-000000000a06'::uuid, 'Basic exterior wash'),
  ('00000000-0000-4000-8000-000000000a07'::uuid, 'Brake pad replacement'),
  ('00000000-0000-4000-8000-000000000a08'::uuid, 'Basic exterior wash'),
  ('00000000-0000-4000-8000-000000000a09'::uuid, 'AC service and recharge'),
  ('00000000-0000-4000-8000-000000000a10'::uuid, 'Premium wash and interior')
) as requested(appointment_id, service_name)
join public.service_catalog service on service.name = requested.service_name;

insert into public.work_orders (id, customer_id, vehicle_id, appointment_id, assigned_technician_id, status, intake_notes, technical_notes, estimated_completion_at, reported_mileage, completed_at, cancelled_at, cancellation_reason)
values
  ('00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000d03', 'invoiced', 'Routine oil service and filter replacement.', 'Oil changed; no leaks seen during inspection.', now() - interval '4 days', 126400, now() - interval '4 days', null, null),
  ('00000000-0000-4000-8000-000000000b02', '00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-000000000e03', '00000000-0000-4000-8000-000000000a02', '00000000-0000-4000-8000-000000000d04', 'invoiced', 'Customer reports front brake noise.', 'Front pads replaced after inspection.', now() - interval '3 days', 84100, now() - interval '3 days', null, null),
  ('00000000-0000-4000-8000-000000000b03', '00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-000000000e04', '00000000-0000-4000-8000-000000000a03', '00000000-0000-4000-8000-000000000d05', 'invoiced', 'AC not cooling in afternoon traffic.', 'Leak check passed; refrigerant recharged.', now() - interval '2 days', 97500, now() - interval '2 days', null, null),
  ('00000000-0000-4000-8000-000000000b04', '00000000-0000-4000-8000-000000000c04', '00000000-0000-4000-8000-000000000e05', '00000000-0000-4000-8000-000000000a04', '00000000-0000-4000-8000-000000000d03', 'completed', 'Fleet van interior and exterior cleaning.', 'Ready for collection.', now() - interval '1 day', 188200, now() - interval '1 day', null, null),
  ('00000000-0000-4000-8000-000000000b05', '00000000-0000-4000-8000-000000000c05', '00000000-0000-4000-8000-000000000e06', null, '00000000-0000-4000-8000-000000000d04', 'ready_for_review', 'Check oil level and inspect front suspension noise.', 'Oil level corrected; awaiting road-test review.', now() + interval '2 hours', 63200, null, null, null),
  ('00000000-0000-4000-8000-000000000b06', '00000000-0000-4000-8000-000000000c06', '00000000-0000-4000-8000-000000000e07', null, '00000000-0000-4000-8000-000000000d05', 'in_progress', 'Annual maintenance and wash.', 'Air filter inspection in progress.', now() + interval '4 hours', 111700, null, null, null),
  ('00000000-0000-4000-8000-000000000b07', '00000000-0000-4000-8000-000000000c07', '00000000-0000-4000-8000-000000000e08', null, '00000000-0000-4000-8000-000000000d03', 'assigned', 'Inspect brake pedal vibration.', null, now() + interval '1 day', 152600, null, null, null),
  ('00000000-0000-4000-8000-000000000b08', '00000000-0000-4000-8000-000000000c08', '00000000-0000-4000-8000-000000000e10', null, null, 'draft', 'Customer asked for a quote for AC service.', null, null, 74400, null, null, null),
  ('00000000-0000-4000-8000-000000000b09', '00000000-0000-4000-8000-000000000c09', '00000000-0000-4000-8000-000000000e11', null, '00000000-0000-4000-8000-000000000d04', 'cancelled', 'Customer requested tyre inspection.', null, null, 209000, null, now() - interval '1 day', 'Customer postponed the visit.'),
  ('00000000-0000-4000-8000-000000000b10', '00000000-0000-4000-8000-000000000c10', '00000000-0000-4000-8000-000000000e12', null, '00000000-0000-4000-8000-000000000d05', 'completed', 'Premium wash before sale listing.', 'Exterior polish completed.', now() - interval '6 hours', 28200, now() - interval '6 hours', null, null)
on conflict (id) do update set customer_id = excluded.customer_id, vehicle_id = excluded.vehicle_id,
  appointment_id = excluded.appointment_id, assigned_technician_id = excluded.assigned_technician_id,
  status = excluded.status, intake_notes = excluded.intake_notes, technical_notes = excluded.technical_notes,
  estimated_completion_at = excluded.estimated_completion_at, reported_mileage = excluded.reported_mileage,
  completed_at = excluded.completed_at, cancelled_at = excluded.cancelled_at, cancellation_reason = excluded.cancellation_reason;

update public.appointments appointment
set work_order_id = work_order.id
from public.work_orders work_order
where work_order.appointment_id = appointment.id
  and appointment.id between '00000000-0000-4000-8000-000000000a01' and '00000000-0000-4000-8000-000000000a04';

delete from public.work_order_services where work_order_id between '00000000-0000-4000-8000-000000000b01' and '00000000-0000-4000-8000-000000000b10';
insert into public.work_order_services (work_order_id, service_catalog_id, service_name_snapshot, service_description_snapshot, quantity, unit_price_minor)
select order_id, service.id, service.name, service.description, quantity, service.standard_price_minor
from (values
  ('00000000-0000-4000-8000-000000000b01'::uuid, 'Oil change and filter', 1::numeric),
  ('00000000-0000-4000-8000-000000000b02'::uuid, 'Brake inspection', 1::numeric),
  ('00000000-0000-4000-8000-000000000b02'::uuid, 'Brake pad replacement', 1::numeric),
  ('00000000-0000-4000-8000-000000000b03'::uuid, 'AC service and recharge', 1::numeric),
  ('00000000-0000-4000-8000-000000000b04'::uuid, 'Premium wash and interior', 1::numeric),
  ('00000000-0000-4000-8000-000000000b05'::uuid, 'Oil change and filter', 1::numeric),
  ('00000000-0000-4000-8000-000000000b06'::uuid, 'Basic exterior wash', 1::numeric),
  ('00000000-0000-4000-8000-000000000b06'::uuid, 'Oil change and filter', 1::numeric),
  ('00000000-0000-4000-8000-000000000b07'::uuid, 'Brake inspection', 1::numeric),
  ('00000000-0000-4000-8000-000000000b08'::uuid, 'AC service and recharge', 1::numeric),
  ('00000000-0000-4000-8000-000000000b09'::uuid, 'Brake inspection', 1::numeric),
  ('00000000-0000-4000-8000-000000000b10'::uuid, 'Premium wash and interior', 1::numeric)
) as requested(order_id, service_name, quantity)
join public.service_catalog service on service.name = requested.service_name;

insert into public.work_order_parts (id, work_order_id, part_id, quantity, sku_snapshot, part_name_snapshot, unit_snapshot, unit_price_minor)
select part_line.id, part_line.work_order_id, part.id, part_line.quantity, part.sku, part.name, part.unit, part.sell_price_minor
from (values
  ('00000000-0000-4000-8000-000000000e01'::uuid, '00000000-0000-4000-8000-000000000b01'::uuid, 'DEMO-FILTER-OIL', 1::numeric),
  ('00000000-0000-4000-8000-000000000e02'::uuid, '00000000-0000-4000-8000-000000000b02'::uuid, 'DEMO-PAD-FRONT', 1::numeric),
  ('00000000-0000-4000-8000-000000000e03'::uuid, '00000000-0000-4000-8000-000000000b03'::uuid, 'DEMO-FILTER-CABIN', 1::numeric),
  ('00000000-0000-4000-8000-000000000e04'::uuid, '00000000-0000-4000-8000-000000000b06'::uuid, 'DEMO-FILTER-AIR', 1::numeric)
) as part_line(id, work_order_id, sku, quantity)
join public.parts part on part.sku = part_line.sku
on conflict (id) do update set work_order_id = excluded.work_order_id, part_id = excluded.part_id,
  quantity = excluded.quantity, sku_snapshot = excluded.sku_snapshot, part_name_snapshot = excluded.part_name_snapshot,
  unit_snapshot = excluded.unit_snapshot, unit_price_minor = excluded.unit_price_minor, reversed_at = null, reversed_by = null;

insert into public.inventory_movements (id, part_id, work_order_part_id, movement_type, quantity_delta, resulting_quantity, reason, created_by)
select ('00000000-0000-4000-8000-000000000b' || lpad(row_number() over (order by id)::text, 2, '0'))::uuid,
  id, null, 'restock', quantity_on_hand, quantity_on_hand, 'Demo opening stock', '00000000-0000-4000-8000-000000000d01'
from public.parts
where id between '00000000-0000-4000-8000-000000000f01' and '00000000-0000-4000-8000-000000000f20'
on conflict (id) do update set part_id = excluded.part_id, quantity_delta = excluded.quantity_delta,
  resulting_quantity = excluded.resulting_quantity, reason = excluded.reason;

insert into public.activity_log (id, entity_type, entity_id, action, after_data, created_by)
values
  ('00000000-0000-4000-8000-000000000f01', 'appointment', '00000000-0000-4000-8000-000000000a05', 'created', '{"source":"demo seed"}', '00000000-0000-4000-8000-000000000d02'),
  ('00000000-0000-4000-8000-000000000f02', 'work_order', '00000000-0000-4000-8000-000000000b01', 'completed', '{"source":"demo seed"}', '00000000-0000-4000-8000-000000000d03'),
  ('00000000-0000-4000-8000-000000000f03', 'work_order', '00000000-0000-4000-8000-000000000b06', 'status_changed', '{"to":"in_progress"}', '00000000-0000-4000-8000-000000000d05'),
  ('00000000-0000-4000-8000-000000000f04', 'inventory', '00000000-0000-4000-8000-000000000f06', 'restocked', '{"source":"demo seed"}', '00000000-0000-4000-8000-000000000d01')
on conflict (id) do update set action = excluded.action, after_data = excluded.after_data, created_by = excluded.created_by;

delete from public.invoice_items where invoice_id between '00000000-0000-4000-8000-000000000a01' and '00000000-0000-4000-8000-000000000a03';
insert into public.invoices (id, work_order_id, invoice_number, status, currency_code, subtotal_minor, total_minor, issued_at)
values
  ('00000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-000000000b01', 'DEMO-000001', 'paid', 'AFN', 450000, 450000, now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000a02', '00000000-0000-4000-8000-000000000b02', 'DEMO-000002', 'paid', 'AFN', 1020000, 1020000, now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000a03', '00000000-0000-4000-8000-000000000b03', 'DEMO-000003', 'issued', 'AFN', 595000, 595000, now() - interval '2 days')
on conflict (id) do update set work_order_id = excluded.work_order_id, invoice_number = excluded.invoice_number,
  status = excluded.status, subtotal_minor = excluded.subtotal_minor, total_minor = excluded.total_minor, issued_at = excluded.issued_at;

insert into public.invoice_items (id, invoice_id, source_type, description, quantity, unit_price_minor, line_total_minor, display_order)
values
  ('00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-000000000a01', 'service', 'Oil change and filter', 1, 380000, 380000, 1),
  ('00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-000000000a01', 'part', 'Oil filter', 1, 70000, 70000, 1001),
  ('00000000-0000-4000-8000-000000000c03', '00000000-0000-4000-8000-000000000a02', 'service', 'Brake inspection', 1, 180000, 180000, 1),
  ('00000000-0000-4000-8000-000000000c04', '00000000-0000-4000-8000-000000000a02', 'service', 'Brake pad replacement', 1, 620000, 620000, 2),
  ('00000000-0000-4000-8000-000000000c05', '00000000-0000-4000-8000-000000000a02', 'part', 'Front brake-pad set', 1, 220000, 220000, 1001),
  ('00000000-0000-4000-8000-000000000c06', '00000000-0000-4000-8000-000000000a03', 'service', 'AC service and recharge', 1, 540000, 540000, 1),
  ('00000000-0000-4000-8000-000000000c07', '00000000-0000-4000-8000-000000000a03', 'part', 'Cabin air filter', 1, 55000, 55000, 1001)
on conflict (id) do update set invoice_id = excluded.invoice_id, source_type = excluded.source_type,
  description = excluded.description, quantity = excluded.quantity, unit_price_minor = excluded.unit_price_minor,
  line_total_minor = excluded.line_total_minor, display_order = excluded.display_order;

insert into public.payments (id, invoice_id, method, status, amount_minor, reference, notes, received_at, created_by)
values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-000000000a01', 'cash', 'recorded', 450000, 'CASH-DEMO-001', 'Paid at front desk.', now() - interval '4 days', '00000000-0000-4000-8000-000000000d02'),
  ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-000000000a02', 'card_in_person', 'recorded', 1020000, 'CARD-DEMO-002', 'Approved terminal payment.', now() - interval '3 days', '00000000-0000-4000-8000-000000000d02')
on conflict (id) do update set invoice_id = excluded.invoice_id, method = excluded.method, status = excluded.status,
  amount_minor = excluded.amount_minor, reference = excluded.reference, notes = excluded.notes,
  received_at = excluded.received_at;

commit;
