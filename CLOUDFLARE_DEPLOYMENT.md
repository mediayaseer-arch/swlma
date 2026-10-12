# Cloudflare deployment

## Target

Deploy this project as a **Cloudflare Worker with Static Assets**.

Do not deploy it as a static-only Pages project. The browser intentionally uses
same-origin `/api/*` routes for booking data, dashboard authentication, visitor
location, BIN lookup, and confirmation email. A Pages-only deployment would
silently publish the UI without those server routes.

The existing Node/Express entrypoint remains unchanged for non-Cloudflare
hosting. `server/cloudflare.ts` is the Worker-specific adapter and uses
Cloudflare's supported `nodejs_compat` HTTP server bridge.

## Build and deploy

```bash
pnpm install --frozen-lockfile
pnpm run build:cloudflare
pnpm run deploy:cloudflare
```

- Static output: `dist/public`
- Worker entrypoint: `server/cloudflare.ts`
- Cloudflare configuration: `wrangler.jsonc`
- Local Worker preview: `pnpm run dev:cloudflare`

`build:cloudflare` performs a Wrangler dry run and writes the bundle to
`dist/cloudflare`; it does not publish anything.

## Environment configuration

Set non-secret values in `wrangler.jsonc` under `vars`, or in the Cloudflare
Workers dashboard. Set secrets with `wrangler secret put NAME` or the dashboard;
never place real secret values in `wrangler.jsonc`.

### Required for booking and dashboard authentication

| Name | Kind | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Variable | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Secret | Server-only Supabase key used by booking data and auth routes |
| `SESSION_SECRET` | Secret | Session signing fallback for the optional OAuth/tRPC auth stack |
| `CANONICAL_ORIGIN` | Variable | Final `https://` site origin for robots and sitemap URLs |

Use a least-privilege server key when possible. `SUPABASE_SERVICE_ROLE_KEY` and
`SUPABASE_ANON_KEY` are also recognized, but a privileged key must never use a
`VITE_` prefix because Vite exposes such values to browser bundles.

### Optional features

| Name | Kind | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Confirmation email delivery |
| `RESEND_FROM_EMAIL` | Variable | Verified sender address |
| `RAPIDAPI_BIN_KEY` | Secret | Primary BIN enrichment |
| `BINCODES_API_KEY` | Secret | Secondary BIN enrichment |
| `VITE_APP_ID` | Build variable | Legacy OAuth app identifier |
| `VITE_OAUTH_PORTAL_URL` | Build variable | Legacy OAuth portal URL |
| `OAUTH_SERVER_URL` | Variable | Legacy OAuth server |
| `DATABASE_URL` | Secret | Legacy OAuth user database |
| `OWNER_OPEN_ID` | Variable | Legacy admin identity |
| `BUILT_IN_FORGE_API_URL` | Variable | Optional platform service base URL |
| `BUILT_IN_FORGE_API_KEY` | Secret | Optional platform service credential |
| `VITE_FRONTEND_FORGE_API_URL` | Build variable | Optional browser map proxy URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Build secret | Optional browser map proxy key; treat as public once bundled |

Variables beginning with `VITE_` are read while Vite builds the browser assets.
Set them in the build environment as well as Worker bindings when the
corresponding feature is enabled.

## Cloudflare setup

Authenticate Wrangler, then configure the minimum secrets:

```bash
pnpm exec wrangler login
pnpm exec wrangler secret put SUPABASE_SECRET_KEY
pnpm exec wrangler secret put SESSION_SECRET
```

Add `SUPABASE_URL` and the final `CANONICAL_ORIGIN` as Worker variables. Add the
optional service values only for features that are in use.

## Production verification

After `pnpm run deploy:cloudflare`, use the URL printed by Wrangler:

1. Open `/`, `/restaurants`, and one `/restaurant/:id` route. Refresh each deep
   link to confirm the SPA asset fallback.
2. Open `/robots.txt` and `/sitemap.xml`; confirm they use
   `CANONICAL_ORIGIN`.
3. Complete a test booking through checkout and confirm the record appears in
   the Supabase `pays` collection.
4. Sign into the dashboard through `/api/auth/login`, refresh the dashboard,
   and sign out. Confirm the auth responses are not cached and the session
   cookie is `HttpOnly` and `Secure`.
5. If email is enabled, send one confirmation and verify the configured sender.
6. Review Worker logs while testing:

   ```bash
   pnpm exec wrangler tail
   ```

Do not run the booking/auth production checks until the Supabase URL and key are
configured for the intended production project.

Collection listings, deletes, settings/BIN administration, and email sending
require a valid dashboard session. Anonymous visitors retain only the
document-level reads and writes needed by the booking flow, protected by a
short-lived, server-signed booking capability cookie. Dashboard users must have
an `admin` role in Supabase `app_metadata` or an email included in
`ADMIN_EMAILS`. Raw card numbers, CVV values, and OTP values are removed before
booking records are persisted or returned.

Before the first public deployment, remove sensitive fields from any legacy
rows using the intended production Supabase credentials:

```bash
pnpm security:purge-booking-data
```