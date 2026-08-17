"""Formatting helpers for the local RedNote archive.

The sync plugin owns the source data.  This module only changes Markdown
presentation around that data and is deliberately idempotent: a second run
does not rewrite an already formatted note.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable


FORMAT_VERSION = 1
IMAGE_WIDTH = 520
ARTICLE_DIRS = (
    "收藏（Bookmarks）",
    "点赞（Likes）",
    "我的发布（Posts）",
)


def _split_frontmatter(text: str) -> tuple[str, str] | None:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end < 0:
        return None
    return text[4:end], text[end + len("\n---\n") :]


def _with_marker(frontmatter: str) -> str:
    if re.search(r"^rednoteFormatVersion\s*:", frontmatter, flags=re.M):
        return frontmatter.rstrip()
    return frontmatter.rstrip() + f"\nrednoteFormatVersion: {FORMAT_VERSION}"


def _scalar(frontmatter: str, key: str) -> str:
    match = re.search(rf"^{re.escape(key)}:\s*(.*?)\s*$", frontmatter, flags=re.M)
    if not match:
        return ""
    value = match.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def _first_list_item(frontmatter: str, key: str) -> str:
    match = re.search(
        rf"^{re.escape(key)}:\s*\n\s+-\s+(.*?)\s*$",
        frontmatter,
        flags=re.M,
    )
    if not match:
        return ""
    value = match.group(1).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def _clean_edges(lines: list[str]) -> list[str]:
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return lines


def _is_fence(line: str) -> bool:
    return bool(re.match(r"^\s*(`{3,}|~{3,})", line))


def _format_body_lines(lines: Iterable[str]) -> list[str]:
    """Normalize visual noise and demote body headings below ``## 正文``.

    Code fences are left byte-for-byte apart from the surrounding line ending;
    this avoids changing commands or code examples that happen to contain a
    heading-looking line.
    """

    result: list[str] = []
    in_fence = False
    for raw in lines:
        line = raw.rstrip(" \t")
        if _is_fence(line):
            in_fence = not in_fence
            result.append(line)
            continue
        if not in_fence:
            # Imported RedNote paragraphs often contain a tab used only as
            # visual indentation.  Keep code blocks untouched, but make those
            # paragraphs render consistently in Obsidian.
            line = line.replace("\t", " ")
            line = re.sub(r"^(\s*) +", lambda m: m.group(1), line)
            heading = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
            if heading:
                level = min(len(heading.group(1)) + 1, 6)
                line = "#" * level + " " + heading.group(2)
            image = re.match(r"^(\s*!\[\[)([^\]\n]+)(\]\].*)$", line)
            if image and "|" not in image.group(2):
                line = image.group(1) + image.group(2) + f"|{IMAGE_WIDTH}" + image.group(3)
        result.append(line)
    return _clean_edges(result)


def _callout_line(line: str) -> str:
    return ">" if not line else "> " + line


def _article_output(frontmatter: str, body: str, path: Path) -> str:
    lines = body.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title_index = next(
        (i for i, line in enumerate(lines) if re.match(r"^#[ \t]+\S", line)),
        None,
    )
    if title_index is None:
        title = path.stem
        title_index = -1
    else:
        title = re.sub(r"^#\s+", "", lines[title_index]).strip()

    comment_index = next(
        (
            i
            for i, line in enumerate(lines)
            if i > title_index and re.match(r"^##\s*评论\s*$", line.strip())
        ),
        None,
    )
    footer_indices = [
        i
        for i, line in enumerate(lines)
        if re.match(r"^原文：\s*https?://\S+", line.strip())
    ]
    footer_index = footer_indices[-1] if footer_indices else None

    body_end_candidates = [i for i in (comment_index, footer_index) if i is not None]
    body_end = min(body_end_candidates) if body_end_candidates else len(lines)
    content_start = title_index + 1 if title_index >= 0 else 0
    content_lines = lines[content_start:body_end]

    # The importer writes these two lines immediately below the title.  Move
    # them into the information card rather than displaying them as loose text.
    removed_metadata: set[str] = set()
    kept: list[str] = []
    for line in content_lines:
        stripped = line.strip()
        key = "作者" if re.match(r"^作者[：:]", stripped) else "专辑" if re.match(r"^专辑[：:]", stripped) else ""
        if key and key not in removed_metadata:
            removed_metadata.add(key)
            continue
        kept.append(line)
    content_lines = _format_body_lines(kept)

    comment_lines: list[str] = []
    if comment_index is not None:
        comment_end = footer_index if footer_index is not None and footer_index > comment_index else len(lines)
        comment_lines = _clean_edges([line.rstrip(" \t") for line in lines[comment_index + 1 : comment_end]])

    author = _scalar(frontmatter, "author")
    note_type = _scalar(frontmatter, "type")
    created = _scalar(frontmatter, "postCreatedAt")
    album = _first_list_item(frontmatter, "albums")
    account = _scalar(frontmatter, "accountName")
    url = _scalar(frontmatter, "url")

    output: list[str] = ["# " + title, "", "> [!info] 文章信息"]
    if author:
        output.append(f"> **作者**：{author}")
    if account and account != author:
        output.append(f"> **来源账号**：{account}")
    if note_type:
        output.append(f"> **类型**：{note_type}")
    if created:
        output.append(f"> **发布时间**：{created}")
    if album:
        output.append(f"> **专辑**：{album}")
    if url:
        output.append(f"> **原文**：[打开小红书](<{url}>)")

    if content_lines:
        output += ["", "## 正文", ""]
        output.extend(content_lines)

    if comment_lines:
        count = sum(1 for line in comment_lines if line.lstrip().startswith("- ")) or 1
        output += ["", "## 评论", "", f"> [!quote]- 评论（{count} 条）"]
        output.extend(_callout_line(line) for line in comment_lines)

    # Keep the source URL as visible text as well as a clickable metadata link.
    if url:
        output += ["", "---", "", f"原文：{url}"]

    marked = _with_marker(frontmatter)
    return "---\n" + marked + "\n---\n\n" + "\n".join(output).rstrip() + "\n"


def _looks_formatted_article(frontmatter: str, body: str) -> bool:
    return (
        bool(re.search(r"^rednoteFormatVersion\s*:\s*1\s*$", frontmatter, flags=re.M))
        and re.search(r"^> \[!info\] 文章信息\s*$", body, flags=re.M) is not None
        and re.search(r"^## 正文\s*$", body, flags=re.M) is not None
    )


def _format_article(path: Path, dry_run: bool) -> bool:
    text = path.read_text(encoding="utf-8", errors="replace")
    parsed = _split_frontmatter(text)
    if parsed is None:
        return False
    frontmatter, body = parsed
    if _looks_formatted_article(frontmatter, body):
        return False
    formatted = _article_output(frontmatter, body, path)
    if formatted == text.replace("\r\n", "\n").replace("\r", "\n"):
        return False
    if not dry_run:
        path.write_text(formatted, encoding="utf-8")
    return True


def _format_album(path: Path, dry_run: bool) -> bool:
    text = path.read_text(encoding="utf-8", errors="replace")
    parsed = _split_frontmatter(text)
    if parsed is None:
        return False
    frontmatter, body = parsed
    if (
        re.search(r"^rednoteFormatVersion\s*:\s*1\s*$", frontmatter, flags=re.M)
        and re.search(r"^## 收录内容\s*$", body, flags=re.M)
    ):
        return False
    lines = body.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title_index = next((i for i, line in enumerate(lines) if re.match(r"^#[ \t]+\S", line)), None)
    title = _scalar(frontmatter, "albumName") or (re.sub(r"^#\s+", "", lines[title_index]).strip() if title_index is not None else path.stem)
    remainder = lines[title_index + 1 :] if title_index is not None else lines
    remainder = _clean_edges([line.rstrip(" \t") for line in remainder])
    count = sum(1 for line in remainder if line.lstrip().startswith("- "))
    updated = _scalar(frontmatter, "updatedAt")
    output = [f"# {title}", "", "> [!info] 专辑信息", f"> **收录文章**：{count} 篇"]
    if updated:
        output.append(f"> **最近更新**：{updated}")
    output += ["", "## 收录内容", ""]
    output.extend(remainder)
    formatted = "---\n" + _with_marker(frontmatter) + "\n---\n\n" + "\n".join(output).rstrip() + "\n"
    if formatted == text.replace("\r\n", "\n").replace("\r", "\n"):
        return False
    if not dry_run:
        path.write_text(formatted, encoding="utf-8")
    return True


def source_paths(vault: Path) -> list[Path]:
    root = vault / "小红书（RedNote）" / "。。。。。。。"
    result: list[Path] = []
    for folder in ARTICLE_DIRS:
        result.extend(sorted((root / folder).glob("*.md")))
    result.extend(sorted((root / "专辑（Albums）").glob("**/*.md")))
    return result


def format_source_notes(vault: Path, dry_run: bool = False) -> list[Path]:
    changed: list[Path] = []
    root = vault / "小红书（RedNote）" / "。。。。。。。"
    for path in source_paths(vault):
        if path.parent.name == "专辑（Albums）" or "专辑（Albums）" in path.parts:
            did_change = _format_album(path, dry_run)
        else:
            did_change = _format_article(path, dry_run)
        if did_change:
            changed.append(path.relative_to(vault))
    return changed


def validate_source_notes(vault: Path) -> list[str]:
    errors: list[str] = []
    for path in source_paths(vault):
        parsed = _split_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        if parsed is None:
            errors.append(f"缺少或损坏 YAML：{path.relative_to(vault)}")
            continue
        frontmatter, body = parsed
        if "专辑（Albums）" in path.parts:
            if not re.search(r"^rednoteFormatVersion\s*:\s*1\s*$", frontmatter, flags=re.M):
                errors.append(f"专辑未格式化：{path.relative_to(vault)}")
            if not re.search(r"^## 收录内容\s*$", body, flags=re.M):
                errors.append(f"专辑缺少收录内容标题：{path.relative_to(vault)}")
        else:
            if not _looks_formatted_article(frontmatter, body):
                errors.append(f"文章未格式化：{path.relative_to(vault)}")
            if len(re.findall(r"^#[ \t]+\S", body, flags=re.M)) != 1:
                errors.append(f"文章主标题数量异常：{path.relative_to(vault)}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("vault", type=Path, nargs="?", default=Path(__file__).resolve().parent)
    parser.add_argument("--check", action="store_true", help="只检查，不写入")
    args = parser.parse_args()
    if args.check:
        errors = validate_source_notes(args.vault)
        if errors:
            print("\n".join(errors))
            return 1
        print("rednote_source_validation=PASS")
        return 0
    changed = format_source_notes(args.vault)
    print(f"formatted_source_notes={len(changed)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
