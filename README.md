# ExpenseTracker — Backend

A REST API for tracking personal expenses, built with Node.js, Express, and the `fs` module for file-based storage — no database involved. Built as part of the TechnerLab Bootcamp (MERN Stack + AI Engineering) — Assignment 1.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Middleware](#middleware)
- [Bonus Features](#bonus-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

This backend exposes a full CRUD REST API for managing expenses. Instead of a database, all data is persisted to a local `expenses.json` file using Node's built-in `fs` module — filesystem access is isolated entirely to one utility file (`utils/fileHelper.js`), so the rest of the codebase never
touches `fs` directly.

The API follows an MVC-style structure: routes define endpoints, controllers hold the business logic, and custom middleware handles logging, validation, and centralized error handling.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Routing & middleware |
| `fs` (built-in) | Reading/writing `expenses.json` |
| `cors` | Allows the frontend (different port/origin) to call this API |
| `dotenv` | Loads `PORT` from `.env` |
| Nodemon (dev) | Auto-restarts the server on file changes |

---

## Project Structure

```text
expensetracker-backend/
├── server.js # Entry point — wires everything together
├── .env # PORT=3000 (not committed)
├── .gitignore
├── package.json
├── data/
│ └── expenses.json # Auto-created on the first POST request
├── routes/
│ └── expenseRoutes.js # Defines all /api/expenses endpoints
├── controllers/
│ └── expenseController.js # Business logic for every endpoint
├── middleware/
│ ├── logger.js # Logs method + URL + timestamp on every request
│ ├── validate.js # Factory middleware — checks required fields exist
│ └── errorHandler.js # 4-param error handler, registered last
└── utils/
└── fileHelper.js # The ONLY file that imports fs
```

---

## Setup & Installation

```bash
npm install
```

Create a `.env` file in the project root (see [Environment Variables](#environment-variables)).

Run in development mode (auto-restarts on save):
```bash
npm run dev
```

Run in production mode:
```bash
npm start
```

By default the server runs on **http://localhost:3000**. Confirm it's alive:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{ "status": "ok", "timestamp": "2026-07-31T10:00:00.000Z" }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Port the Express server listens on |

PORT=3000

> On Render/Railway, the platform injects its own `PORT` at runtime — the
> code already falls back correctly via `process.env.PORT \|\| 3000`.

---

## API Reference

Base path: `/api/expenses`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/expenses` | Get all expenses — supports filters (below) |
| GET | `/api/expenses/stats` | Spending summary |
| GET | `/api/expenses/export` | Download all expenses as `.csv` |
| GET | `/api/expenses/:id` | Get one expense by ID |
| POST | `/api/expenses` | Create a new expense |
| PUT | `/api/expenses/:id` | Update an expense (partial update) |
| DELETE | `/api/expenses/:id` | Delete an expense |

> ⚠️ `/stats` and `/export` are registered **before** `/:id` in the router —
> otherwise Express would treat `"stats"` or `"export"` as an `:id` value
> and the routes would never be reached.

### Query Filters — `GET /api/expenses`

| Param | Type | Description |
|---|---|---|
| `category` | string | `food` \| `transport` \| `shopping` \| `utilities` \| `health` \| `other` |
| `search` | string | Case-insensitive match on title |
| `minAmount` | number | Only expenses ≥ this amount |
| `maxAmount` | number | Only expenses ≤ this amount |

Filters are combinable, e.g.:

GET /api/expenses?category=food&minAmount=500&maxAmount=5000

### Example Requests

**Create**
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Grocery shopping","amount":2500,"category":"food"}'
```

**Update (partial)**
```bash
curl -X PUT http://localhost:3000/api/expenses/1719999999999 \
  -H "Content-Type: application/json" \
  -d '{"amount":3000}'
```

**Delete**
```bash
curl -X DELETE http://localhost:3000/api/expenses/1719999999999
```

### Response Shape

Success:
```json
{ "success": true, "data": { ... } }
```

List (with count):
```json
{ "success": true, "count": 5, "data": [ ... ] }
```

Error:
```json
{ "success": false, "message": "Expense not found" }
```

---

## Data Model

```json
{
  "id": 1719999999999,
  "title": "Grocery shopping",
  "amount": 2500,
  "category": "food",
  "date": "2026-07-31",
  "description": "Weekly groceries from Packages Mall",
  "createdAt": "2026-07-31T10:00:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | number | `Date.now()` at creation time — doubles as the unique identifier |
| `title` | string | Required |
| `amount` | number | Required |
| `category` | string | Required — must be one of the 6 valid categories |
| `date` | string | Optional — defaults to today (`YYYY-MM-DD`) |
| `description` | string | Optional — defaults to `""` |
| `createdAt` | string | ISO timestamp — set once, never modified by `PUT` |

`PUT` requests are merged with the existing record using the spread
operator, so only the fields sent in the request body are changed —
`id` and `createdAt` are explicitly stripped out before merging to
prevent them from ever being overwritten.

---

## Middleware

| File | Role |
|---|---|
| `logger.js` | Logs every request as `[timestamp] METHOD /url` |
| `validate.js` | A middleware **factory** — `validate('title', 'amount', 'category')` returns a middleware that 400s if any of those fields are missing from `req.body` |
| `errorHandler.js` | Has exactly 4 parameters `(err, req, res, next)` — this is how Express identifies it as an error handler. Registered last in `server.js`, after all routes |

---

## Bonus Features

| Feature | Implementation |
|---|---|
| **CSV Export** | `GET /api/expenses/export` builds a CSV string manually (headers + rows, with description values escaped/quoted) and streams it with `Content-Disposition: attachment` — no external CSV library used |

---

## Deployment

Deployed as a Node web service. Build/start configuration:

| Setting | Value |
|---|---|
| Build command | `npm install` |
| Start command | `node server.js` |
| Environment variable | `PORT` (platform-provided at runtime) |
| Instance type | Free |

**Live URL:** `[add once deployment is finalized]`

> Free-tier instances typically sleep after a period of inactivity — the
> first request afterward may take 10–30 seconds while the server wakes up.

CORS is configured in `server.js` via an `allowedOrigins` array covering
common local Vite ports (`5173`, `5174`). If the frontend is ever deployed,
its production URL needs to be added there.

---

## Troubleshooting

**CORS errors in the browser console**
Check the exact port your frontend is running on (shown in the Vite
terminal output) and make sure it's included in `allowedOrigins` in
`server.js`. Restart the backend after any change to `server.js`.

**`expenses.json` not appearing in `data/`**
The file is only created on the **first successful POST** — an empty
`GET /api/expenses` before that will correctly return `[]` without creating
the file.

**"Missing required fields" on POST**
`title`, `amount`, and `category` are all required — check `validate.js`'s
error message for exactly which fields are missing.