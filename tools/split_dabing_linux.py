from __future__ import annotations

import re
from pathlib import Path


ROOT = Path("projects/嵌入式八股")
SOURCE = ROOT / "大丙Linux 教程（Subingwen 专栏合并）-Defuddle提取.md"
DEST = ROOT / "大丙Linux教程"

CHAPTERS = [
    ("第1章 Linux 基础", 10),
    ("第2章 文件IO", 5),
    ("第3章 进程和线程", 10),
    ("第4章 套接字通信", 12),
    ("番外", 4),
]


def yaml_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def clean_title(value: str) -> str:
    # The source uses escaped punctuation in some Markdown headings.  File
    # names and YAML titles should contain the readable title instead.
    return re.sub(r"\\([\\`*_{}\[\]()#+.!|>~-])", r"\1", value).strip()


def image_to_wikilink(match: re.Match[str]) -> str:
    alt, path, title = match.group(1), match.group(2), match.group(3)
    label = title or alt
    if label:
        label = label.strip()
        if len(label) >= 2 and label[0] == label[-1] and label[0] in "\"'":
            label = label[1:-1]
        return f"![[{path}|{label}]]"
    return f"![[{path}]]"


IMAGE_RE = re.compile(
    r"!\[([^\]]*)\]\((assets/[^)\s]+)(?:\s+((?:\"[^\"]*\")|(?:'[^']*')))?\)"
)


def convert_images(line: str) -> str:
    return IMAGE_RE.sub(image_to_wikilink, line)


def scan_fences(lines: list[str]) -> list[bool]:
    """Return whether each line is outside a fenced code block.

    The extracted source contains both regular and indented fences.  Markdown
    allows up to three spaces before a fence, and the source also has fences
    nested in list indentation; accepting any leading whitespace preserves the
    source's existing code blocks and prevents shell comments from becoming
    headings.
    """

    outside: list[bool] = []
    fenced = False
    for line in lines:
        outside.append(not fenced)
        if re.match(r"^\s*(`{3,}|~{3,})", line):
            fenced = not fenced
    if fenced:
        raise ValueError("source ended inside a fenced code block")
    return outside


def extract_articles(lines: list[str], outside: list[bool]) -> list[dict[str, object]]:
    marker_re = re.compile(r"^> (?:来源|原文)：\[([^\]]+)\]\((https?://[^)]+)\)")
    markers: list[tuple[int, str, str]] = []
    for i, line in enumerate(lines):
        match = marker_re.match(line)
        if match and outside[i]:
            marker_title = clean_title(match.group(1))
            marker_title = re.sub(r"^原文：", "", marker_title)
            markers.append((i, marker_title, match.group(2)))
    if len(markers) != 41:
        raise ValueError(f"expected 41 source markers, found {len(markers)}")

    articles: list[dict[str, object]] = []
    structural_re = re.compile(r"^## (?:第[1-4]章|番外|CMake 保姆级教程)")
    for index, (marker, source_title, source_url) in enumerate(markers):
        title_start = marker - 1
        while title_start >= 0 and not (
            outside[title_start] and re.match(r"^#{1,6}\s+", lines[title_start])
        ):
            title_start -= 1
        if title_start < 0:
            raise ValueError(f"could not find title heading for article {source_title}")
        title_line = lines[title_start]
        heading_match = re.match(r"^#{1,6}\s+(.+?)\s*$", title_line)
        if not heading_match:
            raise ValueError(f"invalid title heading for article {source_title}")
        heading_title = clean_title(heading_match.group(1))
        if heading_title != source_title:
            # The source marker is the canonical article title, but preserve a
            # readable heading if the extractor used a slightly different form.
            source_title = heading_title

        next_marker = markers[index + 1][0] if index + 1 < len(markers) else len(lines)
        next_title_start = next_marker - 1
        while next_title_start >= 0 and not (
            outside[next_title_start] and re.match(r"^#{1,6}\s+", lines[next_title_start])
        ):
            next_title_start -= 1
        end = next_title_start if next_title_start > title_start else next_marker

        # Chapter separators sit between adjacent source articles.  They are
        # navigation structure for the merged file, not part of either article.
        for j in range(title_start + 1, end):
            if outside[j] and structural_re.match(lines[j]):
                end = j
                break

        raw = lines[title_start:end]
        while raw and not raw[-1].strip():
            raw.pop()
        if not raw:
            raise ValueError(f"empty article body for {source_title}")

        articles.append(
            {
                "title": source_title,
                "source": source_url,
                "raw": raw,
                "source_start": marker,
                "source_title_heading": title_start,
                "order_global": index + 1,
            }
        )
    return articles


