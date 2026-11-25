// ─────────────────────────────────────────────────────────────────────────────
// datasets.config.ts — the ONE file you edit to add a new tracker.
//
// Each dataset = one Notion database. You list:
//   • which env var holds its Notion data source ID
//   • which Notion column feeds each field the dashboard reads
//   • a sample JSON file to show when Notion isn't configured
//
// Every dataset is served at /api/data/<key> as { rows: [...] }.
// ─────────────────────────────────────────────────────────────────────────────

export type DatasetConfig = {
  /** env var holding the Notion *data source* ID (see README → "Find the IDs") */
  dataSourceEnv: string
  /** dashboard field name → exact Notion property (column) name */
  fields: Record<string, string>
  /** Notion property to sort by, newest first (optional) */
  sortBy?: string
  /** drop rows where all of these fields are empty (keeps half-filled rows out) */
  requireAny?: string[]
  /** file in /data shown when Notion env vars are missing */
  sample: string
}

export const datasets = {
  expenses: {
    dataSourceEnv: "NOTION_EXPENSES_DATA_SOURCE_ID",
    fields: {
      title: "Expense",
      amount: "Amount (USD)",
      earned: "Earned",
      date: "Date",
      category: "Category",
      location: "Location",
      notes: "Notes",
    },
    sortBy: "Date",
    requireAny: ["amount", "earned"],
    sample: "expenses.sample.json",
  },

  // Add your own, e.g. a habit tracker:
  // habits: {
  //   dataSourceEnv: "NOTION_HABITS_DATA_SOURCE_ID",
  //   fields: { title: "Name", date: "Date", done: "Done", minutes: "Minutes" },
  //   sortBy: "Date",
  //   sample: "habits.sample.json",
  // },
} satisfies Record<string, DatasetConfig>

export type DatasetKey = keyof typeof datasets
