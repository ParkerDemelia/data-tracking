import { getDataset } from "@/lib/notion"

// Never statically cache — new Notion rows should show up after deploy.
export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await params
  try {
    const result = await getDataset(dataset)
    if (!result) return Response.json({ error: `Unknown dataset "${dataset}"` }, { status: 404 })

    return Response.json(result, {
      // CDN cache for 60s so a busy page doesn't hammer Notion's rate limit (~3 req/s).
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  } catch (err) {
    console.error(`Failed to load dataset "${dataset}":`, err)
    return Response.json({ error: "Failed to load data" }, { status: 500 })
  }
}
