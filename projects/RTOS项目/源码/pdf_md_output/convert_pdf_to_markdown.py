from __future__ import annotations

import re
from pathlib import Path

import fitz


SOURCE = Path(r"D:\weinxin file\xwechat_files\wxid_7c8ijebjhp8112_ecf0\msg\file\2026-06\烤鸭的嵌入式纯八股(1).pdf")
OUTPUT = Path(r"C:\Users\11624\Desktop\Rtos项目\pdf_md_output\烤鸭的嵌入式纯八股_整理版.md")


HEADER_RE = re.compile(r"^飞出金陵的烤鸭(?:（V:xihongshixuezhang）)?$")
PAGE_RE = re.compile(r"^-?\s*\d+\s*-?$")
TOC_DOTS_RE = re.compile(r"\.{8,}")
CHAPTER_RE = re.compile(r"^第[一二三四五六七八九十]+章\s+.+")
SECTION_RE = re.compile(r"^\d+\.\d+(?:\.\d+)?\s+.+")
QUESTION_RE = re.compile(r"^\d+[、.]\s*.+")
IMPORTANT_RE = re.compile(r"^【重要程度】")
ANSWER_RE = re.compile(r"^【参考(?:答案|回答)】")


def clean_line(line: str) -> str:
    line = line.replace("\u00a0", " ").strip()
    line = line.replace("", "-")
    line = re.sub(r"\s+", " ", line)
    return line


def is_toc_page(text: str) -> bool:
    return text.count("................................................................") >= 3 or "目录" in text[:200]


def skip_line(line: str) -> bool:
    if not line:
        return True
    if HEADER_RE.match(line):
        return True
    if PAGE_RE.match(line):
        return True
    return False


def is_code_like(line: str) -> bool:
    return bool(
        re.search(r"[{};]", line)
        or line.startswith(("#include", "int main", "class ", "struct ", "return ", "if ", "for ", "while "))
    )


def should_join(left: str, right: str) -> bool:
    if not left:
        return False
    if is_code_like(left) or is_code_like(right):
        return False
    if left.endswith(("。", "！", "？", "；", "：", ".", "!", "?", ";", ":", "）", ")", "】", "」")):
        return False
    if QUESTION_RE.match(right) or IMPORTANT_RE.match(right) or ANSWER_RE.match(right):
        return False
    if CHAPTER_RE.match(right) or SECTION_RE.match(right):
        return False
    return True


def flush_paragraph(buffer: list[str], out: list[str]) -> None:
    if not buffer:
        return
    text = buffer[0]
    for item in buffer[1:]:
        if should_join(text, item):
            text += item if re.search(r"[\u4e00-\u9fff]$", text) else f" {item}"
        else:
            out.append(text)
            text = item
    out.append(text)
    buffer.clear()


def classify(line: str) -> str:
    if CHAPTER_RE.match(line):
        return f"## {line}"
    if SECTION_RE.match(line):
        return f"### {line}"
    if QUESTION_RE.match(line) and len(line) <= 90:
        return f"#### {line}"
    if IMPORTANT_RE.match(line):
        return f"**{line}**"
    if ANSWER_RE.match(line):
        return f"**{line}**"
    return line


def main() -> None:
    doc = fitz.open(SOURCE)
    lines: list[str] = []
    paragraph: list[str] = []
    started = False
    current_chapter = ""
    current_section = ""

    for page in doc:
        raw_text = page.get_text("text")
        if not raw_text.strip():
            continue
        if not started:
            # The bundled PDF starts with several table-of-contents pages.
            if is_toc_page(raw_text):
                continue
            started = True

        for raw_line in raw_text.splitlines():
            line = clean_line(raw_line)
            if skip_line(line):
                flush_paragraph(paragraph, lines)
                continue
            if TOC_DOTS_RE.search(line):
                continue

            if SECTION_RE.match(line):
                if line == current_section:
                    continue
                current_section = line

            if CHAPTER_RE.match(line):
                if line == current_chapter:
                    continue
                current_chapter = line
                current_section = ""

            if CHAPTER_RE.match(line) or SECTION_RE.match(line) or QUESTION_RE.match(line) or IMPORTANT_RE.match(line) or ANSWER_RE.match(line):
                flush_paragraph(paragraph, lines)
                lines.append(line)
            else:
                paragraph.append(line)
                if line.endswith(("。", "！", "？", "；", ".", "!", "?", ";")) or is_code_like(line):
                    flush_paragraph(paragraph, lines)

    flush_paragraph(paragraph, lines)

    markdown_lines = ["# 烤鸭的嵌入式纯八股", ""]
    for line in lines:
        md = classify(line)
        if md.startswith("#"):
            if markdown_lines[-1] != "":
                markdown_lines.append("")
            markdown_lines.append(md)
            markdown_lines.append("")
        elif md.startswith("**"):
            if markdown_lines[-1] != "":
                markdown_lines.append("")
            markdown_lines.append(md)
            markdown_lines.append("")
        else:
            markdown_lines.append(md)
            markdown_lines.append("")

    markdown = "\n".join(markdown_lines)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown).strip() + "\n"
    OUTPUT.write_text(markdown, encoding="utf-8")


if __name__ == "__main__":
    main()
