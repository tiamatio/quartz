// Some of docs/ is not markdown: ATLAS.toml (the architecture on one page)
// and TERMS.toml (the names of the tree). A browser downloads a .toml
// instead of showing it, so a small page in content/ stands for each one:
//
//   ---
//   title: Atlas
//   embed: ATLAS.toml      # the file it shows, relative to content/
//   embed_as: atlas        # optional: "atlas" reads the atlas' parts
//   ---
//
// The page shows the file, and every link to the file opens the page.

import fs from "node:fs"
import path from "node:path"

/** embedded file (relative to content/) -> the page that shows it */
export function findEmbeds(contentDir) {
  const pages = new Map()
  let names = []
  try {
    names = fs.readdirSync(contentDir).filter((n) => n.endsWith(".md"))
  } catch {
    return pages
  }
  for (const name of names) {
    const head = fs.readFileSync(path.join(contentDir, name), "utf8").split(/\n---\s*\n/)[0]
    const m = head.match(/^embed:\s*(\S+)\s*$/m)
    if (m) pages.set(m[1], name)
  }
  return pages
}

const code = (lang, value) => ({ type: "code", lang, value })
const heading = (depth, value) => ({ type: "heading", depth, children: [{ type: "text", value }] })
// `code` in the atlas' prose becomes inline code; the rest stays text
const paragraph = (value) => ({
  type: "paragraph",
  children: value
    .split(/(`[^`]+`)/)
    .filter((part) => part !== "")
    .map((part) =>
      /^`[^`]+`$/.test(part)
        ? { type: "inlineCode", value: part.slice(1, -1) }
        : { type: "text", value: part },
    ),
})

function label(key) {
  const words = key.replace(/[-_]+/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * The atlas' parts: the TOML map (everything before [prose]), each
 * [prose] text as a section, and each [diagram] as a drawn mermaid block.
 * The texts are TOML literal strings: key = ''' ... '''.
 */
function atlasNodes(text) {
  const lines = text.split("\n")
  const proseAt = lines.findIndex((l) => /^\[prose\]\s*$/.test(l))
  const map = (proseAt < 0 ? lines : lines.slice(0, proseAt)).join("\n").trimEnd()
  const prose = []
  const diagrams = []
  let table = ""
  for (let i = proseAt < 0 ? lines.length : proseAt; i < lines.length; i++) {
    const header = lines[i].match(/^\[([^\]]+)\]\s*$/)
    if (header) {
      table = header[1]
      continue
    }
    const open = lines[i].match(/^([\w-]+)\s*=\s*'''\s*$/)
    if (!open) continue
    const end = lines.findIndex((l, j) => j > i && /^'''\s*$/.test(l))
    if (end < 0) break
    const body = lines.slice(i + 1, end).join("\n")
    if (table === "prose") prose.push([open[1], body])
    if (table === "diagram") diagrams.push([open[1], body])
    i = end
  }
  const nodes = []
  for (const [key, body] of prose) {
    nodes.push(heading(2, label(key)))
    for (const para of body.split(/\n\s*\n/)) {
      const flat = para.replace(/\s*\n\s*/g, " ").trim()
      if (flat) nodes.push(paragraph(flat))
    }
  }
  for (const [key, body] of diagrams) {
    nodes.push(heading(2, `Diagram: ${label(key).toLowerCase()}`), code("mermaid", body))
  }
  nodes.push(heading(2, "The map"), code("toml", map))
  return nodes
}

/** the nodes that show an embedded file, or a note when it cannot be read */
export function embedNodes(contentDir, file, as) {
  let text
  try {
    text = fs.readFileSync(path.join(contentDir, file), "utf8")
  } catch {
    return [paragraph(`${file} could not be read from this checkout.`)]
  }
  if (as === "atlas") return atlasNodes(text)
  const lang = path.extname(file).slice(1) || "text"
  return [code(lang, text.trimEnd())]
}
