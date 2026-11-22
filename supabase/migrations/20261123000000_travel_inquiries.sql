-- Travel Inquiries table
-- Stores booking/inquiry requests submitted from the Travels screen

create table if not exists public.travel_inquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- What the user is booking
  inquiry_type  text not null,          -- e.g. "Umrah Package", "Flight Deal", "Tour Package", "Service Inquiry"
  subject       text not null,          -- e.g. "Executive Haramain Umrah Package"
  details       text,                   -- extra details about the specific package / route

  -- User contact info
  full_name     text not null,
  phone         text not null,
  email         text,
  notes         text,                   -- additional preferences

  -- Status managed by admin
  status        text not null default 'new'  -- new | in_progress | completed | cancelled
    check (status in ('new', 'in_progress', 'completed', 'cancelled')),

  admin_notes   text                    -- internal notes added by admin
);

-- Enable Row Level Security
alter table public.travel_inquiries enable row level security;

-- Anyone can INSERT (public form submission)
create policy "Anyone can submit a travel inquiry"
  on public.travel_inquiries
  for insert
  to anon, authenticated
  with check (true);

-- Only authenticated admins can read / update
create policy "Admins can view all travel inquiries"
  on public.travel_inquiries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('super_admin', 'branch_admin')
    )
  );

create policy "Admins can update travel inquiries"
  on public.travel_inquiries
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role in ('super_admin', 'branch_admin')
    )
  )
  with check (true);
