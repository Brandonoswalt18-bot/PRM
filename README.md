# GoAccess Vendor Portal

Next.js app-router app for GoAccess vendor onboarding, deal registration, HubSpot sync, and vendor portal access.

## Structure

- `app/`: routes, layout, metadata, and global styles
- `app/api/demo-request/route.ts`: public application-form submission endpoint
- `app/api/vendor-applications/route.ts`: GoAccess vendor application API
- `app/invite/[token]/page.tsx`: vendor invite acceptance entrypoint
- `app/api/deals/route.ts`: vendor deal registration API
- `app/api/track/route.ts`: lightweight analytics collector endpoint
- `app/login/page.tsx`: shared portal login
- `app/auth/login/route.ts`: password-backed login route
- `app/auth/activate/route.ts`: vendor invite password setup
- `app/auth/logout/route.ts`: clears mock session
- `components/marketing/`: reusable landing-page sections
- `components/product/`: product shell components for future app surfaces
- `data/site-content.ts`: copy and section data
- `lib/hubspot.ts`: HubSpot form submission and deal sync integration
- `lib/goaccess-store.ts`: file-backed prototype persistence for vendor applications, deals, and sync events
- `lib/goaccess-store.ts`: file-backed prototype persistence for vendor applications, NDA/invite state, deals, sync events, and notifications
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

This environment does not have Node.js or npm installed, so the codebase was scaffolded manually and not executed here.

## HubSpot integration

The public application form and admin deal-sync actions can route into HubSpot.

Current behavior:

- validates required fields
- accepts both personal and company email addresses
- logs accepted requests server-side when HubSpot is not configured
- submits to HubSpot Forms API when env vars are present
- creates or updates HubSpot companies, contacts, and deals when an admin syncs an approved vendor deal
- records outbound applicant, admin, approval, NDA, and credential invite notifications in the local store
- uses a Google Docs NDA link for the current lightweight legal workflow
- sends vendor lifecycle emails through Resend when email env vars are configured

Required env vars for HubSpot routing:

- `HUBSPOT_ACCESS_TOKEN`
- `HUBSPOT_PORTAL_ID`
- `HUBSPOT_DEMO_FORM_GUID`
- `HUBSPOT_DEAL_STAGE_ID`

Optional env vars for HubSpot deal sync:

- `HUBSPOT_DEAL_PIPELINE_ID`
- `HUBSPOT_VENDOR_ID_PROPERTY`
- `HUBSPOT_VENDOR_EMAIL_PROPERTY`

Portal workflow env vars:

- `GOACCESS_NDA_DOCUMENT_URL`
- `GOACCESS_PORTAL_BASE_URL`
- `GOACCESS_APPLICATION_NOTIFICATION_EMAIL`
- `RESEND_API_KEY`
- `EMAIL_FROM_ADDRESS`

Typical production follow-up:

- replace the file-backed store with a real database
- finalize HubSpot pipeline, stage, and custom property mappings

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
