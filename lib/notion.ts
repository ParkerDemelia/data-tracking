import { Client } from "@notionhq/client"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { datasets, type DatasetConfig } from "@/datasets.config"

export type Row = { id: string } & Record<string, string | number | boolean | null>

export type DatasetResult = {
  rows: Row[]
  /** "notion" when live, "sample" when falling back to /data/*.json */
  source: "notion" | "sample"
}

/** Turn any Notion property into a plain value. Dates return their start (and `<field>End` is added separately). */
function readProperty(prop: any): string | number | boolean | null {
  if (!prop) return null
  switch (prop.type) {
    case "title":
    case "rich_text":
      return prop[prop.type].map((t: any) => t.plain_text).join("")
    case "number":
      return prop.number
    case "checkbox":
      return prop.checkbox
    case "select":
    case "status":
      return prop[prop.type]?.name ?? null
    case "multi_select":
      return prop.multi_select.map((s: any) => s.name).join(", ")
    case "date":
      return prop.date?.start ?? null
    case "url":
    case "email":
    case "phone_number":
      return prop[prop.type]
    case "formula":
      return prop.formula?.[prop.formula.type] ?? null
    case "created_time":
    case "last_edited_time":
      return prop[prop.type]
    default:
      return null
  }
}

async function fromNotion(cfg: DatasetConfig, dataSourceId: string): Promise<Row[]> {
  const notion = new Client({ auth: process.env.NOTION_API_KEY })
  const pages: any[] = []
  let cursor: string | undefined

  // Notion returns 100 rows max per call — keep paging until done.
  do {
    const res: any = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: cfg.sortBy ? [{ property: cfg.sortBy, direction: "descending" }] : undefined,
      start_cursor: cursor,
      page_size: 100,
    })
    pages.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)

  return pages.map((page) => {
    const row: Row = { id: page.id }
    for (const [field, notionName] of Object.entries(cfg.fields)) {
      const prop = page.properties[notionName]
      row[field] = readProperty(prop)
      if (prop?.type === "date" && prop.date?.end) row[`${field}End`] = prop.date.end
    }
    return row
  })
}

async function fromSample(cfg: DatasetConfig): Promise<Row[]> {
  const file = path.join(process.cwd(), "data", cfg.sample)
  return JSON.parse(await readFile(file, "utf8"))
}

export async function getDataset(key: string): Promise<DatasetResult | null> {
  const cfg = (datasets as Record<string, DatasetConfig>)[key]
  if (!cfg) return null

  const dataSourceId = process.env[cfg.dataSourceEnv]
  const live = Boolean(process.env.NOTION_API_KEY && dataSourceId)

  let rows = live ? await fromNotion(cfg, dataSourceId!) : await fromSample(cfg)

  if (cfg.requireAny?.length) {
    rows = rows.filter((r) => cfg.requireAny!.some((f) => r[f] !== null && r[f] !== undefined && r[f] !== ""))
  }

  return { rows, source: live ? "notion" : "sample" }
}
