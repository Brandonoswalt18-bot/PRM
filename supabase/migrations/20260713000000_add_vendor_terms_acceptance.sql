alter table public.approved_vendors
  add column if not exists terms_document_url text,
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_accepted_by text;

update public.approved_vendors
set
  terms_version = coalesce(terms_version, 'legacy-prelaunch'),
  terms_accepted_at = coalesce(terms_accepted_at, nda_signed_at, credentials_issued_at),
  terms_accepted_by = coalesce(terms_accepted_by, primary_contact_name)
where
  terms_accepted_at is null
  and (nda_status = 'signed' or credentials_issued = true);

comment on column public.approved_vendors.terms_accepted_at is
  'Timestamp when the vendor accepted the versioned GoAccess Vendor Terms & Conditions.';
