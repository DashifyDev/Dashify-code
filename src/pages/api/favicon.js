import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const faviconPath = path.join(process.cwd(), "public", "favicon.ico");

    if (!fs.existsSync(faviconPath)) {
      return res.status(404).json({ error: "Favicon not found" });
    }

    const faviconBuffer = fs.readFileSync(faviconPath);

    res.setHeader("Content-Type", "image/x-icon");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", faviconBuffer.length);

    res.send(faviconBuffer);
  } catch (error) {
    console.error("Error serving favicon:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
