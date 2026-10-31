// Display casing for plev's docs. The source keeps its lowercase titles and
// headings (the author's style); the site shows them in sentence case, with
// acronyms and product names spelled the usual way. Only the rendered text
// changes: ids, slugs and links stay as the docs wrote them.

/** lowercase word -> how a reader expects to see it */
const SPELLING = {
  adr: "ADR",
  adrs: "ADRs",
  ai: "AI",
  api: "API",
  apis: "APIs",
  ci: "CI",
  cli: "CLI",
  css: "CSS",
  dsl: "DSL",
  ffmpeg: "FFmpeg",
  gpu: "GPU",
  gpus: "GPUs",
  gui: "GUI",
  hidpi: "HiDPI",
  html: "HTML",
  ide: "IDE",
  ios: "iOS",
  ir: "IR",
  json: "JSON",
  llm: "LLM",
  llms: "LLMs",
  lsp: "LSP",
  mcp: "MCP",
  mvp: "MVP",
  poc: "POC",
  pr: "PR",
  prs: "PRs",
  rss: "RSS",
  sdk: "SDK",
  simd: "SIMD",
  srgb: "sRGB",
  srp: "SRP",
  svg: "SVG",
  toml: "TOML",
  tui: "TUI",
  ui: "UI",
  url: "URL",
  ux: "UX",
  wasm: "Wasm",
  webgpu: "WebGPU",
  yaml: "YAML",
  android: "Android",
  rust: "Rust",
  github: "GitHub",
  lottie: "Lottie",
  makepad: "Makepad",
  helix: "Helix",
  tailwind: "Tailwind",
  noto: "Noto",
  linebender: "Linebender",
  macos: "macOS",
  windows: "Windows",
  linux: "Linux",
  claude: "Claude",
}

/** a token that is code or a name the docs spell in lowercase on purpose */
function isCode(word) {
  return /^plev/.test(word) || /_|::|\.rs$|^`|^\w+!\(/.test(word)
}

function spell(word) {
  const m = word.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}][\p{L}\p{N}'-]*?)([^\p{L}\p{N}]*)$/u)
  if (!m) return word
  const [, pre, core, post] = m
  if (isCode(core) || core !== core.toLowerCase()) return word
  const whole = SPELLING[core]
  if (whole) return pre + whole + post
  if (!core.includes("-")) return word
  const parts = core.split("-").map((p) => SPELLING[p] ?? p)
  return pre + parts.join("-") + post
}

export function capitalizeFirst(text) {
  const m = text.match(/^([^\p{L}]*)(\S+)/u)
  if (!m) return text
  const word = m[2]
  if (isCode(word) || word !== word.toLowerCase()) return text
  const i = m[1].length
  return text.slice(0, i) + text[i].toLocaleUpperCase() + text.slice(i + 1)
}

/** sentence case with known spellings; after ": " a new clause starts */
export function readable(text) {
  if (typeof text !== "string" || text.length === 0) return text
  const spelled = text
    .split(/(\s+|\/)/)
    .map((t) => (/^\s+$|^\/$/.test(t) ? t : spell(t)))
    .join("")
  return spelled
    .split(/(:\s+)/)
    .map((part, i) => (i % 2 === 0 ? capitalizeFirst(part) : part))
    .join("")
}

/**
 * The title a page shows: "task-98: x" reads "Task 98: X", an ADR leads with
 * its number ("ADR 0080: ..."), everything else is sentence case.
 */
export function pageTitle(title, { id, type } = {}) {
  if (typeof title !== "string") return title
  const ref = title.match(/^(task|adr)-(\w+)(.*)$/i)
  if (ref) {
    const label = ref[1].toLowerCase() === "task" ? "Task" : "ADR"
    return readable(`${label} ${ref[2]}${ref[3]}`)
  }
  const num = type === "adr" && typeof id === "string" && id.match(/^adr-(\d+)$/)
  if (num) return `ADR ${num[1]}: ${readable(title)}`
  return readable(title)
}

/** the comparable form of a heading or title, to spot a repeated one */
export function sameText(a, b) {
  const norm = (s) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
  return norm(a) === norm(b)
}

// words after which a period does not end the sentence
const ABBREV = /(?:^|\s)(?:e\.g|i\.e|vs|etc|cf|approx|ex|p\.ex|nr|fig)\.$/i

/** capitalize a sentence that starts inside running text, after . ? or ! */
export function sentenceStarts(text) {
  return text.replace(/([.!?])(\s+)(\p{Ll})/gu, (whole, mark, space, letter, offset) => {
    const before = text.slice(Math.max(0, offset - 8), offset + 1)
    if (mark === "." && ABBREV.test(before)) return whole
    // the mark belongs to code ("plev_narrate!", "lib.rs."): not a sentence end
    const last = text.slice(0, offset + 1).match(/\S+$/)?.[0] ?? ""
    if (/_|::|\.rs[.!?]$|^`/.test(last)) return whole
    const word = (text.slice(offset + 1 + space.length).match(/^\S+/)?.[0] ?? "").replace(
      /[^\p{L}\p{N}_]+$/u,
      "",
    )
    if (isCode(word)) return whole
    return mark + space + letter.toLocaleUpperCase()
  })
}
