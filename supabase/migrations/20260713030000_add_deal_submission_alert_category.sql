alter table public.vendor_notifications
  drop constraint if exists vendor_notifications_category_check;

alter table public.vendor_notifications
  add constraint vendor_notifications_category_check
  check (category in (
    'application_received',
    'application_internal_alert',
    'deal_internal_alert',
    'application_approved',
    'nda_sent',
    'credentials_issued',
    'dealer_agreement_sent'
  ));
