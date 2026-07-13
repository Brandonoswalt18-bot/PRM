alter table public.approved_vendors
  add column if not exists nda_version text,
  add column if not exists nda_document_sha256 text,
  add column if not exists nda_accepted_by text,
  add column if not exists nda_accepted_title text,
  add column if not exists nda_acceptance_ip text,
  add column if not exists nda_acceptance_user_agent text,
  add column if not exists nda_acceptance_text text,
  add column if not exists terms_document_sha256 text,
  add column if not exists terms_accepted_title text,
  add column if not exists terms_acceptance_ip text,
  add column if not exists terms_acceptance_user_agent text,
  add column if not exists terms_acceptance_text text;

update public.approved_vendors
set
  nda_document_name = 'GoAccess Mutual NDA',
  nda_document_url = '/legal/goaccess-mutual-nda.pdf',
  terms_document_url = '/legal/goaccess-partner-terms.pdf';

update public.approved_vendors
set
  nda_version = coalesce(nda_version, 'legacy-prelaunch'),
  nda_accepted_by = coalesce(nda_accepted_by, primary_contact_name)
where nda_status = 'signed';

update public.approved_vendors
set
  nda_version = '2026-07',
  nda_document_sha256 = '05e43f5d80e8a93b4da1bafa779640c7e454fe4ca78d3d690c8cafa05aed8a7e'
where nda_status <> 'signed';

update public.approved_vendors
set terms_document_sha256 = 'c6386ee3e3325ea2aa366055a750f64826eb00fca587fc2b03bd2431176922d1'
where terms_version = '2026-07';

update public.approved_vendors
set
  nda_status = 'sent',
  nda_signed_at = null,
  nda_version = '2026-07',
  nda_document_sha256 = '05e43f5d80e8a93b4da1bafa779640c7e454fe4ca78d3d690c8cafa05aed8a7e',
  nda_accepted_by = null,
  nda_accepted_title = null,
  nda_acceptance_ip = null,
  nda_acceptance_user_agent = null,
  nda_acceptance_text = null,
  terms_version = '2026-07',
  terms_document_sha256 = 'c6386ee3e3325ea2aa366055a750f64826eb00fca587fc2b03bd2431176922d1',
  terms_accepted_at = null,
  terms_accepted_by = null,
  terms_accepted_title = null,
  terms_acceptance_ip = null,
  terms_acceptance_user_agent = null,
  terms_acceptance_text = null
where id = 'vendor-unsigned-demo';

update public.vendor_applications
set
  status = 'nda_sent',
  nda_signed_at = null,
  updated_at = now()
where id = 'app-unsigned-demo';

comment on column public.approved_vendors.nda_acceptance_text is
  'Exact click-through language accepted for the versioned GoAccess Mutual NDA.';

comment on column public.approved_vendors.terms_acceptance_text is
  'Exact click-through language accepted for the versioned GoAccess Channel Partner Service Agreement.';
