-- Add appointment states in a committed migration before later migrations reference them.
alter type public.appointment_status add value if not exists 'in_progress' after 'checked_in';
alter type public.appointment_status add value if not exists 'completed' after 'in_progress';
