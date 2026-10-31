// plev-book: reads plev's docs/ as a book. One transformer, run after the
// frontmatter is parsed and before links are crawled, so every later plugin
// (explorer, breadcrumbs, search, graph, backlinks, table of contents) sees
// the same titles, slugs and links.
//
//   README.md        -> the page of its folder (slug and links)
//   title, headings  -> sentence case with known spellings (display only);
//                       a section page takes the section's name
//   running text     -> blocks and sentences start with a capital (display only)
//   repeated "# title" at the top -> dropped, the page title already shows it
//   topics           -> tags
//   relations        -> a "Related" list of links (graph and backlinks follow)
//   date / revised   -> created / modified (recorded when date is null)
//   a link out of docs/ -> the file on the forge (option repo: the blob base URL)
//   embed: FILE      -> the page shows FILE (ATLAS.toml, TERMS.toml); links to FILE open it

import { loadCatalog } from "./catalog.js"
import { embedNodes, findEmbeds } from "./embed.js"
import { capitalizeFirst, pageTitle, readable, sameText, sentenceStarts } from "./casing.js"
import { linkBetween, outsideLink, readmeLink, readmeSlug, targetPath } from "./links.js"
import { sectionTitle } from "./sections.js"

function textOf(node) {
  if (!node) return ""
  if (typeof node.value === "string") return node.value
  return (node.children ?? []).map(textOf).join("")
}

function walk(node, visit) {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

function asDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined
    // a YAML date (2026-10-09) arrives as UTC midnight: keep the same calendar day
    return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12)
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(value)) return undefined
  // a bare date is a calendar day: read at local noon, so no time zone moves it a day back
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function setDates(data, fm) {
  const created = asDate(fm.date) ?? asDate(fm.recorded)
  const modified = asDate(fm.revised) ?? created
  if (!created && !modified) return
  data.dates = { ...(data.dates ?? {}) }
  if (created) data.dates.created = data.dates.published = created
  if (modified) data.dates.modified = modified
}

function dropRepeatedTitle(tree, original) {
  const first = tree.children.findIndex((n) => n.type !== "yaml" && n.type !== "toml")
  const node = tree.children[first]
  if (node?.type === "heading" && node.depth === 1 && sameText(textOf(node), original)) {
    tree.children.splice(first, 1)
  }
}

// running text starts its blocks and its sentences with a capital; code,
// links' targets and names spelled in lowercase on purpose stay as written
const BLOCKS = new Set(["paragraph", "tableCell"])

function caseText(tree) {
  walk(tree, (node) => {
    if (node.type === "code" || node.type === "inlineCode" || node.type === "html") return
    if (node.type === "text") node.value = sentenceStarts(node.value)
    if (BLOCKS.has(node.type) && node.children?.[0]?.type === "text") {
      node.children[0].value = capitalizeFirst(node.children[0].value)
    }
  })
}

function caseHeadings(tree) {
  walk(tree, (node) => {
    if (node.type !== "heading") return
    const lead = node.children?.[0]
    if (lead?.type === "text") lead.value = readable(lead.value)
  })
}

/** the title a catalog page shows: its section name, or its readable title */
function shownTitle(entry) {
  const slug = readmeSlug(entry.path.replace(/\.md$/, "").toLowerCase())
  return (
    sectionTitle(slug) ?? pageTitle(entry.title ?? entry.id, { id: entry.id, type: entry.type })
  )
}

// a link whose text is the title of the page it opens shows that title the
// way the page shows it; README links open their folder
function rewriteLinks(tree, here, byPath, embeds, repo) {
  walk(tree, (node) => {
    if (node.type !== "link" && node.type !== "definition") return
    if (typeof here === "string") {
      const away = outsideLink(here, node.url, repo)
      if (away !== node.url) {
        node.url = away
        return
      }
    }
    const shown = typeof here === "string" && embeds.get(targetPath(here, node.url))
    if (shown && shown !== here) {
      const hash = node.url.indexOf("#")
      node.url = linkBetween(here, shown) + (hash < 0 ? "" : node.url.slice(hash))
      return
    }
    if (node.type === "link" && typeof here === "string" && node.children?.length === 1) {
      const label = node.children[0]
      const target = byPath.get(targetPath(here, node.url))
      if (label.type === "text" && target && sameText(label.value, target.title)) {
        label.value = shownTitle(target)
      }
    }
    node.url = readmeLink(node.url)
  })
}

function relatedSection(relations, here, selfId, byId) {
  const items = []
  const seen = new Set()
  for (const id of relations) {
    const target = byId.get(id)
    if (!target || id === selfId || seen.has(id) || target.path === here) continue
    seen.add(id)
    const url = readmeLink(linkBetween(here, target.path))
    const text = shownTitle(target)
    items.push({
      type: "listItem",
      spread: false,
      children: [
        {
          type: "paragraph",
          children: [{ type: "link", url, children: [{ type: "text", value: text }] }],
        },
      ],
    })
  }
  if (items.length === 0) return []
  return [
    { type: "heading", depth: 2, children: [{ type: "text", value: "Related" }] },
    { type: "list", ordered: false, spread: false, children: items },
  ]
}

export default function PlevBook(opts) {
  return {
    name: "PlevBook",
    markdownPlugins(ctx) {
      const contentDir = ctx?.argv?.directory ?? "content"
      const catalog = loadCatalog(contentDir)
      const embeds = findEmbeds(contentDir)
      if (Array.isArray(ctx?.allSlugs)) {
        for (let i = 0; i < ctx.allSlugs.length; i++) ctx.allSlugs[i] = readmeSlug(ctx.allSlugs[i])
      }
      return [
        () => (tree, file) => {
          const data = file.data
          data.slug = readmeSlug(data.slug)
          const fm = data.frontmatter ?? {}
          const original = fm.title
          if (typeof original === "string") {
            fm.title = sectionTitle(data.slug) ?? pageTitle(original, { id: fm.id, type: fm.type })
            dropRepeatedTitle(tree, original)
          }
          if (Array.isArray(fm.topics) && fm.topics.length > 0 && !fm.tags) fm.tags = [...fm.topics]
          setDates(data, fm)
          caseHeadings(tree)
          caseText(tree)
          const here = data.relativePath
          rewriteLinks(tree, here, catalog.byPath, embeds, opts?.repo)
          if (typeof fm.embed === "string")
            tree.children.push(...embedNodes(contentDir, fm.embed, fm.embed_as))
          if (Array.isArray(fm.relations) && fm.type !== "index" && typeof here === "string") {
            tree.children.push(...relatedSection(fm.relations, here, fm.id, catalog.byId))
          }
          data.frontmatter = fm
        },
      ]
    },
  }
}
