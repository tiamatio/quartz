// docs/CATALOG.json is the index docbase.py keeps: one entry per page, with
// its id, path, type and the ids it relates to. The book reads it once per
// build to turn a relation id into a link to that page.

import fs from "node:fs"
import path from "node:path"

/**
 * { byId: id -> entry, byPath: path -> entry }, entry = { id, path (relative
 * to docs/), title, type }; both empty when the catalog is absent
 */
export function loadCatalog(contentDir) {
  const file = path.join(contentDir, "CATALOG.json")
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"))
  } catch {
    return { byId: new Map(), byPath: new Map() }
  }
  const byId = new Map()
  const byPath = new Map()
  for (const doc of parsed.documents ?? []) {
    if (!doc?.id || !doc?.path) continue
    const entry = {
      id: doc.id,
      path: doc.path.replace(/^docs\//, ""),
      title: doc.title,
      type: doc.type,
    }
    byId.set(doc.id, entry)
    byPath.set(entry.path, entry)
  }
  return { byId, byPath }
}
