// A folder's README.md is the page of that folder: its slug becomes
// <folder>/index and every link to a README.md points at the folder, so
// "tasks/task-98/README.md" opens as "tasks/task-98/".

import path from "node:path"

const README = /^readme\.md$/i

/** "a/b/readme" -> "a/b/index", "readme" -> "index" */
export function readmeSlug(slug) {
  if (typeof slug !== "string") return slug
  return slug.replace(/(^|\/)readme$/i, "$1index")
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

/** "../x/README.md#a" -> "../x/#a" ; links elsewhere are returned as they are */
export function readmeLink(url) {
  if (!isRelative(url)) return url
  const hash = url.indexOf("#")
  const target = hash < 0 ? url : url.slice(0, hash)
  const anchor = hash < 0 ? "" : url.slice(hash)
  const slash = target.lastIndexOf("/")
  const base = target.slice(slash + 1)
  if (!README.test(base)) return url
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
  if (target.endsWith("/") || p === ".") p = path.posix.join(p, "README.md")
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
