create table if not exists public.vendor_applications (
  id text primary key,
  company_name text not null,
  website text not null,
  city text,
  state text,
  region text not null,
  vendor_type text not null,
  primary_contact_name text not null,
  primary_contact_email text not null,
  notes text not null default '',
  status text not null,
  nda_sent_at timestamptz,
  nda_signed_at timestamptz,
  approval_email_sent_at timestamptz,
  credentials_issued_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists vendor_applications_primary_contact_email_idx
  on public.vendor_applications (lower(primary_contact_email));

create table if not exists public.approved_vendors (
  id text primary key,
  application_id text not null,
  company_name text not null,
  website text not null,
  city text,
  state text,
  region text not null,
  vendor_type text not null,
  primary_contact_name text not null,
  primary_contact_email text not null,
  status text not null,
  nda_status text not null,
  nda_sent_at timestamptz,
  nda_signed_at timestamptz,
  nda_document_name text,
  nda_document_url text,
  signed_nda_file_name text,
  signed_nda_file_url text,
  signed_nda_blob_path text,
  signed_nda_uploaded_at timestamptz,
  credentials_issued boolean not null default false,
  credentials_issued_at timestamptz,
  portal_access text not null,
  invite_token text,
  invite_sent_at timestamptz,
  invite_accepted_at timestamptz,
  password_salt text,
  password_hash text,
  password_configured_at timestamptz,
  hubspot_partner_id text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create unique index if not exists approved_vendors_primary_contact_email_idx
  on public.approved_vendors (lower(primary_contact_email));

create unique index if not exists approved_vendors_invite_token_idx
  on public.approved_vendors (invite_token)
  where invite_token is not null;

create table if not exists public.deal_registrations (
  id text primary key,
  vendor_id text not null,
  company_name text not null,
  domain text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  estimated_value numeric not null,
  monthly_rmr numeric not null,
  product_interest text not null,
  notes text not null default '',
  status text not null,
  hubspot_company_id text,
  hubspot_contact_id text,
  hubspot_deal_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists deal_registrations_vendor_id_idx
  on public.deal_registrations (vendor_id);

create index if not exists deal_registrations_domain_idx
  on public.deal_registrations (lower(domain));

create table if not exists public.sync_events (
  id text primary key,
  deal_id text not null,
  vendor_id text not null,
  action text not null,
  status text not null,
  reference text not null,
  created_at timestamptz not null
);

create index if not exists sync_events_deal_id_idx
  on public.sync_events (deal_id);

create index if not exists sync_events_vendor_id_idx
  on public.sync_events (vendor_id);
