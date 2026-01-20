import { handleAuth, handleLogin } from "@auth0/nextjs-auth0";

/**
 * Auth0 configuration for mobile browsers (especially Safari)
 * 
 * ✅ YES - Just add these environment variables to your .env.local and they will be automatically used!
 * 
 * The @auth0/nextjs-auth0 SDK (v2.6.3) automatically reads these environment variables.
 * No code changes needed - just add them to .env.local and restart your dev server.
 * 
 * Required environment variables:
 * 
 * AUTH0_SESSION_ROLLING=true                    # Enable rolling sessions (extends on activity)
 * AUTH0_SESSION_ROLLING_DURATION=604800         # 7 days in seconds (prevents quick logout on mobile)
 * AUTH0_SESSION_ABSOLUTE_DURATION=2592000       # 30 days in seconds (max session lifetime)
 * AUTH0_COOKIE_SAME_SITE=none                   # Required for cross-site OAuth redirects
 * AUTH0_COOKIE_SECURE=true                      # Required when SameSite=None (must be true in production)
 * 
 * Optional but recommended:
 * AUTH0_COOKIE_DOMAIN=.yourdomain.com           # Your domain (with leading dot for subdomains)
 * AUTH0_COOKIE_PATH=/                           # Cookie path
 * 
 * These settings help prevent Safari and other mobile browsers from logging users out too quickly
 * due to Intelligent Tracking Prevention (ITP) and cookie restrictions.
 * 
 * ⚠️ IMPORTANT: Also check Auth0 Dashboard → Tenant Settings → Advanced → Session Expiration
 * Make sure the tenant-level settings allow these durations!
 */
export default handleAuth({
  async login(req, res) {
    await handleLogin(req, res, {
      authorizationParams: {
        // forward screen_hint when present (e.g. signup)
        ...(req.query.screen_hint
          ? { screen_hint: req.query.screen_hint }
          : {}),
        // keep your existing behavior
        prompt: "login select_account",
      },
    });
  },
});
