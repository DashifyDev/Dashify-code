#!/usr/bin/env node
/**
 * PostToolUse hook — runs Prettier on the file Claude just edited/wrote.
 * Cross-platform: works on Windows, macOS, Linux.
 * Receives Claude tool call JSON via stdin.
 * Uses execFileSync (no shell interpolation) to avoid command injection.
 */
const { execFileSync } = require("child_process");
const path = require("path");

const SUPPORTED_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".json", ".md"]);

const chunks = [];
process.stdin.on("data", chunk => chunks.push(chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    process.exit(0); // not valid JSON — skip silently
  }

  const filePath = payload?.tool_input?.file_path || payload?.tool_input?.path || "";
  if (!filePath) process.exit(0);

  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) process.exit(0);

  try {
    // execFileSync with array args — safe from shell injection, cross-platform
    execFileSync("npx", ["prettier", "--write", filePath], { stdio: "pipe" });
  } catch (err) {
    // Don't block Claude if Prettier fails — just warn
    process.stderr.write(
      `[format-file] Prettier warning for ${path.basename(filePath)}: ${err.message}\n`
    );
  }

  process.exit(0);
});
