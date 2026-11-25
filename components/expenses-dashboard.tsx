"use client"

import { useEffect, useMemo, useState } from "react"
import type { Row } from "@/lib/notion"
import { Donut } from "./donut"

export const COLORS = [
  "oklch(0.75 0.14 195)",
  "oklch(0.70 0.15 250)",
  "oklch(0.72 0.16 150)",
  "oklch(0.68 0.14 310)",
  "oklch(0.76 0.13 80)",
  "oklch(0.66 0.15 30)",
  "oklch(0.62 0.10 200)",
  "oklch(0.58 0.09 270)",
]

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const day = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
const num = (v: unknown) => (typeof v === "number" ? v : 0)

function sumBy(rows: Row[], key: string) {
  const out: Record<string, number> = {}
  for (const r of rows) {
    if (!num(r.amount)) continue
    const k = (r[key] as string) || "Unknown"
    out[k] = (out[k] ?? 0) + num(r.amount)
  }
  return Object.entries(out).sort((a, b) => b[1] - a[1])
}

export function ExpensesDashboard() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [source, setSource] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/data/expenses")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        setRows(d.rows)
        setSource(d.source)
      })
      .catch((e) => setError(e.message))
  }, [])

  const stats = useMemo(() => {
    if (!rows) return null
    const dates = rows.map((r) => r.date as string).filter(Boolean).sort()
    const spent = rows.reduce((s, r) => s + num(r.amount), 0)
    const earned = rows.reduce((s, r) => s + num(r.earned), 0)

    // days spent in each location → $/day
    const daysAt: Record<string, Set<string>> = {}
    for (const r of rows) {
      if (!num(r.amount) || !r.date) continue
      const loc = (r.location as string) || "Unknown"
      ;(daysAt[loc] ??= new Set()).add(r.date as string)
    }

    return {
      spent,
      earned,
      net: earned - spent,
      first: dates[0],
      last: dates[dates.length - 1],
      byLocation: sumBy(rows, "location").map(([k, v]) => [k, v, v / (daysAt[k]?.size || 1)] as const),
      byCategory: sumBy(rows, "category"),
    }
  }, [rows])

  const recent = useMemo(
    () => (rows ?? []).filter((r) => num(r.amount) && (!activeCategory || r.category === activeCategory)).slice(0, 8),
    [rows, activeCategory],
  )

  if (error) return <p className="muted">Couldn’t load data: {error}</p>
  if (!stats) return <p className="muted">Loading…</p>

  const colorOf = (cat: string) => COLORS[stats.byCategory.findIndex(([c]) => c === cat) % COLORS.length]

  return (
    <div className="stack">
      {source === "sample" && (
        <p className="banner">
          Showing <strong>sample data</strong>. Add your Notion keys to <code>.env.local</code> to see your own.
        </p>
      )}

      <section className="card">
        <div className="totals">
          <Stat label="Spent" value={`−${usd(stats.spent)}`} />
          <Stat label="Earned" value={`+${usd(stats.earned)}`} tone="pos" />
          <Stat label="Net" value={`${stats.net >= 0 ? "+" : "−"}${usd(Math.abs(stats.net))}`} tone={stats.net >= 0 ? "pos" : "neg"} />
          {stats.first && <span className="range">{day(stats.first)} — {day(stats.last)}</span>}
        </div>

        <div className="split">
          <div className="bars">
            {stats.byLocation.map(([loc, amt, perDay]) => (
              <div key={loc} className="bar-row">
                <span className="bar-label">{loc}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(amt / stats.spent) * 100}%` }} />
                </div>
                <span className="mono">{usd(amt)}</span>
                <span className="mono muted small">${Math.round(perDay)}/day</span>
              </div>
            ))}
          </div>

          <div className="donut-wrap">
            <Donut
              data={stats.byCategory}
              colors={COLORS}
              active={activeCategory}
              onSelect={(c) => setActiveCategory((cur) => (cur === c ? null : c))}
            />
            <ul className="legend">
              {stats.byCategory.map(([cat, amt]) => (
                <li key={cat}>
                  <button
                    className={activeCategory && activeCategory !== cat ? "dim" : ""}
                    onClick={() => setActiveCategory((cur) => (cur === cat ? null : cat))}
                  >
                    <span className="dot" style={{ background: colorOf(cat) }} />
                    <span className="muted">{cat}</span>
                    <span className="mono">{usd(amt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>
          Recent {activeCategory ? <span className="muted">· {activeCategory}</span> : null}
        </h2>
        <table>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}>
                <td className="muted small">{r.date ? day(r.date as string) : "—"}</td>
                <td>{r.title}</td>
                <td className="muted small">{r.location}</td>
                <td className="mono right">{usd(num(r.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value mono ${tone ?? ""}`}>{value}</span>
    </div>
  )
}
