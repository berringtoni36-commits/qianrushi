from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from docx import Document


SOURCE = Path(r"C:\Users\11624\Desktop\嵌入式高频八股\转 Word_烤鸭的嵌入式校招笔记（纯面经版）(1).docx")
OUTPUT = Path(r"C:\Users\11624\Desktop\Rtos项目\docx_md_output\烤鸭的嵌入式校招笔记_纯面经版_整理版.md")


@dataclass
class Block:
    kind: str
    text: str
    level: int = 0


PAGE_RE = re.compile(r"^(?:-?\s*)?\d+(?:\s*-)?$")
TOC_DOTS_RE = re.compile(r"\.{8,}")
QUESTION_RE = re.compile(r"^\d+\.\s+.+[？?]$")
LIST_RE = re.compile(r"^\d+\.\s*")
CHINESE_SECTION_RE = re.compile(r"^[一二三四五六七八九十百]+、")
ROUND_RE = re.compile(r"^(?:一面|二面|三面|四面|HR\s*面|技术面|综合面|未标注轮次|面经\s*\d+)")


def fixed_text(text: str) -> str:
    text = text.replace("\ua880", "提").replace("\ua881", "描")
    text = text.replace("（免费分享，请勿商用）", "")
    text = text.replace("（烤鸭嵌入式免费分享，请勿商用）", "")
    text = text.replace("烤鸭嵌入式免费分享，请勿商用", "")
    text = text.replace("\u00a0", " ").strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace(" / ", " / ")
    return text


def run_size(paragraph) -> float | None:
    sizes: list[float] = []
    for run in paragraph.runs:
        if run.text.strip() and run.font.size:
            sizes.append(float(run.font.size.pt))
    return sizes[0] if sizes else None


def is_page_noise(text: str, size: float | None) -> bool:
    if not text:
        return True
    if text in {"飞出金陵的烤鸭（免费分享，请勿商用）", "有需要交流可+（xihongshixuezhang）"}:
        return True
    if text == "飞出金陵的烤鸭" and size and size <= 10:
        return True
    if PAGE_RE.match(text) and size and size <= 10:
        return True
    return False


def is_sentence_end(text: str) -> bool:
    return bool(re.search(r"[。！？；：.!?;:）)”】》]$", text))


def is_heading(text: str, size: float | None, in_chapter_three: bool) -> int:
    if size is None:
        return 0
    if size >= 24:
        return 1
    if text in {"目录"}:
        return 0
    if size >= 15:
        if text.startswith(("第", "尾章")):
            return 2
        if CHINESE_SECTION_RE.match(text):
            return 3
        if size >= 16:
            return 3
        return 2
    if size >= 14:
        if in_chapter_three and re.match(r"^\d+\.", text):
            return 3
        if text in {"真实面经", "网络收集面经", "网络整理面经：", "真实面经："}:
            return 4
        return 3
    if size >= 12:
        return 4
    if len(text) <= 30 and ROUND_RE.match(text) and not is_sentence_end(text):
        return 5
    return 0


def join_text(left: str, right: str) -> str:
    if left.startswith("http") or re.match(r"^[A-Za-z0-9/_:?.=&%#-]+$", left + right):
        if re.search(r"[\u4e00-\u9fff]", right):
            return f"{left}\n\n{right}"
        return left + right
    return left + right if re.search(r"[\u4e00-\u9fff]$", left) else f"{left} {right}"


def flush_paragraph(lines: list[str], blocks: list[Block]) -> None:
    if not lines:
        return
    text = lines[0]
    for line in lines[1:]:
        text = join_text(text, line)
    text = re.sub(r"\s+", " ", text).strip()
    if text:
        blocks.append(Block("paragraph", text))
    lines.clear()


def main() -> None:
    document = Document(str(SOURCE))
    blocks: list[Block] = []
    paragraph_lines: list[str] = []
    in_toc = False
    in_chapter_three = False

    for paragraph in document.paragraphs:
        text = fixed_text(paragraph.text)
        size = run_size(paragraph)

        if is_page_noise(text, size):
            flush_paragraph(paragraph_lines, blocks)
            continue

        if text == "目录":
            flush_paragraph(paragraph_lines, blocks)
            in_toc = True
            continue

        if in_toc:
            if text == "第一章：中大厂嵌入式校招面经汇总" and size and size >= 15:
                in_toc = False
            else:
                continue

        text = TOC_DOTS_RE.sub("", text).strip()
        text = re.sub(r"\s*-?\s*\d+\s*-$", "", text).strip()
        if not text:
            continue

        if text in {"Embedded Job Interview Guide", "面经纯享版"}:
            flush_paragraph(paragraph_lines, blocks)
            blocks.append(Block("quote", text))
            continue

        level = is_heading(text, size, in_chapter_three)
        if level:
            flush_paragraph(paragraph_lines, blocks)
            blocks.append(Block("heading", text, level))
            in_chapter_three = text.startswith("第三章")
            continue

        if re.fullmatch(r"\d+\.", text):
            paragraph_lines.append(text)
            continue

        if LIST_RE.match(text) or text.startswith(("（1）", "（2）", "（3）")):
            flush_paragraph(paragraph_lines, blocks)
            blocks.append(Block("paragraph", text))
            continue

        if paragraph_lines and re.fullmatch(r"\d+\.", paragraph_lines[-1]):
            paragraph_lines[-1] = f"{paragraph_lines[-1]} {text}"
            flush_paragraph(paragraph_lines, blocks)
            continue

        paragraph_lines.append(text)
        if is_sentence_end(text):
            flush_paragraph(paragraph_lines, blocks)

    flush_paragraph(paragraph_lines, blocks)

    lines: list[str] = []
    for block in blocks:
        if block.kind == "heading":
            if lines and lines[-1] != "":
                lines.append("")
            lines.append(f"{'#' * block.level} {block.text}")
            lines.append("")
        elif block.kind == "quote":
            lines.append(f"> {block.text}")
            lines.append("")
        else:
            lines.append(block.text)
            lines.append("")

    markdown = "\n".join(lines).strip() + "\n"
    markdown = re.sub(r"（?烤鸭\s*嵌入式\s*免费分享，请勿商用）?", "", markdown)
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)
    OUTPUT.write_text(markdown, encoding="utf-8")


if __name__ == "__main__":
    main()