def chapter_for(global_order: int) -> tuple[str, int, int]:
    cursor = 0
    for chapter_index, (name, count) in enumerate(CHAPTERS, 1):
        if global_order <= cursor + count:
            return name, chapter_index, global_order - cursor
        cursor += count
    raise ValueError(global_order)


def article_filename(order: int, title: str) -> str:
    return f"{order:02d} {title}.md"


def transform_body(raw: list[str], title: str, is_cmake: bool) -> list[str]:
    # The first line is the original article heading (### for Linux, ## for
    # CMake).  Make it the sole H1 in the split document.
    if not raw or not re.match(r"^#{1,6}\s+", raw[0]):
        raise ValueError(f"article does not start with a heading: {title}")
    shift = 1 if is_cmake else 2
    body: list[str] = [f"# {title}"]
    fenced = False
    for line in raw[1:]:
        if re.match(r"^\s*(`{3,}|~{3,})", line):
            fenced = not fenced
            body.append(line)
            continue
        if not fenced:
            heading = re.match(r"^(\s*)(#{1,6})(\s+)(.*)$", line)
            if heading:
                indent, marks, space, text = heading.groups()
                level = max(2, len(marks) - shift)
                line = f"{indent}{'#' * level}{space}{text}"
        body.append(convert_images(line))
    if fenced:
        raise ValueError(f"article ended inside a fenced code block: {title}")
    while len(body) > 1 and not body[-1].strip():
        body.pop()
    return body


def nav_line(article: dict[str, object], articles: list[dict[str, object]]) -> str:
    order = int(article["order_global"])
    chapter_name, _, _ = chapter_for(order)
    chapter_index_target = (chapter_dir / "index").as_posix()
    pieces = [f"[[{chapter_index_target}|← 返回本章目录]]"]
    if order > 1:
        prev = articles[order - 2]
        prev_name = prev["filename"]
        prev_target = (DEST / chapter_for(order - 1)[0] / Path(str(prev_name)).stem).as_posix()
        pieces.append(f"[[{prev_target}|上一篇：{prev['title']}]]")
    if order < len(articles):
        nxt = articles[order]
        nxt_name = nxt["filename"]
        nxt_target = (DEST / chapter_for(order + 1)[0] / Path(str(nxt_name)).stem).as_posix()
        pieces.append(f"[[{nxt_target}|下一篇：{nxt['title']} →]]")
    return " · ".join(pieces)


def write_article(article: dict[str, object], articles: list[dict[str, object]]) -> None:
    order = int(article["order_global"])
    chapter_name, _, chapter_order = chapter_for(order)
    title = str(article["title"])
    is_cmake = order >= 40
    filename = article_filename(chapter_order, title)
    destination = DEST / chapter_name / filename
    tags = ["Linux", "教程", "Subingwen"]
    if is_cmake:
        tags = ["CMake", "教程", "Subingwen"]
    metadata = [
        "---",
        f"title: {yaml_quote(title)}",
        f"chapter: {yaml_quote(chapter_name)}",
        f"order: {chapter_order}",
        f"source: {yaml_quote(str(article['source']))}",
        'author: "苏丙榅"',
        "tags: [" + ", ".join(tags) + "]",
        "type: reference",
        "---",
        "",
    ]
    body = transform_body(list(article["raw"]), title, is_cmake)
    # Navigation is inserted after the H1 and before the source note.
    output = metadata + [body[0], "", nav_line(article, articles), ""] + body[1:]
    destination.write_text("\n".join(output).rstrip() + "\n", encoding="utf-8")


