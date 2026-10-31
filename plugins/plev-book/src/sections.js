// The book's top-level sections: folder -> the name a reader navigates by.
// The section page (the folder's README) shows this name too, so the
// sidebar, the breadcrumbs and the page agree. explorer.js keeps the same
// table inside its functions, which run in the browser and cannot import.
export const SECTIONS = {
  changelog: "Changelog",
  blog: "Blog",
  adr: "Decisions",
  tasks: "Tasks",
  experiments: "Experiments",
  learnings: "Learnings",
  research: "Research",
  ref: "Reference",
}

/** "adr/index" -> "Decisions"; any other slug -> undefined */
export function sectionTitle(slug) {
  const m = typeof slug === "string" && slug.match(/^([^/]+)\/index$/)
  return m ? SECTIONS[m[1]] : undefined
}
