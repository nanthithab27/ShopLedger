# Repository Guidelines

## Stack

Node.js with CommonJS, Express 4, and `body-parser` for JSON requests. The browser UI uses HTML, CSS, and vanilla JavaScript in `public/`. `server.js` serves the UI and printable invoices, mounts the API under `/api`, and uses settings from `config.js`. Persistence uses `data/db.json`.

## Module map

- `routes/customers.js` — Lists customers and recent settlements and records Khata payments.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists products and active coupons.
- `routes/reports.js` — Serves the dashboard, GST reconciliation, pricing preview, and keyed database export.
- `lib/coupons.js` — Normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` — Formats and normalizes dates and computes fiscal-year labels.
- `lib/inventory.js` — Finds products, checks sellable stock, handles reservations, and summarizes inventory.
- `lib/invoice.js` — Recalculates invoice figures from order lines and renders printable HTML.
- `lib/ledger.js` — Computes Khata balances, applies and reverses order debits, and records settlements.
- `lib/orders.js` — Adds, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Computes checkout subtotal, proportional coupon discounts, line GST, and totals.
- `lib/reports.js` — Builds dashboard summaries and compares invoice figures with saved order totals.
- `lib/store.js` — Reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` — Resolves GST rates and splits tax into CGST and SGST.

## Commands

- `npm start` — Runs `node server.js` on `PORT` or port 3000 by default.
- `node --test` — Runs tests with Node's built-in test runner. The `npm test` script currently exits with an error.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the modules the ticket covers.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Modify only `lib/invoice.js`. Modify `lib/tax.js` only if truly needed.
