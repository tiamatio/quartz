# Quartz v5

> **This fork, branch `plev`:** the reading site of plev's knowledge base.
> It runs from `apps/quartzweb` inside a plev checkout, where `content/`
> links each part of plev's `docs/` by relative symlink (outside plev those
> links are empty). `content/blog/` holds the posts the monsters write, and
> `content/atlas.md` and `content/terms.md` show `ATLAS.toml` and `TERMS.toml`.
> `plugins/plev-book/` reads the tree as a book: a README is its folder's page,
> titles and sentences read in sentence case (the docs keep their lowercase),
> `relations` become links, `topics` become tags, and `date`/`revised` are
> the dates shown. Run it with:
>
> ```
> npm ci && npm run install-plugins && npx quartz build --serve
> ```

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
