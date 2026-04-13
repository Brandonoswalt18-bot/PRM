alter table if exists public.deal_registrations
  add column if not exists agreement_status text not null default 'not_started',
  add column if not exists agreement_uploaded_at timestamptz,
  add column if not exists agreement_sent_at timestamptz,
  add column if not exists agreement_signed_at timestamptz,
  add column if not exists agreement_file_name text,
  add column if not exists agreement_file_url text,
  add column if not exists agreement_blob_path text,
  add column if not exists signed_agreement_file_name text,
  add column if not exists signed_agreement_file_url text,
  add column if not exists signed_agreement_blob_path text,
  add column if not exists signed_agreement_uploaded_at timestamptz,
  add column if not exists expected_monthly_rmr numeric not null default 0,
  add column if not exists vendor_payout_type text,
  add column if not exists vendor_payout_rate numeric not null default 0,
  add column if not exists expected_vendor_monthly_revenue numeric not null default 0;

update public.deal_registrations
set expected_monthly_rmr = coalesce(monthly_rmr, 0)
where coalesce(expected_monthly_rmr, 0) = 0
  and coalesce(monthly_rmr, 0) > 0;
