update public.approved_vendors
set
  terms_document_url = '/legal/goaccess-partner-terms.pdf',
  terms_version = '2026-07.1',
  terms_document_sha256 = '6623fb6c81c0e4ad26ccdb8c96b2b26cb7df56a846d6a66657078fb5870d6e94',
  updated_at = now()
where terms_accepted_at is null;

comment on column public.approved_vendors.terms_acceptance_text is
  'Exact click-through language accepted for the versioned GoAccess Partner Reseller Agreement.';
