# Proposal: Authentication & Access Control

## Why

The business simulation platform requires a secure, admin-controlled access system where teachers manage student participation without exposing sensitive game administration features. Magic-link authentication provides frictionless access while eliminating password management overhead.

## What Changes

- **Public Access Request Flow**: Add `/request-access` route with form for name, email, and role selection (teacher/student)
- **Magic Link Authentication**: Implement Convex-auth magic link login flow at `/login`
- **Admin Access Dashboard**: Create `/admin/access` with two-tab interface for:
  - **Pending Requests Tab**: List of access requests with Approve/Deny actions; approve opens modal to select game/industry/company (company auto-selects to least-populated for students)
  - **Direct Grant Tab**: Form to grant access to any email without pending request
- **Role-Based Permissions**: Implement three roles with scoped access:
  - `admin`: Hand-written, full system access
  - `teacher`: View all companies within their assigned simulation
  - `student`: View only their assigned company
- **Game Seeding**: Games are seeded directly by admins (no game creation UI for this MVP)

## Capabilities

### New Capabilities

- `magic-link-auth`: Send and validate magic links for passwordless authentication, track login sessions, handle token expiration and replay prevention

- `access-request-workflow`: Public-facing access request form, pending request storage, admin approval/denial workflow, email notifications for access decisions

- `admin-access-control`: Admin dashboard for managing user access, company assignment logic with least-populated auto-selection, role-based permission enforcement at API level

### Modified Capabilities

- `rbac-security`: Extend existing row-level security framework to support game/company-scoped permissions for teachers and students

## Impact

**Affected Systems:**
- **Convex auth integration**: Configure `@convex-dev/auth` with magic link provider
- **Database schema**: Add tables for users, access_requests, games, companies, and role assignments
- **Routing**: Add public routes for access request and login, protected routes for admin dashboard
- **Email service**: Integration for sending magic links and access notifications
- **Middleware**: Auth guards for protecting routes based on user roles

**New Dependencies:**
- `@convex-dev/auth` (already in package.json)
- Email service provider (e.g., Resend, SendGrid) for magic links

**Breaking Changes:**
- None (new feature addition)

**Security Considerations:**
- Magic links must expire within 15 minutes
- One-time use tokens with replay prevention
- Rate limiting on magic link requests
- Admin dashboard requires 2FA for production use
