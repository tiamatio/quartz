// A folder's note is the page of that folder: the page named like the
// folder ("Tasks/task-98/task-98.md", "adr/adr.md"), or a README.md (the
// home, docs/README.md). Its slug becomes <folder>/index and every link to it
// points at the folder, so "Tasks/task-98/task-98.md" opens as "Tasks/task-98/".

import path from "node:path"

const README = /^readme\.md$/i

/** a docs path (with or without .md) whose file is its folder's note */
export function isNote(p) {
  if (typeof p !== "string") return false
  const parts = p.replace(/\.md$/i, "").split("/")
  const name = parts[parts.length - 1]
  return /^readme$/i.test(name) || (parts.length >= 2 && name === parts[parts.length - 2])
}

/** "a/b/b" -> "a/b/index", "a/b/readme" -> "a/b/index", "readme" -> "index" */
export function readmeSlug(slug) {
  if (typeof slug !== "string" || !isNote(slug)) return slug
  return slug.replace(/[^/]+$/, "index")
}

function isRelative(url) {
  return (
    typeof url === "string" &&
    url.length > 0 &&
    !url.startsWith("#") &&
    !url.startsWith("/") &&
    !/^[a-z][a-z0-9+.-]*:/i.test(url)
  )
}

/**
 * "../x/x.md#a" -> "../x/#a", "../x/README.md" -> "../x/"; `here`, the docs
 * path of the page the link is on, tells a sibling note ("x.md" inside x/)
 * from a page; links elsewhere are returned as they are
 */
export function readmeLink(url, here) {
  if (!isRelative(url)) return url
  const hash = url.indexOf("#")
  const target = hash < 0 ? url : url.slice(0, hash)
  const anchor = hash < 0 ? "" : url.slice(hash)
  const slash = target.lastIndexOf("/")
  const base = target.slice(slash + 1)
  const resolved = typeof here === "string" ? targetPath(here, target) : target
  if (!README.test(base) && !(/\.md$/i.test(base) && isNote(resolved))) return url
  const dir = target.slice(0, slash + 1)
  return (dir === "" ? "./" : dir) + anchor
}

/** the relative link from one docs page to another, both paths under docs/ */
export function linkBetween(fromPath, toPath) {
  const rel = path.posix.relative(path.posix.dirname(fromPath), toPath)
  return rel.startsWith(".") ? rel : `./${rel}`
}

/** the docs path a relative link points at ("../x/" -> "x/README.md"), or undefined */
export function targetPath(fromPath, url) {
  if (!isRelative(url)) return undefined
  const target = url.split("#")[0]
  if (target === "") return undefined
  let p = path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), target))
  // a folder opens its note: the home's README, any other folder's page named like it
  if (target.endsWith("/") || p === ".")
    p = p === "." ? "README.md" : path.posix.join(p, `${path.posix.basename(p)}.md`)
  return p.startsWith("..") ? undefined : p
}

/**
 * A link that leaves docs/ ("../../tool/bench/x.png" from docs/experiments/a/)
 * points at a file of the repository the site does not serve: it opens that
 * file on the forge instead. `repo` is the blob base, e.g.
 * "https://github.com/owner/plev/blob/main"; without it the link is kept.
 */
export function outsideLink(fromPath, url, repo) {
  if (!repo || !isRelative(url)) return url
  const hash = url.indexOf("#")
  const target = hash < 0 ? url : url.slice(0, hash)
  const inDocs = path.posix.normalize(path.posix.join("docs", path.posix.dirname(fromPath), target))
  if (inDocs.startsWith("docs/") || inDocs === "docs" || inDocs.startsWith("..")) return url
  return `${repo.replace(/\/+$/, "")}/${inDocs}${hash < 0 ? "" : url.slice(hash)}`
}
