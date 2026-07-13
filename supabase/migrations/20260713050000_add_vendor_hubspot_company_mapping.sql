alter table public.approved_vendors
  add column if not exists hubspot_company_id text,
  add column if not exists hubspot_company_sync_status text not null default 'not_started',
  add column if not exists hubspot_company_sync_reference text,
  add column if not exists hubspot_company_synced_at timestamptz;

alter table public.approved_vendors
  drop constraint if exists approved_vendors_hubspot_company_sync_status_check;

alter table public.approved_vendors
  add constraint approved_vendors_hubspot_company_sync_status_check
  check (hubspot_company_sync_status in ('not_started', 'synced', 'held', 'failed'));

create unique index if not exists approved_vendors_hubspot_company_id_unique_idx
  on public.approved_vendors (hubspot_company_id)
  where hubspot_company_id is not null;
