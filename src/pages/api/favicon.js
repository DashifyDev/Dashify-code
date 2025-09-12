import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const faviconPath = path.join(process.cwd(), "public", "favicon.ico");

    if (!fs.existsSync(faviconPath)) {
      console.error("Favicon not found at", faviconPath);
      return res.status(404).end();
    }

    const stat = fs.statSync(faviconPath);
    res.setHeader("Content-Type", "image/x-icon");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Length", stat.size);

    const stream = fs.createReadStream(faviconPath);
    stream.on("error", (err) => {
      console.error("Error streaming favicon:", err);
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Error serving favicon:", error);
    res.status(500).end();
  }
}
