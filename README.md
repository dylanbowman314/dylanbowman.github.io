# dylanbowman314.github.io

## Render markdown to HTML

This repo includes `render_markdown.py`, which renders Markdown files from `markdown/` into HTML pages that use `index.css` (matching the look of `index.html`).
It also includes `page.css`, which provides small site-wide overrides (font size, subtitle spacing, and a white background).

### Fonts

`index.css` references Latin Modern font files under `./fonts/`. These are vendored from the `latex-css` project so the site doesn’t fall back to system serif fonts.

This repo also includes **TeX Gyre Termes** under `fonts/tex-gyre-termes/` (licensed under the GUST Font License). `page.css` sets TeX Gyre Termes as the preferred body font.

### Run

```bash
uv run python render_markdown.py
```

### Notes

- **Input**: `markdown/**/*.md`
- **Output**: repo root (mirrors paths), e.g. `markdown/foo.md` → `foo.html`
- **Title**: first `# Heading` in the markdown (fallback: filename)
- **Body**: the first `# Heading` is used as the page title and removed from the body (use `--keep-title-heading` to keep it)
- **Frontmatter (optional)**: set `title`, `author`, and/or `date` in the markdown and it will be used for the page header. `author` is used in the "Last updated … by …" subtitle.
- **Optional extensions**:

```bash
uv run python render_markdown.py --extensions fenced_code,tables
```

### Navigation links

Generated pages include a small top nav with **Home** and **About** links pointing at `index.html` and `about.html`. The renderer computes these as **relative links**, so they work from nested pages too.

### Keep the first heading in the body (optional)

```bash
uv run python render_markdown.py --keep-title-heading
```

### Add a date subtitle from markdown (optional)

Put this at the very top of your markdown file:

```text
---
date: 2026-01-01
---
```

You can also override the title (instead of using the first `# Heading`):

```text
---
title: The best year of my life
author: Dylan Bowman
date: 2026-01-01
---
```
