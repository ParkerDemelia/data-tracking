// Generates data/expenses.sample.json — fake, seeded (same output every run).
// Run: pnpm sample
import { writeFile } from "node:fs/promises"

let seed = 42
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const money = (min, max) => Math.round((min + rand() * (max - min)) * 100) / 100

// A made-up 4-month trip.
const legs = [
  { location: "Mexico", start: "2026-01-05", days: 30, cost: 1.0 },
  { location: "Guatemala", start: "2026-02-04", days: 24, cost: 0.7 },
  { location: "Costa Rica", start: "2026-02-28", days: 18, cost: 1.3 },
  { location: "Colombia", start: "2026-03-18", days: 34, cost: 0.85 },
]

const categories = {
  "Food & Drink": { items: ["Tacos", "Groceries", "Coffee", "Street food", "Dinner out", "Smoothie"], range: [3, 28], perDay: 1.4 },
  Transport: { items: ["Bus ticket", "Taxi", "Ferry", "Shuttle", "Scooter rental"], range: [2, 45], perDay: 0.45 },
  Lodging: { items: ["Hostel", "Guesthouse", "Airbnb"], range: [12, 55], perDay: 0.55 },
  Activities: { items: ["Surf lesson", "Volcano hike", "Museum", "Spanish class", "Dive trip"], range: [10, 90], perDay: 0.18 },
  Shopping: { items: ["Sunscreen", "SIM card", "Market souvenir", "Pharmacy"], range: [4, 35], perDay: 0.15 },
  Subscriptions: { items: ["Phone plan", "Cloud storage", "Streaming"], range: [5, 20], perDay: 0.04 },
}

const rows = []
let n = 0
for (const leg of legs) {
  const start = new Date(leg.start + "T00:00:00Z")
  for (let d = 0; d < leg.days; d++) {
    const date = new Date(start.getTime() + d * 86400000).toISOString().slice(0, 10)
    for (const [category, c] of Object.entries(categories)) {
      let count = Math.floor(c.perDay) + (rand() < c.perDay % 1 ? 1 : 0)
      while (count-- > 0) {
        rows.push({
          id: `sample-${++n}`,
          title: pick(c.items),
          amount: money(c.range[0] * leg.cost, c.range[1] * leg.cost),
          earned: null,
          date,
          category,
          location: leg.location,
          notes: "",
        })
      }
    }
  }
}

// A few income rows so the "earned" side of the dashboard has something.
for (const [date, title, earned] of [
  ["2026-01-31", "Freelance invoice", 1850],
  ["2026-02-28", "Freelance invoice", 1600],
  ["2026-03-15", "Photo print sale", 240],
  ["2026-03-31", "Freelance invoice", 1900],
]) {
  rows.push({ id: `sample-${++n}`, title, amount: null, earned, date, category: "Income", location: "Remote", notes: "" })
}

rows.sort((a, b) => b.date.localeCompare(a.date))
await writeFile(new URL("../data/expenses.sample.json", import.meta.url), JSON.stringify(rows, null, 2) + "\n")
console.log(`wrote ${rows.length} sample rows`)
