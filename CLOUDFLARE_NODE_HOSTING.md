# Cloudflare DNS + Node hosting

This project is a full-stack Node/Express application. The recommended
Cloudflare setup is to keep the application server on a Node-compatible host
and use Cloudflare as the public edge. A provider-neutral Docker image is
included so the origin can run on a VPS, Railway, Render, or another
Docker-compatible host.

## Architecture

```text
Visitor -> Cloudflare DNS/Tunnel -> Node container -> Supabase/MySQL/external APIs
```

Do not deploy this repository as a static-only Cloudflare Pages site. The
server provides authentication, booking routes, Supabase access, email
delivery, BIN lookup, tRPC, and the production static-file fallback.

## Node host settings

Use the existing package scripts:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The host must:

- run Node.js 20.19 or newer, as declared in `package.json`;
- expose the platform-provided `PORT` environment variable;
- keep the process running as a long-lived Node service;
- provide HTTPS at the origin, either with a host-managed certificate,
  Let's Encrypt, or a Cloudflare Origin CA certificate;
- allow inbound traffic from Cloudflare to the origin port.

The server binds to `0.0.0.0` and uses `PORT` exactly. It does not select a
different port when the configured one is busy, which makes a bad host
configuration fail clearly instead of leaving Cloudflare unable to reach the
origin.

## Docker deployment

Build and run the included image:

```sh
docker build -t diriyah-app .
docker run -d \
  --name diriyah-app \
  --restart unless-stopped \
  --env-file .env.production \
  -p 127.0.0.1:3000:3000 \
  diriyah-app
```

If the production client needs public `VITE_*` configuration, pass those
values at build time:

```sh
docker build \
  --build-arg VITE_APP_ID="..." \
  --build-arg VITE_OAUTH_PORTAL_URL="..." \
  --build-arg VITE_FRONTEND_FORGE_API_URL="..." \
  --build-arg VITE_FRONTEND_FORGE_API_KEY="..." \
  -t diriyah-app .
```

Do not pass server-only credentials as Docker build arguments. Keep them in
`.env.production` or the host’s secret manager and inject them only when the
container starts.

## Cloudflare Tunnel (recommended for a VPS)

Cloudflare Tunnel keeps the Node port private and lets Cloudflare provide the
public HTTPS endpoint:

1. Run the Docker container bound to `127.0.0.1` as shown above.
2. Create a named tunnel in Cloudflare Zero Trust and install `cloudflared`
   on the same host.
3. Copy `cloudflared/config.yml.example` to the host’s
   `/etc/cloudflared/config.yml`.
4. Replace the tunnel ID, credentials-file name, and `app.example.com`
   placeholder with your real values.
5. Route the public hostname to `http://localhost:3000` through the tunnel.
6. Set `CANONICAL_ORIGIN` to the public HTTPS hostname.
7. Confirm `/api/health` and the application pages through that hostname.

Do not commit the tunnel token or credentials file. Configure them through
the host’s secret manager or the `cloudflared` service configuration.

For an origin health check, use:

```text
GET /api/health
```

It returns `{"status":"ok"}` when the Node process and HTTP server are
available.

## Cloudflare DNS and TLS without Tunnel

Use this path when the Node host already provides a public HTTPS origin:

1. Add the origin host’s public address as an `A`, `AAAA`, or `CNAME` record
   for the desired hostname.
2. Enable the orange-cloud proxy only after the origin responds directly over
   HTTPS.
3. Set Cloudflare SSL/TLS encryption mode to **Full (strict)**.
4. Set `CANONICAL_ORIGIN` to the final public HTTPS URL, for example
   `https://example.com`.
5. Confirm that `/`, `/robots.txt`, `/sitemap.xml`, `/api/health`, and the
   application’s API routes work through the Cloudflare hostname.

Do not use Flexible TLS for this application. It leaves the origin
connection unencrypted and can create confusing redirect and cookie behavior.

## Environment variables

Set these on the Node host; do not commit real values:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV=production` | Enables the production static-file server and secure cookies |
| `PORT` | Port assigned by the Node host |
| `DATABASE_URL` | MySQL connection used by Drizzle |
| `SUPABASE_URL` | Server-side Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Server-side Supabase access for database/auth proxy routes |
| `JWT_SECRET` | Session/OAuth signing configuration used by the server |
| `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID` | OAuth configuration |
| `OWNER_OPEN_ID` | Optional owner identity used for admin assignment |
| `CANONICAL_ORIGIN` | Public HTTPS URL used by SEO routes |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Optional confirmation email delivery |
| `BINCODES_API_KEY`, `RAPIDAPI_BIN_KEY` | Optional card BIN lookup providers |
| `GEMINI_API_KEY` | AI features, when enabled |

Variables beginning with `VITE_` are embedded during `pnpm build`, so set
them before building a release. Server-only credentials must not use the
`VITE_` prefix.

The complete placeholder list is in `.env.example`. Use the actual secret
manager provided by the Node host rather than committing a `.env` file.

## First deployment checklist

- [ ] Database and Supabase credentials are set on the Node host.
- [ ] `pnpm build` completes on the host.
- [ ] `pnpm start` stays running and listens on the assigned `PORT`.
- [ ] Direct origin HTTPS works before enabling the Cloudflare proxy.
- [ ] Cloudflare is set to **Full (strict)**.
- [ ] `CANONICAL_ORIGIN` matches the final public URL.
- [ ] OAuth callback URLs and Supabase allowed URLs include the final hostname.
- [ ] Cloudflare proxy access to `/api/*` and normal page navigations is verified.