#!/usr/bin/env python3
"""Read Anki review evidence and update the embedded-learning workbench.

The script is deliberately read-only with respect to Anki.  It uses the same
AnkiConnect endpoint as ankimcp, but calls the low-level read actions needed to
obtain per-card review history (the installed MCP server only exposes aggregate
review statistics and caps get_cards at 50 cards).

Examples:
    python3 tools/anki_learning_sync.py --self-test
    python3 tools/anki_learning_sync.py --probe
    python3 tools/anki_learning_sync.py --sync-first
    python3 tools/anki_learning_sync.py --report-only
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import tempfile
from collections import Counter, defaultdict
from html import unescape
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


VAULT = Path(__file__).resolve().parents[1]
WORKBENCH = VAULT / "工作台"
RECORD_DIR = WORKBENCH / "条目记录"
REPORT_PATH = WORKBENCH / "Anki学习状态.md"
LOG_PATH = WORKBENCH / "Anki同步日志.md"
ANKI_URL = os.environ.get("ANKI_CONNECT_URL", "http://127.0.0.1:8765").rstrip("/")
LOCAL_TZ = ZoneInfo("Asia/Shanghai")
DECK_SEPARATOR = "\x1f"
DEFAULT_ROOTS = {"系统默认"}
RATING_NAMES = {1: "Again", 2: "Hard", 3: "Good", 4: "Easy"}
STATE_NAMES = {0: "新卡", 1: "学习中", 2: "待回看", 3: "稳定"}


class AnkiError(RuntimeError):
    """AnkiConnect is unavailable or returned an error."""


def now_local() -> dt.datetime:
    return dt.datetime.now(LOCAL_TZ)


def iso_date(value: dt.datetime | dt.date | None) -> str:
    if value is None:
        return ""
    return value.date().isoformat() if isinstance(value, dt.datetime) else value.isoformat()


def anki(action: str, params: dict[str, Any] | None = None, timeout: float = 10.0) -> Any:
    payload: dict[str, Any] = {"action": action, "version": 6}
    if params is not None:
        payload["params"] = params
    request = Request(
        ANKI_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        raise AnkiError(f"无法连接 AnkiConnect ({ANKI_URL}): {exc}") from exc
    try:
        result = json.loads(body)
    except json.JSONDecodeError as exc:
        raise AnkiError(f"AnkiConnect 返回了无法解析的响应: {body[:200]}") from exc
    if result.get("error"):
        raise AnkiError(f"AnkiConnect action={action} 失败: {result['error']}")
    return result.get("result")


def display_deck(name: str) -> str:
    return name.replace(DECK_SEPARATOR, "::")


def deck_root(name: str) -> str:
    return display_deck(name).split("::", 1)[0]


def normalize_fields(raw: Any) -> dict[str, str]:
    if not isinstance(raw, dict):
        return {}
    result: dict[str, str] = {}
    for key, value in raw.items():
        if isinstance(value, dict):
            value = value.get("value", "")
        result[str(key)] = str(value or "")
    return result


def plain_text(value: str, limit: int = 180) -> str:
    text = unescape(re.sub(r"<[^>]+>", " ", value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit] + ("…" if len(text) > limit else "")


def source_key(fields: dict[str, str]) -> str:
    for name in ("Source", "source", "原文", "来源"):
        value = fields.get(name, "")
        match = re.search(r"key=(.+)$", value.strip())
        if match:
            return match.group(1).strip()
        if value.strip():
            return value.strip()
    return ""


def question_text(fields: dict[str, str], card: dict[str, Any]) -> str:
    for name in ("Front", "正面", "Prompt", "文字", "Text"):
        if fields.get(name):
            return plain_text(fields[name])
    return plain_text(str(card.get("question", "")))


def record_id_from_source(key: str) -> str | None:
    """Map stable Source keys to the existing 231 workbench records."""
    if not key:
        return None
    match = re.search(r":(A\d+|Q\d+|\d+)$", key)
    if not match:
        return None
    token = match.group(1)
    if "嵌入式高频八股150题" in key and token.isdigit():
        return f"150-{int(token):03d}"
    if "RTOS高频面试题" in key and token.startswith("A"):
        return f"project-rtos-{token}"
    if "linux视觉感知面试题" in key and token.startswith("Q"):
        return f"project-vision-{token}"
    if ("Linux物理内存碎片高频面试题" in key or "Linux物理内存" in key) and token.isdigit():
        return f"project-memory-{int(token):03d}"
    return None


def parse_frontmatter(text: str) -> tuple[dict[str, str], int, int]:
    lines = text.splitlines()
    if len(lines) < 3 or lines[0].strip() != "---":
        raise ValueError("缺少 YAML frontmatter")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), -1)
    if end < 0:
        raise ValueError("frontmatter 未闭合")
    fields: dict[str, str] = {}
    for line in lines[1:end]:
        match = re.match(r"^([A-Za-z0-9_一-龥-]+):\s*(.*)$", line)
        if not match:
            continue
        value = match.group(2).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
            value = value[1:-1]
        fields[match.group(1)] = value
    return fields, 0, end


def load_record_index() -> dict[str, Path]:
    index: dict[str, Path] = {}
    for path in sorted(RECORD_DIR.glob("*.md")):
        try:
            fields, _, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        record_id = fields.get("record_id", "").strip()
        if record_id:
            if record_id in index:
                raise ValueError(f"工作台 record_id 重复: {record_id}")
            index[record_id] = path
    return index


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass


def update_frontmatter(text: str, changes: dict[str, str]) -> str:
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise ValueError("无法更新没有 frontmatter 的记录")
    end = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), -1)
    if end < 0:
        raise ValueError("无法更新未闭合的 frontmatter")
    found: set[str] = set()
    for i in range(1, end):
        match = re.match(r"^([A-Za-z0-9_一-龥-]+):(?:\s*.*?)(\r?\n)?$", lines[i])
        if not match:
            continue
        key = match.group(1)
        if key not in changes:
            continue
        value = changes[key]
        lines[i] = f"{key}: {value}\n"
        found.add(key)
    missing = [key for key in changes if key not in found]
    if missing:
        insertion = [f"{key}: {changes[key]}\n" for key in missing]
        lines[end:end] = insertion
    return "".join(lines)


def find_cards(query: str) -> list[int]:
    result = anki("findCards", {"query": query}) or []
    return [int(card_id) for card_id in result]


def chunked(values: list[int], size: int = 100) -> list[list[int]]:
    return [values[i : i + size] for i in range(0, len(values), size)]


def derive_state(card: dict[str, Any]) -> str:
    reviews = card["reviews"]
    if not reviews:
        return "新卡"
    latest = reviews[-1]
    last_rating = int(latest.get("ease", 0))
    if last_rating < 3 or card["is_due"]:
        return "待回看"
    if (
        len(reviews) >= 3
        and card["review_days"] >= 2
        and int(card.get("interval", 0) or 0) >= 21
        and all(int(review.get("ease", 0)) >= 3 for review in reviews[-2:])
    ):
        return "稳定"
    return "学习中"


def fetch_snapshot() -> dict[str, Any]:
    deck_map = anki("deckNamesAndIds") or {}
    all_card_ids = find_cards("deck:*")
    due_ids = set(find_cards("is:due -is:suspended"))
    cards: list[dict[str, Any]] = []
    for ids in chunked(all_card_ids):
        for raw_card in anki("cardsInfo", {"cards": ids}) or []:
            fields = normalize_fields(raw_card.get("fields"))
            card_id = int(raw_card.get("cardId", 0))
            cards.append(
                {
                    "card_id": card_id,
                    "note_id": int(raw_card.get("note", 0) or 0),
                    "deck": display_deck(str(raw_card.get("deckName", ""))),
                    "root": deck_root(str(raw_card.get("deckName", ""))),
                    "fields": fields,
                    "source_key": source_key(fields),
                    "question": question_text(fields, raw_card),
                    "queue": int(raw_card.get("queue", 0) or 0),
                    "interval": int(raw_card.get("interval", 0) or 0),
                    "factor": int(raw_card.get("factor", 0) or 0),
                    "is_due": card_id in due_ids,
                }
            )
    cards = [card for card in cards if card["root"] not in DEFAULT_ROOTS]
    all_card_ids = [card["card_id"] for card in cards]
    if len(cards) != len(set(card["card_id"] for card in cards)):
        raise ValueError("cardsInfo 返回了重复 card_id")
    reviews_by_card = anki("getReviewsOfCards", {"cards": all_card_ids}) or {}
    record_index = load_record_index()
    flat_reviews: list[dict[str, Any]] = []
    for card in cards:
        raw_reviews = reviews_by_card.get(str(card["card_id"]), reviews_by_card.get(card["card_id"], [])) or []
        reviews = sorted(raw_reviews, key=lambda item: int(item.get("id", 0)))
        card["reviews"] = reviews
        card["review_count"] = len(reviews)
        card["review_days"] = len(
            {
                dt.datetime.fromtimestamp(int(review["id"]) / 1000, LOCAL_TZ).date().isoformat()
                for review in reviews
                if review.get("id")
            }
        )
        card["last_review_ms"] = int(reviews[-1]["id"]) if reviews else 0
        card["last_review"] = (
            dt.datetime.fromtimestamp(card["last_review_ms"] / 1000, LOCAL_TZ).date().isoformat()
            if card["last_review_ms"]
            else ""
        )
        card["last_rating"] = int(reviews[-1].get("ease", 0)) if reviews else 0
        card["state"] = derive_state(card)
        card["record_id"] = record_id_from_source(card["source_key"])
        if card["record_id"] and card["record_id"] not in record_index:
            raise ValueError(f"Anki Source 映射到了不存在的工作台记录: {card['record_id']}")
        for review in reviews:
            flat_reviews.append({"card": card, **review})

    return {
        "captured_at": now_local().isoformat(timespec="seconds"),
        "deck_map": {display_deck(str(name)): int(deck_id) for name, deck_id in deck_map.items()},
        "cards": cards,
        "reviews": flat_reviews,
        "record_index": record_index,
    }


def count_cards(cards: list[dict[str, Any]]) -> Counter[str]:
    result: Counter[str] = Counter()
    for card in cards:
        queue = card["queue"]
        if queue == 0 and not card["reviews"]:
            result["新卡"] += 1
        elif queue < 0:
            result["暂停/隐藏"] += 1
        elif card["state"] == "待回看":
            result["待回看"] += 1
        elif card["state"] == "稳定":
            result["稳定"] += 1
        else:
            result["学习中"] += 1
    return result


def summarize_cards(cards: list[dict[str, Any]]) -> dict[str, Any]:
    counters = count_cards(cards)
    ratings = Counter(RATING_NAMES.get(int(review.get("ease", 0)), "未知") for card in cards for review in card["reviews"])
    today = now_local().date()
    windows = {}
    for days in (1, 7, 30):
        start = today - dt.timedelta(days=days - 1)
        windows[str(days)] = sum(
            1
            for review in (review for card in cards for review in card["reviews"])
            if review.get("id")
            and dt.datetime.fromtimestamp(int(review["id"]) / 1000, LOCAL_TZ).date() >= start
        )
    return {
        "total_cards": len(cards),
        "states": counters,
        "ratings": ratings,
        "reviews_windows": windows,
        "review_count": sum(card["review_count"] for card in cards),
        "reviewed_cards": sum(bool(card["reviews"]) for card in cards),
        "mapped_cards": sum(bool(card["record_id"]) for card in cards),
        "mapped_reviewed_cards": sum(bool(card["record_id"] and card["reviews"]) for card in cards),
    }


def deck_summaries(cards: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    direct: dict[str, list[dict[str, Any]]] = defaultdict(list)
    roots: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for card in cards:
        direct[card["deck"]].append(card)
        roots[card["root"]].append(card)

    def row(name: str, group: list[dict[str, Any]]) -> dict[str, Any]:
        stats = summarize_cards(group)
        return {"name": name, **stats}

    direct_rows = [row(name, group) for name, group in sorted(direct.items()) if name.split("::", 1)[0] not in DEFAULT_ROOTS]
    root_rows = [row(name, group) for name, group in sorted(roots.items()) if name not in DEFAULT_ROOTS]
    return root_rows, direct_rows


def update_mapped_records(snapshot: dict[str, Any]) -> list[str]:
    by_record: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for card in snapshot["cards"]:
        if card["record_id"] and card["reviews"]:
            by_record[card["record_id"]].append(card)
    changed: list[str] = []
    for record_id, cards in sorted(by_record.items()):
        path = snapshot["record_index"][record_id]
        original = path.read_text(encoding="utf-8")
        fields, _, _ = parse_frontmatter(original)
        latest = max(cards, key=lambda card: card["last_review_ms"])
        review_count = sum(card["review_count"] for card in cards)
        review_days = len({card["last_review"] for card in cards if card["last_review"]})
        all_stable = all(card["state"] == "稳定" for card in cards)
        needs_review = any(card["state"] == "待回看" for card in cards)
        current_mastery = fields.get("mastery", "未学")
        rank = {"未学": 0, "学过": 1, "掌握": 2}
        target_mastery = current_mastery
        if rank.get(current_mastery, 0) < rank["学过"]:
            target_mastery = "学过"
        if all_stable and rank.get(current_mastery, 0) < rank["掌握"]:
            target_mastery = "掌握"
        changes = {
            "mastery": target_mastery,
            "review_flag": "待回看" if needs_review else "已回看",
            "last_studied": latest["last_review"],
            "anki_state": "稳定" if all_stable else ("待回看" if needs_review else "学习中"),
            "anki_reviews": str(review_count),
            "anki_review_days": str(review_days),
            "anki_last_rating": RATING_NAMES.get(latest["last_rating"], "未知"),
            "anki_interval_days": str(max(card["interval"] for card in cards)),
            "anki_last_review": latest["last_review"],
            "anki_deck": latest["deck"],
            "anki_synced_at": snapshot["captured_at"],
        }
        updated = update_frontmatter(original, changes)
        if updated != original:
            atomic_write(path, updated)
            changed.append(str(path.relative_to(VAULT)))
    return changed


def markdown_table(rows: list[dict[str, Any]], columns: list[tuple[str, str]]) -> str:
    if not rows:
        return "暂无数据。\n"
    header = "| " + " | ".join(label for label, _ in columns) + " |\n"
    separator = "| " + " | ".join("---" for _ in columns) + " |\n"
    body = "".join(
        "| " + " | ".join(str(row.get(key, 0)).replace("|", "\\|") for _, key in columns) + " |\n"
        for row in rows
    )
    return header + separator + body


def build_report(snapshot: dict[str, Any]) -> str:
    cards = snapshot["cards"]
    summary = summarize_cards(cards)
    root_rows, deck_rows = deck_summaries(cards)
    weak = sorted(
        [card for card in cards if card["reviews"] and card["state"] == "待回看"],
        key=lambda card: (card["last_review_ms"], card["deck"], card["question"]),
        reverse=True,
    )[:30]
    candidates = sorted(
        [card for card in cards if card["state"] == "稳定"],
        key=lambda card: (card["record_id"] is None, card["deck"], card["question"]),
    )[:30]
    ratings = ", ".join(f"{name} {summary['ratings'].get(name, 0)}" for name in ("Again", "Hard", "Good", "Easy"))
    lines = [
        "---\n",
        "title: Anki学习状态\n",
        "tags:\n",
        "  - workbench\n",
        "  - anki\n",
        "created: 2026-08-14\n",
        "type: dashboard\n",
        "summary: 根据 Anki 复习证据更新嵌入式学习状态。\n",
        f"updated_at: {snapshot['captured_at']}\n",
        "---\n\n",
        "# Anki 学习状态\n\n",
        f"> [!info] 最近成功读取：{snapshot['captured_at']}。Anki 卡片状态从真实复习记录计算；没有复习记录的卡仍保持“新卡”。\n\n",
        "## 总览\n\n",
        markdown_table(
            [
                {
                    "卡片总数": summary["total_cards"],
                    "新卡": summary["states"].get("新卡", 0),
                    "学习中": summary["states"].get("学习中", 0),
                    "待回看": summary["states"].get("待回看", 0),
                    "稳定": summary["states"].get("稳定", 0),
                    "复习次数": summary["review_count"],
                }
            ],
            [("卡片总数", "卡片总数"), ("新卡", "新卡"), ("学习中", "学习中"), ("待回看", "待回看"), ("稳定", "稳定"), ("复习次数", "复习次数")],
        ),
        f"\n评分：{ratings}。近 1/7/30 天复习：{summary['reviews_windows']['1']} / {summary['reviews_windows']['7']} / {summary['reviews_windows']['30']}。\n\n",
        "## 按根卡组\n\n",
        markdown_table(
            [
                {
                    **row,
                    "new_cards": row["states"].get("新卡", 0),
                    "learning_cards": row["states"].get("学习中", 0),
                    "pending_cards": row["states"].get("待回看", 0),
                    "stable_cards": row["states"].get("稳定", 0),
                }
                for row in root_rows
            ],
            [
                ("卡组", "name"),
                ("卡片", "total_cards"),
                ("新卡", "new_cards"),
                ("学习中", "learning_cards"),
                ("待回看", "pending_cards"),
                ("稳定", "stable_cards"),
                ("复习次数", "review_count"),
                ("映射工作台", "mapped_cards"),
            ],
        ),
        "\n> 根卡组包含其子卡组；糯叽叽等未唯一映射的卡片只在 Anki 汇总中统计。\n\n",
        "## 按子卡组\n\n",
        markdown_table(
            [
                {
                    **row,
                    "states": ", ".join(f"{k} {v}" for k, v in row["states"].items()),
                }
                for row in deck_rows
            ],
            [("卡组", "name"), ("卡片", "total_cards"), ("状态分布", "states"), ("复习次数", "review_count"), ("映射工作台", "mapped_cards")],
        ),
        "\n## 待回看卡片\n\n",
    ]
    if weak:
        lines.append("| 卡组 | 题目 | 最近评分 | 最近复习 | 工作台映射 |\n| --- | --- | --- | --- | --- |\n")
        for card in weak:
            lines.append(
                f"| {card['deck']} | {card['question'].replace('|', '\\|')} | {RATING_NAMES.get(card['last_rating'], '未知')} | {card['last_review']} | {card['record_id'] or '仅 Anki 汇总'} |\n"
            )
    else:
        lines.append("暂无已复习且需要回看的卡片。\n")
    lines.append("\n## 稳定卡片 / 掌握候选\n\n")
    if candidates:
        lines.append("| 卡组 | 题目 | 复习次数 | 间隔 | 工作台映射 |\n| --- | --- | ---: | ---: | --- |\n")
        for card in candidates:
            lines.append(
                f"| {card['deck']} | {card['question'].replace('|', '\\|')} | {card['review_count']} | {card['interval']} 天 | {card['record_id'] or '仅 Anki 汇总'} |\n"
            )
    else:
        lines.append("目前没有达到保守掌握阈值的卡片。\n")
    lines.extend(
        [
            "\n## 同步边界\n\n",
            "- 只读 Anki 复习证据，不修改卡片、评分、卡组或答案。\n",
            "- 高频 150 和项目八股按 Source 题号回写现有条目；糯叽叽及其他无法唯一映射的卡组只在本页汇总。\n",
            "- `掌握` 仍是保守判定：至少 3 次复习、跨 2 天、间隔至少 21 天，且最近两次为 Good/Easy。\n",
        ]
    )
    return "".join(lines)


def append_log(ok: bool, message: str, changed: int = 0) -> None:
    if LOG_PATH.exists():
        content = LOG_PATH.read_text(encoding="utf-8")
    else:
        content = (
            "---\n"
            "title: Anki同步日志\n"
            "tags:\n"
            "  - workbench\n"
            "  - anki\n"
            "created: 2026-08-14\n"
            "type: append-only-log\n"
            "summary: Anki学习状态自动同步的机器日志。\n"
            "---\n\n"
            "# Anki 同步日志\n\n"
        )
    stamp = now_local().isoformat(timespec="seconds")
    status = "成功" if ok else "跳过/失败"
    content += f"- `{stamp}` · {status} · {message} · 更新记录 {changed}\n"
    atomic_write(LOG_PATH, content)


def run_self_test() -> int:
    assert record_id_from_source("嵌入式高频八股150题.md#L202:1") == "150-001"
    assert record_id_from_source("1. 项目八股/RTOS高频面试题.md#L23:A0") == "project-rtos-A0"
    assert record_id_from_source("1. 项目八股/linux视觉感知面试题.md#L63:Q01") == "project-vision-Q01"
    assert record_id_from_source("1. 项目八股/Linux物理内存碎片高频面试题.md#L74:1") == "project-memory-001"
    base = {"queue": 0, "interval": 0, "is_due": False, "reviews": [], "review_days": 0}
    assert derive_state(base) == "新卡"
    one = {**base, "reviews": [{"id": 1, "ease": 3}], "review_days": 1, "interval": 1}
    assert derive_state(one) == "学习中"
    stable = {
        **base,
        "reviews": [{"id": 1, "ease": 3}, {"id": 2, "ease": 3}, {"id": 3, "ease": 4}],
        "review_days": 2,
        "interval": 21,
    }
    assert derive_state(stable) == "稳定"
    weak = {**stable, "reviews": stable["reviews"][:-1] + [{"id": 3, "ease": 1}], "is_due": True}
    assert derive_state(weak) == "待回看"
    print(json.dumps({"ok": True, "checks": 8}, ensure_ascii=False))
    return 0


def run_probe() -> int:
    version = anki("version")
    decks = anki("deckNames") or []
    print(json.dumps({"ok": True, "anki_connect_version": version, "decks": [display_deck(str(deck)) for deck in decks]}, ensure_ascii=False))
    return 0


def run_sync(sync_first: bool) -> int:
    if sync_first:
        anki("sync")
    snapshot = fetch_snapshot()
    report = build_report(snapshot)
    changed = update_mapped_records(snapshot)
    atomic_write(REPORT_PATH, report)
    append_log(True, f"读取 {len(snapshot['cards'])} 张卡，复习 {len(snapshot['reviews'])} 次", len(changed))
    summary = summarize_cards(snapshot["cards"])
    output = {
        "ok": True,
        "captured_at": snapshot["captured_at"],
        "cards": len(snapshot["cards"]),
        "reviews": len(snapshot["reviews"]),
        "states": dict(summary["states"]),
        "mapped_cards": summary["mapped_cards"],
        "changed_records": len(changed),
        "report": str(REPORT_PATH.relative_to(VAULT)),
    }
    print(json.dumps(output, ensure_ascii=False))
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="运行离线规则测试")
    parser.add_argument("--probe", action="store_true", help="只读测试 AnkiConnect 连接")
    parser.add_argument("--sync-first", action="store_true", help="先调用 AnkiConnect sync，再读取")
    parser.add_argument("--report-only", action="store_true", help="读取并生成工作台报告，不触发 AnkiWeb 同步")
    args = parser.parse_args(argv)
    try:
        if args.self_test:
            return run_self_test()
        if args.probe:
            return run_probe()
        return run_sync(sync_first=args.sync_first)
    except (AnkiError, OSError, ValueError, KeyError) as exc:
        message = str(exc)
        if not args.self_test:
            try:
                append_log(False, message)
            except OSError:
                pass
        print(json.dumps({"ok": False, "error": message}, ensure_ascii=False), file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
