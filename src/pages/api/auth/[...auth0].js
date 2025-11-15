import { handleAuth, handleLogin } from "@auth0/nextjs-auth0";

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
