# PROMAD Invoice Manager

## Start the app

```bash
cd invoicing-app
npm run dev
```

Then open → http://localhost:5173

This runs **both** the React frontend (Vite on port 5173) and the Express API server (port 3001) together.

---

## Invoice data

All invoices are stored in `data/invoices.json`. Includes the March 2026 invoice as seed data.

## Invoice number format

`MMYYNNNN` — e.g. `03260001` = first invoice of March 2026.
The next April invoice will auto-generate as `04260001`, and so on.

## Invoice types

- **Domestic** — IGST 18% is calculated and shown
- **Export** — No IGST; LUT # field appears instead
