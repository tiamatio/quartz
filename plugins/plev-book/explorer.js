// The sidebar of the plev book. The explorer serializes these functions with
// toString() and runs them in the browser, so each one must stand alone: no
// imports, no names from outside its own body.

export const plevExplorer = {
  // the book's reading order at the top level, then folders before pages;
  // blog posts newest first (their file names start with the date)
  sortFn: (a, b) => {
    const rank = {
      changelog: 0,
      blog: 1,
      adr: 2,
      tasks: 3,
      experiments: 4,
      learnings: 5,
      research: 6,
      ref: 7,
      atlas: 8,
      terms: 9,
    }
    if (a.slugSegments.length === 1 && b.slugSegments.length === 1) {
      const ra = rank[a.slugSegment] ?? 99
      const rb = rank[b.slugSegment] ?? 99
      if (ra !== rb) return ra - rb
    }
    if (
      a.slugSegments[0] === "blog" &&
      b.slugSegments[0] === "blog" &&
      !a.isFolder &&
      !b.isFolder
    ) {
      return b.slugSegment.localeCompare(a.slugSegment)
    }
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
    return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
      numeric: true,
      sensitivity: "base",
    })
  },
  // the tag pages and the ADR template are not part of the reading path
  filterFn: (node) => node.slugSegment !== "tags" && node.data?.slug !== "adr/template",
  // the sections keep short names; a folder without its own page (an ADR
  // theme) shows its name with a capital
  mapFn: (node) => {
    const label = {
      changelog: "Changelog",
      blog: "Blog",
      adr: "Decisions",
      tasks: "Tasks",
      experiments: "Experiments",
      learnings: "Learnings",
      research: "Research",
      ref: "Reference",
    }
    if (node.slugSegments.length === 1 && label[node.slugSegment]) {
      node.displayName = label[node.slugSegment]
      return
    }
    const name = node.displayName || ""
    if (node.isFolder && name && name[0] !== name[0].toUpperCase()) {
      node.displayName = name[0].toUpperCase() + name.slice(1)
    }
  },
}
