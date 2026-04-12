# GoAccess Vendor Portal

Next.js app-router app for GoAccess vendor onboarding, deal registration, HubSpot sync, and vendor portal access.

## Structure

- `app/`: routes, layout, metadata, and global styles
- `app/api/demo-request/route.ts`: public application-form submission endpoint
- `app/api/vendor-applications/route.ts`: GoAccess vendor application API
- `app/invite/[token]/page.tsx`: vendor invite acceptance entrypoint
- `app/api/deals/route.ts`: vendor deal registration API
- `app/api/track/route.ts`: lightweight analytics collector endpoint
- `app/api/training-assets/route.ts`: admin training upload and external-link endpoint
- `app/api/training-assets/file/route.ts`: gated training file delivery endpoint for admin/vendor sessions
- `app/login/page.tsx`: shared portal login
- `app/auth/login/route.ts`: password-backed login route
- `app/auth/activate/route.ts`: vendor invite password setup
- `app/auth/logout/route.ts`: clears mock session
- `components/marketing/`: reusable landing-page sections
- `components/product/`: product shell components for future app surfaces
- `data/site-content.ts`: copy and section data
- `lib/hubspot.ts`: HubSpot form submission and deal sync integration
- `lib/goaccess-store.ts`: store abstraction for vendor applications, NDA/invite state, deals, sync events, and notifications
- `lib/supabase-server.ts`: optional server-side Supabase client wiring
- `supabase/migrations/20260403_phase1_vendor_portal.sql`: Phase 1 Supabase schema for core portal records
- `lib/analytics.ts`: browser analytics helper
- `lib/auth.ts`: workspace auth helpers
- `lib/auth-session.ts`: signed session cookie helpers
- `lib/password.ts`: password hashing and verification
- `middleware.ts`: route protection for `/app` and `/portal`

## Run locally

Install dependencies, then start the development server:

```bash
npm install
npm run dev
```

## HubSpot integration

The public application form and admin deal-sync actions can route into HubSpot.

Current behavior:

- validates required fields
- accepts both personal and company email addresses
- logs accepted requests server-side when HubSpot is not configured
- submits to HubSpot Forms API when env vars are present
- creates or updates HubSpot companies, contacts, and deals when an admin syncs an approved vendor deal
- inspects HubSpot for existing company, contact, and open associated deal conflicts before writing a new approved vendor deal
- records outbound applicant, admin, approval, NDA, and credential invite notifications in the local store
- uses a Google Docs NDA link for the current lightweight legal workflow
- sends vendor lifecycle emails through Resend when email env vars are configured
- supports admin-managed training videos and documents for vendor learning

Required env vars for HubSpot routing:

- `HUBSPOT_ACCESS_TOKEN`
- `HUBSPOT_PORTAL_ID`
- `HUBSPOT_DEMO_FORM_GUID`
- `HUBSPOT_DEAL_STAGE_ID`

Optional env vars for HubSpot deal sync:

- `HUBSPOT_DEAL_PIPELINE_ID`
- `HUBSPOT_VENDOR_ID_PROPERTY`
- `HUBSPOT_VENDOR_EMAIL_PROPERTY`
- `HUBSPOT_DEAL_SUBMISSION_ID_PROPERTY` - HubSpot internal deal property name that stores the portal deal ID, for example `partner_portal_submission_id`
- `HUBSPOT_DEAL_REGISTRATION_STATUS_PROPERTY` - HubSpot internal deal property name that stores the portal deal status, for example `partner_registration_status`
- `HUBSPOT_DEAL_REGISTERED_AT_PROPERTY` - HubSpot internal deal property name that stores the portal submission timestamp, for example `partner_registered_at`

Operational notes:

- use HubSpot internal property names, not labels
- the three custom deal property env vars are required for the duplicate-safe sync path
- if any of those three env vars are missing, invalid, or point to the same HubSpot property, admin readiness will hold sync instead of silently degrading
- sync creates a new HubSpot deal only when no submission-linked deal exists and no duplicate-risk conflict is found on the matched company
- sync updates an existing HubSpot deal when the configured submission ID property already matches the portal submission
- sync holds for review when the matched company already has open deal(s), when multiple submission-linked deals are found, or when submission-link signals conflict

Portal workflow env vars:

- `GOACCESS_NDA_DOCUMENT_URL`
- `GOACCESS_PORTAL_BASE_URL`
- `GOACCESS_APPLICATION_NOTIFICATION_EMAIL`
- `BLOB_READ_WRITE_TOKEN`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`

Typical production follow-up:

- finalize HubSpot pipeline, stage, and custom property mappings

## Supabase storage

Phase 1 adds an optional Supabase backing store under the existing `lib/goaccess-store.ts` API.

Required env vars to enable Supabase mode:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

How it works:

- when both Supabase env vars are present, `lib/goaccess-store.ts` uses Supabase as the primary durable store for:
  - approved vendors
  - vendor applications
  - deal registrations
  - sync events
- lower-priority entities still use the legacy store path for now:
  - notifications
  - support requests
  - training asset metadata
- when Supabase env is missing or invalid, the app safely falls back to the existing legacy store behavior
- the login/session flow stays custom; Supabase Auth is not used in this phase

Legacy fallback behavior:

- `BLOB_READ_WRITE_TOKEN` persists the legacy store in Vercel Blob
- local development can persist to `data/goaccess-vendor-portal.json`
- if neither is available, the app falls back to the seeded in-code store

Run the Phase 1 schema:

```bash
supabase db push
```

or apply the SQL in:

```text
supabase/migrations/20260403_phase1_vendor_portal.sql
```

Operational notes:

- Supabase mode bootstraps the seeded core records the first time the Phase 1 tables are empty
- the seeded local/dev vendor test login remains `jordan@bluehavenintegrators.com` / `goaccess-vendor-demo`
- production auth still reads vendor password metadata from the existing store abstraction, which now resolves to Supabase when configured

## Learning library

Admins can upload private training videos and documents, or add external links, from `/app/learning`.

Approved vendors can open the published library from `/portal/learning`.

Notes:

- private uploaded files require `BLOB_READ_WRITE_TOKEN`
- external links do not require blob storage
- file opens are gated by the active admin or vendor session

## Analytics

Client events currently post to `/api/track` and also push into `window.dataLayer` / `gtag` if present.

Tracked events:

- `demo_request_field_focused`
- `demo_request_submitted`
- `demo_request_succeeded`
- `demo_request_failed`

## Auth

Protected routes:

- `/app/*` requires the `admin` role
- `/portal/*` requires the `vendor` role

Current auth flow:

- visit `/login`
- sign in with email + password
- middleware redirects unauthorized role access back to login
- when credentials are issued, the vendor invite route `/invite/[token]` is used to create the vendor password and activate portal access

Required auth env vars for production:

- `AUTH_SECRET`
- `GOACCESS_ADMIN_PASSWORD`

Without `GOACCESS_ADMIN_PASSWORD`, the admin account cannot sign in on production.

Optional auth env vars:

- `GOACCESS_ADMIN_EMAIL`

Optional HubSpot deal property env vars:

- `HUBSPOT_DEAL_MONTHLY_RMR_PROPERTY`
- `HUBSPOT_DEAL_PRODUCT_INTEREST_PROPERTY`
- `HUBSPOT_DEAL_VENDOR_NAME_PROPERTY`
