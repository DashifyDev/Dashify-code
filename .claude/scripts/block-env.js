#!/usr/bin/env node
/**
 * PreToolUse hook — blocks Claude from editing .env files that contain real secrets.
 * Cross-platform: works on Windows, macOS, Linux.
 * Receives Claude tool call JSON via stdin.
 * Exit code 2 = block the action and show the stderr message to the user.
 */
const path = require("path");

const chunks = [];
process.stdin.on("data", chunk => chunks.push(chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0);
  }

  const filePath = payload?.tool_input?.file_path || payload?.tool_input?.path || "";
  if (!filePath) process.exit(0);

  // Normalise to forward slashes for cross-platform comparison
  const normalised = filePath.replace(/\\/g, "/");
  const basename = path.basename(normalised);

  // Block .env and .env.local / .env.production etc. but allow .env.example
  const isEnvFile = /^\.env(\.|$)/.test(basename);
  const isExample = basename === ".env.example";

  if (isEnvFile && !isExample) {
    process.stderr.write(
      `Blocked: editing "${basename}" is not allowed — it contains real secrets.\n` +
        `Edit ".env.example" instead and document the required variable there.\n`
    );
    process.exit(2);
  }

  process.exit(0);
});
