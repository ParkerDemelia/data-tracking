import { ExpensesDashboard } from "@/components/expenses-dashboard"

export default function Page() {
  return (
    <main>
      <header>
        <h1>2026 expenses</h1>
        <p className="muted">every expense, logged by text to an AI agent, stored in Notion.</p>
      </header>
      <ExpensesDashboard />
    </main>
  )
}
