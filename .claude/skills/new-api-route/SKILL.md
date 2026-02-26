---
name: new-api-route
description: Scaffold a new Pages Router API route in src/pages/api/ with connectDB boilerplate, JSDoc, and standard error handling
---

Ask the user for:
1. **Route path** — relative to `src/pages/api/` (e.g. `dashboard/myRoute` or `pod/[id]`)
2. **HTTP methods** to support (GET, POST, PATCH, DELETE — pick the ones needed)
3. **Brief description** of what the route does
4. **Mongoose model(s)** it will use (e.g. Dashboard, Tile, Pod, User, Template)

Then create the file at `src/pages/api/{path}.js` using this template, filling in the placeholders:

```js
import connectDB from '@/lib/utils'
import ModelName from '@/models/modelName'

/**
 * @route METHOD /api/{path}
 * @desc {description}
 * @access Private / Public
 */
export default async function handler(req, res) {
  await connectDB()

  if (req.method === 'GET') {
    try {
      // TODO: implement GET
      res.status(200).json({})
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      // TODO: implement POST
      res.status(201).json({})
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
```

Rules to follow when generating the file:
- Only include method blocks for the HTTP methods the user requested
- Dynamic routes use `req.query` — remind the user the filename must be `[param].js`
- Width/height tile values are always stored as strings with `px` suffix (e.g. `"300px"`)
- Use `console.error` (not `console.log`) in catch blocks
- Import alias is `@/` which maps to `src/`
