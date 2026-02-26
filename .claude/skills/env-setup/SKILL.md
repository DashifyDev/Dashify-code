---
name: env-setup
description: Generate or update .env.example by scanning the codebase for all process.env references — safe placeholder values only, no real secrets
---

1. Search `src/` and `scripts/` for all `process.env.` references using Grep
2. Collect the unique variable names
3. Group them by domain:
   - **Auth0**: `AUTH0_*`, `AUTH0_SECRET`, `AUTH0_BASE_URL`, etc.
   - **MongoDB**: `MONGODB_URI`, `MONGO_*`
   - **Cloudinary**: `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_*`
   - **App**: `NEXT_PUBLIC_*` (non-service variables)
   - **Other**: anything that doesn't fit above groups

4. Create (or overwrite) `.env.example` at the project root with:
   - A comment header explaining the file
   - Each group separated by a blank line with a `# Group Name` comment
   - Each variable set to an empty string or a safe illustrative placeholder:
     - URLs → `http://localhost:PORT` or `https://your-domain.com`
     - Secrets → `your-secret-here`
     - IDs → `your-id-here`
     - API keys → `your-api-key-here`
   - **Never copy real values from `.env`**

5. Report back:
   - How many unique variables were found
   - Which file they were written to
   - Any variables that were already in `.env.example` vs newly added

Example output format for `.env.example`:
```env
# Environment variables required to run Boardzy/Dashify
# Copy this file to .env.local and fill in real values

# Auth0
AUTH0_SECRET=your-long-random-secret-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/dashify

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
