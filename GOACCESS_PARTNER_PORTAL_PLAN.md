# GoAccess Partner Portal Plan

## Product Goal

Build a focused GoAccess partner portal, not a generic multi-tenant PRM.

The first version should let GoAccess:

- accept partner applications
- approve or reject partners
- let approved partners create accounts and log in
- let partners register deals
- sync approved deals into HubSpot
- let partners track deal status from the portal

## Core Product Decision

HubSpot should be the sales system of record.

The portal should be:

- the partner-facing entry point
- the approval and visibility layer
- the place where partners submit and track deals

The portal should not be the main CRM.

## MVP Scope

### Public

- GoAccess partner landing page
- partner application form
- login page

### Admin

- partner application review queue
- approve or reject partners
- partner list
- deal registration review queue
- deal detail view
- status updates
- internal notes
- HubSpot sync status

### Partner

- account creation after approval
- login
- dashboard
- register a deal
- view submitted deals
- view deal status
- update profile

## Deal Registration Workflow

1. Partner submits a deal in the portal.
2. Portal stores the submission in the app database.
3. Admin reviews for duplicates and fit.
4. If approved, the app creates or links HubSpot records.
5. Portal stores HubSpot IDs locally.
6. HubSpot deal stage becomes the source of truth for pipeline status.
7. Portal syncs status back to the partner-facing deal view.

## Recommended Deal Statuses

Internal / portal statuses:

- submitted
- under_review
- approved
- rejected
- synced_to_hubspot
- in_pipeline
- closed_won
- closed_lost

## Required Database Tables

- `users`
- `partners`
- `partner_applications`
- `partner_memberships`
- `deal_registrations`
- `deal_registration_status_history`
- `admin_notes`
- `hubspot_sync_events`

## Required Deal Registration Fields

- company name
- company website or domain
- contact first name
- contact last name
- contact email
- contact phone
- estimated value
- country / region
- product interest
- notes
- partner id

## HubSpot Mapping

### Company

- company name
- domain
- website
- country

### Contact

- first name
- last name
- email
- phone

### Deal

- deal name
- estimated amount
- pipeline
- stage
- notes
- partner metadata

## HubSpot Custom Deal Properties

Create these on the HubSpot Deal object:

- `partner_portal_submission_id`
- `partner_portal_partner_id`
- `partner_name`
- `partner_email`
- `partner_registration_status`
- `partner_registered_at`
- `partner_notes`
- `is_partner_registered_deal`

Optional:

- `partner_conflict_flag`
- `partner_program`

## Duplicate Review Rules

Before creating a new HubSpot deal, check:

- existing company by domain
- existing contact by email
- existing open deal for that company
- existing partner-submitted deal for that same account

If a conflict exists:

- keep the portal record
- mark it `under_review`
- let admin decide whether to create, merge, or reject

## Recommended Build Order

### Phase 1

- real auth
- partner application flow
- admin approval flow
- partner dashboard
- deal registration form
- local database for registrations

### Phase 2

- HubSpot integration
- duplicate checking
- admin review workflow
- HubSpot ID sync back into portal
- partner status tracking

### Phase 3

- email notifications
- audit trail improvements
- CSV exports
- profile and payout/compliance placeholders

## Not In Scope Yet

Do not prioritize these yet:

- commissions
- payouts
- Stripe integration
- affiliate links
- cookie attribution
- partner marketplace
- network effects
- multi-tenant SaaS positioning

## Immediate Development Direction

The existing live site should now be repositioned as:

- GoAccess Partner Portal

The next code work should focus on:

1. replacing mock auth with real auth
2. adding partner application and approval storage
3. implementing deal registration data model
4. implementing HubSpot create/update/link flows
5. showing HubSpot-backed deal status in the portal