def write_chapter_index(chapter_name: str, chapter_index: int, chapter_articles: list[dict[str, object]]) -> None:
    path = DEST / chapter_name / "index.md"
    lines = [
        "---",
        f"title: {yaml_quote(chapter_name)}",
        f"chapter: {yaml_quote(chapter_name)}",
        f"order: {chapter_index}",
        "type: index",
        "tags: [Linux, 教程, Subingwen]",
        "---",
        "",
        f"# {chapter_name}",
        "",
        f"[[projects/嵌入式八股/大丙Linux教程/index|← 返回大丙 Linux 教程总目录]]",
        "",
        "## 本章目录",
        "",
    ]
    for article in chapter_articles:
        lines.append(
            f"{int(article['chapter_order'])}. [[{Path(str(article['filename'])).stem}|{article['title']}] ]".replace("] ]", "]]" )
        )
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def write_root_index(articles: list[dict[str, object]]) -> None:
    lines = [
        "---",
        'title: "大丙 Linux 教程"',
        "tags: [Linux, CMake, 教程, 复习, Subingwen]",
        "type: index",
        'source: "https://subingwen.cn/linux/"',
        "author: \"苏丙榅\"",
        "---",
        "",
        "# 大丙 Linux 教程",
        "",
        "> [!info] 目录说明",
        "> 本目录按 Subingwen Linux 专栏原始章节整理。每篇文章独立成文，保留代码、表格、图片和原文链接。",
        "> CMake 保姆级教程（上、下）按你的目录规划归入“番外”。",
        "",
        "> [!note] 合并全文",
        "> [[../大丙Linux 教程（Subingwen 专栏合并）-Defuddle提取|打开原始合并文档]]",
        "",
        "## 目录",
        "",
    ]
    cursor = 0
    for chapter_index, (chapter_name, count) in enumerate(CHAPTERS, 1):
        lines.append(f"### {chapter_name}")
        lines.append("")
        lines.append(f"[[{chapter_name}/index|进入{chapter_name}目录]]")
        lines.append("")
        for article in articles[cursor : cursor + count]:
            lines.append(
                f"{int(article['chapter_order'])}. [[{chapter_name}/{Path(str(article['filename'])).stem}|{article['title']}] ]".replace("] ]", "]]" )
            )
        lines.append("")
        cursor += count
    (DEST / "index.md").write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    outside = scan_fences(lines)
    articles = extract_articles(lines, outside)
    # Create the complete destination tree.  The target is new by contract;
    # refusing to overwrite it protects any user edits if this utility is run
    # twice accidentally.
    if DEST.exists():
        raise FileExistsError(f"destination already exists: {DEST}")
    for chapter_name, _ in CHAPTERS:
        (DEST / chapter_name).mkdir(parents=True, exist_ok=False)
    # Set filenames before writing so navigation can resolve every article.
    for article in articles:
        order = int(article["order_global"])
        chapter_name, _, chapter_order = chapter_for(order)
        article["chapter_order"] = chapter_order
        article["filename"] = article_filename(chapter_order, str(article["title"]))
    for article in articles:
        write_article(article, articles)
    cursor = 0
    for chapter_index, (chapter_name, count) in enumerate(CHAPTERS, 1):
        chapter_articles = articles[cursor : cursor + count]
        write_chapter_index(chapter_name, chapter_index, chapter_articles)
        cursor += count
    write_root_index(articles)
    print(f"generated {len(articles)} articles under {DEST}")


if __name__ == "__main__":
    main()
