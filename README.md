# GoAccess Vendor Portal

Next.js app-router marketing site for a PRM SaaS concept modeled on the product blueprint.

## Structure

- `app/`: routes, layout, metadata, and global styles
- `app/api/demo-request/route.ts`: demo request submission endpoint
- `app/api/track/route.ts`: lightweight analytics collector endpoint
- `app/login/page.tsx`: mock login selector for vendor vs partner workspace
- `app/auth/mock-login/route.ts`: cookie-backed mock session login
- `app/auth/logout/route.ts`: clears mock session
- `components/marketing/`: reusable landing-page sections
- `components/product/`: product shell components for future app surfaces
- `data/site-content.ts`: copy and section data
- `lib/hubspot.ts`: HubSpot form submission integration
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

## Demo request flow

The CTA form submits to `/api/demo-request`.

Current behavior:

- validates required fields
- rejects common personal email domains
- logs accepted requests server-side when HubSpot is not configured
- submits to HubSpot Forms API when env vars are present

Required env vars for HubSpot routing:

- `HUBSPOT_ACCESS_TOKEN`
- `HUBSPOT_PORTAL_ID`
- `HUBSPOT_DEMO_FORM_GUID`

Typical production follow-up:

- route directly into HubSpot ownership and lifecycle workflows
- notify sales or route to a shared inbox
- attach campaign/source metadata

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
