create table if not exists public.vendor_notifications (
  id text primary key,
  application_id text references public.vendor_applications(id) on delete set null,
  vendor_id text references public.approved_vendors(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  category text not null check (category in (
    'application_received',
    'application_internal_alert',
    'application_approved',
    'nda_sent',
    'credentials_issued',
    'dealer_agreement_sent'
  )),
  status text not null check (status in ('sent', 'failed', 'logged')),
  reference text,
  created_at timestamptz not null
);

create table if not exists public.support_requests (
  id text primary key,
  vendor_id text not null references public.approved_vendors(id) on delete cascade,
  subject text not null,
  category text not null check (category in (
    'deal_registration',
    'hubspot_sync',
    'profile_update',
    'rmr_question',
    'portal_access',
    'general'
  )),
  message text not null,
  status text not null check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.training_assets (
  id text primary key,
  title text not null,
  description text not null default '',
  type text not null check (type in ('video', 'document')),
  source text not null check (source in ('upload', 'external')),
  file_name text,
  content_type text,
  external_url text,
  file_url text,
  blob_path text,
  embedded_data_base64 text,
  uploaded_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.rmr_statements (
  id text primary key,
  vendor_id text not null references public.approved_vendors(id) on delete cascade,
  period_key text not null check (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  period_label text not null,
  type text not null check (type in ('forecast', 'recognized')),
  status text not null check (status in ('open', 'closed')),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  deal_count integer not null default 0 check (deal_count >= 0),
  deal_ids text[] not null default '{}',
  generated_at timestamptz not null,
  closed_at timestamptz,
  unique (vendor_id, period_key, type)
);

create index if not exists vendor_notifications_application_created_idx
  on public.vendor_notifications (application_id, created_at desc);
create index if not exists vendor_notifications_vendor_created_idx
  on public.vendor_notifications (vendor_id, created_at desc);
create index if not exists support_requests_vendor_created_idx
  on public.support_requests (vendor_id, created_at desc);
create index if not exists training_assets_created_idx
  on public.training_assets (created_at desc);
create index if not exists rmr_statements_vendor_period_idx
  on public.rmr_statements (vendor_id, period_key desc);

alter table public.vendor_notifications enable row level security;
alter table public.support_requests enable row level security;
alter table public.training_assets enable row level security;
alter table public.rmr_statements enable row level security;

comment on table public.rmr_statements is
  'Immutable monthly RMR snapshots. Closed rows must only be read after closed_at is set.';

create or replace function public.prevent_closed_rmr_statement_changes()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'closed' and new is distinct from old then
    raise exception 'Closed RMR statements are immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_closed_rmr_statement_changes on public.rmr_statements;
create trigger prevent_closed_rmr_statement_changes
before update on public.rmr_statements
for each row execute function public.prevent_closed_rmr_statement_changes();
