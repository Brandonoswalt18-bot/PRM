update public.approved_vendors
set
  nda_document_name = 'GoAccess Non-Disclosure Agreement',
  nda_document_url = '/legal/goaccess-non-disclosure-agreement.pdf',
  nda_version = '2026-07.1',
  nda_document_sha256 = '28a206cc072f9c2eff9494c537c63f3a335fe74e564093d18f3f37c56af0f2b5'
where nda_status <> 'signed';

comment on column public.approved_vendors.nda_acceptance_text is
  'Exact click-through language accepted for the versioned GoAccess Non-Disclosure Agreement.';
