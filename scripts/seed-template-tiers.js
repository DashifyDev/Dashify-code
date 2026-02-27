/**
 * seed-template-tiers.js
 *
 * Sets isPremium on existing templates so you can test community vs premium
 * filtering and the lock/blur overlay in the library.
 *
 * Usage:
 *   node scripts/seed-template-tiers.js            # dry-run: list current state
 *   node scripts/seed-template-tiers.js --apply    # write changes to DB
 *   node scripts/seed-template-tiers.js --reset    # set ALL templates to isPremium: false
 *
 * Requires MONGO_URI or MONGODB_URI in environment (from .env or .env.local).
 * Falls back to localhost if neither is set.
 *
 * The script marks the FIRST premiumCount templates (sorted by name) as premium
 * and the rest as community. Adjust premiumCount or the premiumNames list below.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const dns = require("dns");
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/dasify";

// Node's resolver can get ECONNREFUSED for SRV even when nslookup works (e.g. IPv6 or router
// refusing Node's DNS queries). Use public DNS and IPv4-first so SRV resolution succeeds.
if (typeof window === "undefined" && MONGODB_URI.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  if (dns.setDefaultResultOrder) dns.setDefaultResultOrder("ipv4first");
}

// ── Configuration ─────────────────────────────────────────────────────────────
// Option A: mark specific templates by name as premium
const premiumNames = [
  // Add exact boardName values here to mark those as premium.
  // Leave empty to use Option B (count-based).
];

// Option B: if premiumNames is empty, mark the first N alphabetically as premium
const premiumCount = 1;
// ──────────────────────────────────────────────────────────────────────────────

const TemplateSchema = new mongoose.Schema({
  boardName: String,
  keywords: [String],
  boardImage: String,
  createdAt: Date,
  date: String,
  rating: String,
  boardLink: String,
  boardDescription: String,
  isPremium: { type: Boolean, default: false },
});
const Template = mongoose.models.Template || mongoose.model("Template", TemplateSchema);

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const reset = args.includes("--reset");

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI.replace(/\/\/.*@/, "//<credentials>@"));

  const templates = await Template.find().sort({ boardName: 1 });
  console.log(`\nFound ${templates.length} template(s):\n`);

  if (reset) {
    console.log("--reset: marking ALL templates as community (isPremium: false)");
    if (apply) {
      await Template.updateMany({}, { isPremium: false });
      console.log("Done. All templates set to isPremium: false.");
    } else {
      console.log("[dry-run] Would set all templates to isPremium: false. Pass --apply to commit.");
    }
    await mongoose.disconnect();
    return;
  }

  // Determine which templates should be premium
  let premiumSet;
  if (premiumNames.length > 0) {
    premiumSet = new Set(premiumNames);
  } else {
    // Mark first N alphabetically
    premiumSet = new Set(templates.slice(0, premiumCount).map(t => t.boardName));
  }

  console.log("Name".padEnd(40), "Current isPremium", "→ New isPremium");
  console.log("-".repeat(70));
  for (const t of templates) {
    const willBePremium = premiumSet.has(t.boardName);
    const changed = t.isPremium !== willBePremium ? " ← CHANGE" : "";
    console.log(t.boardName.padEnd(40), String(t.isPremium).padEnd(17), willBePremium, changed);
  }

  if (!apply) {
    console.log("\n[dry-run] No changes written. Pass --apply to commit changes to MongoDB.");
    await mongoose.disconnect();
    return;
  }

  // Apply changes
  let updated = 0;
  for (const t of templates) {
    const willBePremium = premiumSet.has(t.boardName);
    if (t.isPremium !== willBePremium) {
      await Template.updateOne({ _id: t._id }, { isPremium: willBePremium });
      updated++;
    }
  }

  console.log(`\nDone. ${updated} template(s) updated.`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
