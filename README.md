# GoAccess Vendor Portal

Next.js app-router app for GoAccess vendor onboarding, deal registration, HubSpot sync, and vendor portal access.

## Structure

- `app/`: routes, layout, metadata, and global styles
- `app/api/demo-request/route.ts`: landing-page form submission endpoint
- `app/api/vendor-applications/route.ts`: GoAccess vendor application API
- `app/invite/[token]/page.tsx`: vendor invite acceptance entrypoint
- `app/api/deals/route.ts`: vendor deal registration API
- `app/api/track/route.ts`: lightweight analytics collector endpoint
- `app/login/page.tsx`: mock login selector for vendor vs partner workspace
- `app/auth/mock-login/route.ts`: cookie-backed mock session login
- `app/auth/logout/route.ts`: clears mock session
- `components/marketing/`: reusable landing-page sections
- `components/product/`: product shell components for future app surfaces
- `data/site-content.ts`: copy and section data
- `lib/hubspot.ts`: HubSpot form submission and deal sync integration
- `lib/goaccess-store.ts`: file-backed prototype persistence for vendor applications, deals, and sync events
- `lib/goaccess-store.ts`: file-backed prototype persistence for vendor applications, NDA/invite state, deals, sync events, and notifications
- `lib/analytics.ts`: browser analytics helper
- `lib/auth.ts`: mock workspace auth helpers
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
- add real auth and invitation delivery for approved vendors
- finalize HubSpot pipeline, stage, and custom property mappings

## Analytics

Client events currently post to `/api/track` and also push into `window.dataLayer` / `gtag` if present.

Tracked events:

- `demo_request_field_focused`
- `demo_request_submitted`
- `demo_request_succeeded`
- `demo_request_failed`

## Mock auth

Protected routes:

- `/app/*` requires the `vendor` role
- `/portal/*` requires the `partner` role

Current prototype auth flow:

- visit `/login`
- choose vendor or partner workspace
- a cookie-backed session is set
- middleware redirects unauthorized role access back to login
- when credentials are issued, the vendor invite route `/invite/[token]` can activate portal access and log the vendor into the approved portal
Deployment trigger
