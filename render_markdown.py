#!/usr/bin/env python3
"""
Render Markdown files from ./markdown into HTML pages styled like ./index.html.

Default behavior:
- Input:   markdown/**/*.md
- Output:  repo root, mirroring paths (e.g. markdown/posts/a.md -> posts/a.html)
- Title:   first "# Heading" in the markdown, else filename stem

Examples:
  uv run python render_markdown.py
  uv run python render_markdown.py --markdown-dir markdown --out-root .
  uv run python render_markdown.py --extensions fenced_code,tables
"""

from __future__ import annotations

import argparse
import html
import os
import re
from dataclasses import dataclass
from pathlib import Path

from markdown import Markdown


@dataclass(frozen=True)
class RenderConfig:
    repo_root: Path
    markdown_dir: Path
    out_root: Path
    extensions: tuple[str, ...]
    force: bool
    keep_title_heading: bool


H1_RE = re.compile(r"^\s*#\s+(?P<title>.+?)\s*$")


def _parse_frontmatter(md_text: str) -> tuple[dict[str, str], str]:
    """
    Parse a very small YAML-like frontmatter block:

    ---
    title: My Title
    date: 2026-01-01
    ---

    Returns (meta, body_markdown).
    """
    # Only treat a leading '---' on the first line as frontmatter.
    lines = md_text.splitlines(keepends=True)
    if not lines:
        return {}, md_text
    if lines[0].strip() != "---":
        return {}, md_text

    end_idx: int | None = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break
    if end_idx is None:
        return {}, md_text

    meta_lines = lines[1:end_idx]
    body_lines = lines[end_idx + 1 :]
    # Drop a single leading blank line after the closing '---'
    if body_lines and body_lines[0].strip() == "":
        body_lines = body_lines[1:]

    meta: dict[str, str] = {}
    for raw in meta_lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        k = k.strip().lower()
        v = v.strip()
        if k:
            meta[k] = v

    return meta, "".join(body_lines)


def _split_title_and_body(md_text: str, fallback: str) -> tuple[str | None, str]:
    """
    Returns (title_or_none, body_markdown).

    If a first level-1 heading is present ("# ..."), it is used as the title and
    removed from the markdown body (including one following blank line, if any).
    """
    lines = md_text.splitlines(keepends=True)
    for i, line in enumerate(lines):
        m = H1_RE.match(line.rstrip("\r\n"))
        if not m:
            continue

        title = m.group("title").strip()
        body_lines = lines[:i] + lines[i + 1 :]
        if i + 1 < len(lines) and body_lines and body_lines[0].strip() == "":
            body_lines = body_lines[1:]
        return title, "".join(body_lines)

    return None, md_text


def _template_html(*, page_title: str, page_date: str | None, css_href: str, body_html: str) -> str:
    # Keep the same class names as `index.html` so `index.css` does the styling.
    safe_title = html.escape(page_title, quote=True)
    safe_date = html.escape(page_date, quote=True) if page_date else ""
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{safe_title}</title>
  <link rel="stylesheet" type="text/css" href="{html.escape(css_href, quote=True)}" />
  <link rel="stylesheet" type="text/css" href="{html.escape(os.path.join(os.path.dirname(css_href), 'page.css'), quote=True)}" />
</head>
<body>
  <main class="page">
    <div class="maketitle">
      <h2 class="titleHead">{safe_title}</h2>
      <div class="author"></div><br />
      <div class="date">{safe_date}</div>
    </div>
{body_html}
  </main>
</body>
</html>
"""


def _render_one(cfg: RenderConfig, md_path: Path) -> Path:
    md_text = md_path.read_text(encoding="utf-8")
    meta, md_wo_frontmatter = _parse_frontmatter(md_text)

    fm_title = meta.get("title")
    fm_date = meta.get("date")

    h1_title, body_md = _split_title_and_body(md_wo_frontmatter, fallback=md_path.stem)
    title = (fm_title or h1_title or md_path.stem).strip()

    if cfg.keep_title_heading:
        body_md = md_wo_frontmatter
    else:
        # If frontmatter provided a title but there's still a top-level H1 that matches it,
        # strip it to avoid duplication.
        if fm_title and h1_title and fm_title.strip() != h1_title.strip():
            body_md = md_wo_frontmatter

    # Output path mirrors markdown/ relative structure into out_root.
    rel = md_path.relative_to(cfg.markdown_dir)
    out_path = cfg.out_root / rel.with_suffix(".html")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Compute correct relative link to index.css living in repo root.
    css_abs = cfg.repo_root / "index.css"
    css_href = os.path.relpath(css_abs, start=out_path.parent)

    md = Markdown(extensions=list(cfg.extensions))
    body_html = md.convert(body_md)

    html_text = _template_html(
        page_title=title,
        page_date=fm_date,
        css_href=css_href,
        body_html=body_html,
    )

    if out_path.exists() and not cfg.force:
        raise FileExistsError(
            f"Refusing to overwrite existing file: {out_path}. Use --force to overwrite."
        )

    out_path.write_text(html_text, encoding="utf-8")
    return out_path


def _parse_args(argv: list[str] | None = None) -> RenderConfig:
    repo_root = Path(__file__).resolve().parent

    p = argparse.ArgumentParser(description="Render markdown/*.md into styled HTML pages.")
    p.add_argument(
        "--markdown-dir",
        default=str(repo_root / "markdown"),
        help="Directory containing markdown files (default: ./markdown).",
    )
    p.add_argument(
        "--out-root",
        default=str(repo_root),
        help="Output root directory (default: repo root).",
    )
    p.add_argument(
        "--extensions",
        default="",
        help="Comma-separated Python-Markdown extensions to enable (optional).",
    )
    p.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing .html files.",
    )
    p.add_argument(
        "--keep-title-heading",
        action="store_true",
        help="Keep the first '# Heading' in the rendered HTML body (default: removed).",
    )

    args = p.parse_args(argv)
    exts = tuple(e.strip() for e in str(args.extensions).split(",") if e.strip())

    return RenderConfig(
        repo_root=repo_root,
        markdown_dir=Path(args.markdown_dir).resolve(),
        out_root=Path(args.out_root).resolve(),
        extensions=exts,
        force=bool(args.force),
        keep_title_heading=bool(args.keep_title_heading),
    )


def main(argv: list[str] | None = None) -> int:
    cfg = _parse_args(argv)

    if not cfg.markdown_dir.exists():
        raise FileNotFoundError(f"markdown dir not found: {cfg.markdown_dir}")

    md_files = sorted(cfg.markdown_dir.rglob("*.md"))
    if not md_files:
        print(f"No markdown files found under: {cfg.markdown_dir}")
        return 0

    rendered: list[Path] = []
    for md_path in md_files:
        rendered.append(_render_one(cfg, md_path))

    for out_path in rendered:
        print(out_path.relative_to(cfg.repo_root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


