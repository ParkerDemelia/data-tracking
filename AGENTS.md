# AGENTS.md — building a dashboard with this method

You are helping someone turn a Notion database into a live dashboard. This repo is the reference. Follow the method below whether you extend this repo or recreate it in another stack.

## The method (stack-agnostic)

1. **Notion is the database.** Rows are added by a person or an AI agent (for example Poke with the Notion integration). Never require a custom write API.
2. **One server-side read path.** A server route reads Notion with a secret key and returns **flat JSON rows**. The key never reaches the browser.
3. **Map columns once.** The Notion column names live in a single config ([`datasets.config.ts`](datasets.config.ts)). UI code only sees friendly field names (`amount`, `date`, …).
4. **Always have sample data.** If the env vars are missing, serve `data/<name>.sample.json` and show a banner. The app must run right after cloning.
5. **The UI derives everything.** Totals, group-bys and per-day rates are computed client-side from the rows. Notion stays a dumb table.
6. **Cache lightly.** Use `s-maxage=60`. Notion allows about 3 requests/sec per integration.

## Data contract

`GET /api/data/<dataset>` →

```json
{
  "source": "notion" | "sample",
  "rows": [
    { "id": "…", "title": "Tacos", "amount": 14.5, "earned": null, "date": "2026-03-02",
      "category": "Food & Drink", "location": "Mexico", "notes": "" }
  ]
}
```

- Every row has `id` plus one key per entry in that dataset's `fields`.
- Values are `string | number | boolean | null`. Dates are ISO `YYYY-MM-DD` (date ranges also add `<field>End`).
- Selects come back as their name, multi-selects as a comma-joined string, checkboxes as booleans.

## Adding a dataset (checklist)

1. Ask the user for the Notion column names and types. Don't guess.
2. Add an entry to `datasets.config.ts` (`dataSourceEnv`, `fields`, `sortBy`, `requireAny`, `sample`).
3. Add the env var to `.env.example` with a comment.
4. Write a realistic but **fake** `data/<name>.sample.json` with 50+ rows. Never commit real personal data.
5. Build `components/<name>-dashboard.tsx` as a client component that fetches `/api/data/<name>` and handles the loading, error and `source === "sample"` states.
6. Run `pnpm build`. It must pass with no env vars set.

## Gotchas

- `@notionhq/client` v5 queries **data sources** (`notion.dataSources.query({ data_source_id })`), not databases. The ID comes from *Manage data sources → Copy data source ID*, not from the database URL.
- The integration must be added to the database (`••• → Connections`), or every query returns 404.
- Results are paginated at 100 rows, so always loop on `next_cursor`.
- Number columns can be `null`. Treat them as 0 when summing, and filter out empty rows with `requireAny`.
- Keep `outputFileTracingIncludes` in `next.config.mjs` so `/data` ships with the serverless function on Vercel.

## Style of the reference dashboard

- System fonts and monospace tabular numbers for money.
- Light and dark mode via CSS variables in `app/globals.css`.
- Charts are hand-written SVG (see `components/donut.tsx`). Add a chart library only if the user asks.
- Usable at 360px wide with no horizontal scroll.
