alter table public.deal_registrations
  add column if not exists decision_at timestamptz,
  add column if not exists decline_reason text;

alter table public.deal_registrations
  drop constraint if exists deal_registrations_decline_reason_length_check;

alter table public.deal_registrations
  add constraint deal_registrations_decline_reason_length_check
  check (decline_reason is null or char_length(decline_reason) <= 1000);

create table if not exists public.deal_decision_audit (
  id text primary key,
  deal_id text not null references public.deal_registrations(id) on delete restrict,
  vendor_id text not null references public.approved_vendors(id) on delete restrict,
  decision text not null check (decision in ('approved', 'rejected')),
  decline_reason text check (decline_reason is null or char_length(decline_reason) <= 1000),
  decided_by_name text not null,
  decided_by_email text not null,
  created_at timestamptz not null
);

create index if not exists deal_decision_audit_deal_created_idx
  on public.deal_decision_audit (deal_id, created_at desc);

create index if not exists deal_decision_audit_actor_created_idx
  on public.deal_decision_audit (decided_by_email, created_at desc);

alter table public.deal_decision_audit enable row level security;

alter table public.vendor_notifications
  add column if not exists deal_id text references public.deal_registrations(id) on delete set null;

create index if not exists vendor_notifications_deal_created_idx
  on public.vendor_notifications (deal_id, created_at desc);

alter table public.vendor_notifications
  drop constraint if exists vendor_notifications_category_check;

alter table public.vendor_notifications
  add constraint vendor_notifications_category_check
  check (category in (
    'application_received',
    'application_internal_alert',
    'deal_internal_alert',
    'deal_approved',
    'deal_declined',
    'application_approved',
    'nda_sent',
    'credentials_issued',
    'dealer_agreement_sent'
  ));

comment on table public.deal_decision_audit is
  'Append-only application audit trail for GoAccess administrator deal approval and decline decisions.';

comment on column public.deal_registrations.decline_reason is
  'Optional vendor-facing reason captured when GoAccess declines a deal registration.';
