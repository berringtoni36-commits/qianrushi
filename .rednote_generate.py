from __future__ import annotations

import re
import unicodedata
import argparse
from collections import Counter, defaultdict
from pathlib import Path

from rednote_format import format_source_notes, validate_source_notes


VAULT = Path(__file__).resolve().parent
ROOT = VAULT / '小红书（RedNote）' / '。。。。。。。'
BOOKMARKS = ROOT / '收藏（Bookmarks）'
LIKES = ROOT / '点赞（Likes）'
OUT = ROOT / '整理层'


def normalize(value: str) -> str:
    value = unicodedata.normalize('NFKC', value or '').lower()
    return re.sub(r'[^a-z0-9\u4e00-\u9fff]+', '', value)


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        return value[1:-1]
    return value


def parse_note(path: Path, source: str) -> dict:
    text = path.read_text(encoding='utf-8', errors='replace')
    frontmatter = ''
    body = text
    if text.startswith('---'):
        match = re.match(r'^---\n(.*?)\n---\n?', text, flags=re.S)
        if match:
            frontmatter = match.group(1)
            body = text[match.end():]

    def scalar(key: str) -> str:
        match = re.search(rf'^{re.escape(key)}:\s*(.*?)\s*$', frontmatter, flags=re.M)
        return unquote(match.group(1)) if match else ''

    tags = []
    tag_match = re.search(r'^tags:\s*\n((?:\s+-\s+.*\n?)*)', frontmatter, flags=re.M)
    if tag_match:
        tags = [unquote(m.group(1).strip()) for m in re.finditer(r'^\s*-\s+(.*?)\s*$', tag_match.group(1), flags=re.M)]

    resource_id = scalar('resourceId')
    if not resource_id:
        match = re.search(r' - ([0-9a-f]+)\.md$', path.name, flags=re.I)
        resource_id = match.group(1) if match else path.stem

    heading = re.search(r'^#[ \t]+(.+?)\s*$', body, flags=re.M)
    title = heading.group(1).strip() if heading else path.stem

    # Formatted notes put imported metadata in an information callout.  For
    # classification, reconstruct the old importer view (title + author /
    # album + actual article body) so a presentation-only pass does not move
    # notes between the curated categories.
    classify_body = body
    formatted_body = re.search(
        r'^## 正文\s*\n(.*?)(?=^## 评论\s*$|\n---\n\n原文：|\Z)',
        body,
        flags=re.M | re.S,
    )
    if formatted_body:
        author_value = scalar('author')
        synthetic = [f'# {title}']
        if author_value:
            synthetic.append(f'作者：{author_value}')
        synthetic.append(formatted_body.group(1))
        classify_body = '\n'.join(synthetic)

    body_clean = re.sub(r'!\[\[.*?\]\]', ' ', classify_body)
    body_clean = re.sub(r'^##\s+评论.*$', ' ', body_clean, flags=re.M | re.S)
    body_clean = re.sub(r'https?://\S+', ' ', body_clean)
    body_clean = re.sub(r'[#*_>`\[\](){}]', ' ', body_clean)
    body_clean = re.sub(r'\s+', ' ', body_clean).strip()

    return {
        'id': resource_id,
        'path': path,
        'source': source,
        'type': scalar('type'),
        'title': title,
        'author': scalar('author'),
        'url': scalar('url'),
        'tags': tags,
        'created': scalar('postCreatedAt'),
        'synced': scalar('syncedAt'),
        'body': body_clean,
        'raw_len': len(body_clean),
    }


def collect_notes() -> dict[str, dict]:
    by_id: dict[str, dict] = {}
    sources: dict[str, set[str]] = defaultdict(set)
    for source, directory in [('收藏', BOOKMARKS), ('点赞', LIKES)]:
        for path in sorted(directory.glob('*.md')):
            note = parse_note(path, source)
            sources[note['id']].add(source)
            # Prefer the bookmark copy as the canonical link; it is still only a link.
            if note['id'] not in by_id or source == '收藏':
                by_id[note['id']] = note
    for note_id, note in by_id.items():
        note['source_status'] = '+'.join(x for x in ['收藏', '点赞'] if x in sources[note_id])
        note['source_files'] = []
        for source, directory in [('收藏', BOOKMARKS), ('点赞', LIKES)]:
            for path in sorted(directory.glob(f'* - {note_id}.md')):
                note['source_files'].append((source, path))
    return by_id


EMBEDDED = ('嵌入式', '嵌入式软件', 'stm32', 'mcu', 'rtos', 'freertos', '单片机', '驱动', 'fpga', '裸机', 'linux', 'c语言', 'c++', 'cpp', '物联网', 'ota', 'uart', 'spi', 'i2c', 'can', 'lvgl', 'zephyr', 'esp32', 'esp-idf', 'arm', '音视频', '芯片', '嵌软', '硬件', '电子信息')
SKILL_TITLE = ('skill', 'skills', '技能', 'agent', 'prompt', 'sop', '工作流', '深挖项目', '吃透项目', '自动投简历', '面试复盘')
AI = ('ai', '人工智能', '大模型', 'gpt', 'chatgpt', 'codex', 'claude', 'deepwiki', 'deepseek', 'vibecoding', 'opencodex', 'ocr', 'agent')
JOB = ('实习', '秋招', '校招', '简历', '面试', 'offer', '求职', '就业', '薪资', '岗位', '面经', '八股')
CLEANUP = ('减肥', '瘦', '颈椎', '健康', '肿瘤', '癌', '餐', '租', '借钱', '车祸', '皮鞋', '麦当劳', '餐厅', '情感', '社死', '恋爱', '婚姻', '学姐消失', '同学借钱', '考研', '调剂', '考公', '农艺', '绩点', '期末', '导师杨昀')


def contains_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def contains_header(raw_text: str, terms: tuple[str, ...]) -> bool:
    """Match title/tag signals without treating `ota` as part of `quotafloat`."""
    raw_text = unicodedata.normalize('NFKC', raw_text or '').lower()
    for term in terms:
        term = unicodedata.normalize('NFKC', term or '').lower()
        if not term:
            continue
        if term.isascii():
            if re.search(rf'(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])', raw_text):
                return True
        elif term in raw_text:
            return True
    return False


def classify(note: dict) -> dict:
    title_norm = normalize(note['title'])
    header_norm = normalize(note['title'] + ' ' + ' '.join(note['tags']))
    header_raw = note['title'] + ' ' + ' '.join(note['tags'])
    body_norm = normalize(note['body'])
    skill_explicit = contains_any(title_norm, tuple(normalize(x) for x in SKILL_TITLE))
    skill_context = contains_any(title_norm, tuple(normalize(x) for x in ('codex', 'claude', 'obsidian', '面试', '简历', '科研', '项目', 'ai'))) and ('skill' in body_norm or '技能' in body_norm)
    # Use the title and imported tags as the primary signal. Body text often contains
    # incidental mentions (for example a generic AI note mentioning Linux in a comment),
    # which should not move an item into the embedded-systems stream.
    embedded = contains_header(header_raw, EMBEDDED)
    ai = contains_header(header_raw, AI + ('obsidian',))
    job = contains_header(header_raw, JOB)
    algorithm = contains_header(header_raw, ('leetcode', 'hot100', '算法题', '刷题', '力扣'))
    research = contains_header(header_raw, ('科研', '论文', '文献', 'zotero', '精读'))
    mac = contains_header(header_raw, ('mac', 'macbook', 'iphone', '键盘', '电脑', '桌面'))
    cleanup = contains_any(title_norm, tuple(normalize(x) for x in CLEANUP)) and not (skill_explicit or skill_context or (embedded and contains_any(title_norm, tuple(normalize(x) for x in ('嵌入式', 'linux', 'stm32', 'rtos', '单片机', '驱动')))))

    if skill_explicit or skill_context:
        primary = '常用 Skill 工具库'
        if contains_any(title_norm, tuple(normalize(x) for x in ('项目', '代码', '深挖', '吃透', '复现'))):
            subcategory = '项目理解与代码学习'
        elif contains_any(title_norm, tuple(normalize(x) for x in ('简历', '面试', '求职', '投递', '秋招', 'offer'))):
            subcategory = '简历、面试与求职'
        elif contains_any(title_norm, tuple(normalize(x) for x in ('obsidian', 'anki', '第二大脑', '笔记', '收藏夹'))):
            subcategory = 'Obsidian、Anki 与知识管理'
        elif research:
            subcategory = '科研、论文与文档处理'
        elif contains_any(title_norm, tuple(normalize(x) for x in ('codex', 'claude', 'agent', 'ai'))):
            subcategory = 'Codex、Claude 与通用 Agent'
        else:
            subcategory = '自动化与效率'
    elif embedded:
        primary = '嵌入式主线'
        if algorithm:
            subcategory = '算法与刷题'
        elif job:
            subcategory = '实习、校招与面试'
        elif contains_any(title_norm, tuple(normalize(x) for x in ('项目', '实战', '调试', '多线程', 'ota', '音视频', '日志'))):
            subcategory = '项目、实战与调试'
        else:
            subcategory = '学习路线与技术栈'
    elif ai:
        primary = '好玩的 AI'
        if contains_any(title_norm, tuple(normalize(x) for x in ('obsidian', '笔记', '第二大脑'))):
            subcategory = 'Obsidian 与 AI 组合玩法'
        elif contains_any(title_norm, tuple(normalize(x) for x in ('代码', 'coding', 'deepwiki', '开发', '编程'))):
            subcategory = 'AI 编程与代码阅读'
        elif research or contains_any(title_norm, tuple(normalize(x) for x in ('创作', 'ocr', '论文'))):
            subcategory = 'AI 科研与内容创作'
        elif contains_any(title_norm, tuple(normalize(x) for x in ('agent', '工作流', 'codex', 'claude'))):
            subcategory = 'Agent、工作流与开源项目'
        else:
            subcategory = '有趣的新工具'
    elif algorithm:
        primary = '辅助与其他内容'
        subcategory = '算法刷题'
    elif research:
        primary = '辅助与其他内容'
        subcategory = '科研与学习方法'
    elif mac:
        primary = '辅助与其他内容'
        subcategory = 'Mac 与效率工具'
    else:
        primary = '辅助与其他内容'
        subcategory = '健康、生活与其他'

    review = note['raw_len'] < 140 and not (skill_explicit or embedded or ai or algorithm or research or mac)
    if cleanup:
        value = '待清理'
        review = False
    elif review:
        value = '备查内容'
    elif primary in {'嵌入式主线', '常用 Skill 工具库'}:
        value = '核心精选'
    elif primary == '好玩的 AI' and (skill_explicit or skill_context or contains_any(title_norm, tuple(normalize(x) for x in ('开源', '代码', '工具', '插件')))):
        value = '核心精选'
    else:
        value = '备查内容'

    tags = []
    if embedded:
        tags.append('嵌入式')
    if skill_explicit or skill_context:
        tags.append('Skill')
    if ai:
        tags.append('AI')
    if job:
        tags.append('求职')
    if algorithm:
        tags.append('算法')
    if research:
        tags.append('科研')
    if not tags:
        tags.append('其他')

    title_clean = note['title'].replace('\n', ' ').strip()

    return {
        **note,
        'primary': primary,
        'subcategory': subcategory,
        'value': value,
        'review': review,
        'tags_inferred': tags,
        'purpose': f'用于{subcategory}的参考，围绕“{title_clean}”提供可回看的经验或工具线索。',
    }


def local_skills() -> list[dict]:
    records = []
    for base in [Path('/Users/zhaowenqiang/.codex/skills'), Path('/Users/zhaowenqiang/.agents/skills')]:
        if not base.exists():
            continue
        for path in sorted(base.rglob('SKILL.md')):
            name = path.parent.name
            rel = path.relative_to(base).as_posix()
            key = f'{name}::{rel}'
            if key not in {x['key'] for x in records}:
                records.append({'name': name, 'rel': rel, 'path': str(path), 'key': key})
    return records


ALIAS_PHRASES = {
    'zread': ('zread', 'deepwiki'),
    'cangjie-skill': ('蒸馏', 'distill'),
    'pdf2md-agent-skill': ('pdf word excel', 'markdown for agent', 'pdf转markdown'),
    'json-canvas': ('思维导图', '导图', 'canvas'),
    'project-deep-dive': ('深挖项目', '项目真正吃透', '模拟压力面', '业务价值'),
    'resume-deepdive': ('简历深挖', '简历项目', '简历复盘'),
    'nature-reader': ('论文精读', '文献阅读'),
    'nature-literature-pipeline': ('文献检索', '文献流水线'),
    'skill-creator': ('创建 skill', '写 skill', '制作 skill'),
    'skill-installer': ('安装 skill', 'skill 安装'),
    'collect-embedded-interview-articles': ('嵌入式八股', '嵌入式面经文章'),
}


def skill_status(note: dict, local: list[dict], repeat_counts: Counter) -> tuple[str, str]:
    text_norm = normalize(note['title'] + ' ' + note['body'])
    exact = []
    alias = []
    for record in local:
        name_norm = normalize(record['name'])
        if len(name_norm) >= 5 and name_norm in text_norm:
            exact.append(record['name'])
    for record in local:
        phrases = ALIAS_PHRASES.get(record['name'], ())
        if any(normalize(p) in text_norm for p in phrases):
            alias.append(record['name'])
    matches = list(dict.fromkeys(exact + alias))
    repeated = [name for name in matches if repeat_counts[name] > 1]
    suffix = f'；重复推荐×{max(repeat_counts[name] for name in repeated)}' if repeated else ''
    if exact:
        return '已安装可用' + suffix, '、'.join(exact)
    if alias:
        return '疑似已安装' + suffix, '、'.join(alias)
    # Explicit named products without a local match are more actionable than generic lists.
    explicit_name = bool(re.search(r'[A-Z][A-Za-z0-9+.-]{2,}|\bskillhot\b|\bworkbuddy\b', note['title']))
    return ('未安装' if explicit_name else '名称不明确'), '未在用户级 Skill 目录中找到明确匹配'


def link_for(note: dict) -> str:
    relative = note['path'].relative_to(VAULT).with_suffix('').as_posix()
    # A literal ``#`` in an imported filename is part of the filename, not an
    # Obsidian heading anchor.  Escape it so the generated wikilink opens the
    # note instead of searching for a nonexistent heading.
    relative = relative.replace('#', r'\#')
    title = note['title'].replace('|', '／').replace(']', '）').replace('[', '（')
    return f'[[{relative}|{title}]]'


def bullet(note: dict, extra: str = '') -> str:
    tags = '、'.join(note['tags_inferred'])
    review = '；需人工复核' if note['review'] else ''
    purpose = note['purpose'].replace('|', '／')
    return f'- **{note["value"]}** · {link_for(note)} · 用途：{purpose} · 来源：{note["source_status"]} · 标签：{tags}{review}{extra}'


def write_generated(path: Path, lines: list[str]) -> None:
    frontmatter = [
        '---',
        'rednoteFormatVersion: 1',
        'rednoteDocumentType: index',
        '---',
        '',
    ]
    path.write_text('\n'.join(frontmatter + lines).rstrip() + '\n', encoding='utf-8')


def write_category(path: Path, title: str, intro: str, notes: list[dict]) -> None:
    lines = [
        f'# {title}',
        '',
        '> [!info] 本页说明',
        f'> 本页收录 **{len(notes)}** 条独立内容；原始笔记位于同步目录，本页只提供导航。',
        '',
        intro,
        '',
    ]
    for subcat in sorted({n['subcategory'] for n in notes}):
        subset = [n for n in notes if n['subcategory'] == subcat]
        lines += [f'## {subcat}', '']
        for value in ['核心精选', '备查内容', '待清理']:
            valued = [n for n in subset if n['value'] == value]
            if valued:
                lines += [f'### {value}', '']
                lines.extend(bullet(n) for n in sorted(valued, key=lambda x: x['title'].lower()))
                lines.append('')
    write_generated(path, lines)


def recent_bookmarks(notes: list[dict], limit: int = 30) -> list[dict]:
    """Return the most recently synced bookmark notes for the quick entry."""
    bookmarks = [note for note in notes if note['source'] == '收藏']
    # ``syncedAt`` records when the sync plugin brought the note into the
    # Vault.  ISO-8601 timestamps sort correctly as strings, and the stable
    # resource ID keeps ties deterministic.  ``created`` is only a fallback
    # for legacy notes that predate the sync timestamp field.
    return sorted(
        bookmarks,
        key=lambda note: (
            note.get('synced') or note.get('created') or '',
            note.get('id') or '',
        ),
        reverse=True,
    )[:limit]


def recent_bullet(note: dict, position: int) -> str:
    synced = note.get('synced') or note.get('created') or '时间未知'
    author = note.get('author') or '作者未知'
    tags = '、'.join(note['tags'][:4]) if note.get('tags') else '无标签'
    return f'- **{position:02d}** · {link_for(note)} · 作者：{author} · 同步：`{synced}` · 标签：{tags}'


def write_recent_bookmarks(path: Path, notes: list[dict], limit: int = 30) -> None:
    recent = recent_bookmarks(notes, limit)
    lines = [
        '# 最新 30 条收藏',
        '',
        '> [!info] 实时快捷入口',
        f'> 当前显示收藏夹中最近同步进入 Vault 的 **{len(recent)}** 条内容。新收藏同步后会自动进入列表；超过 30 条的旧内容只从本页淘汰，原始笔记不会被删除。',
        '',
        '排序依据：`syncedAt`（同步进入 Vault 的时间）；缺少该字段的旧笔记才回退到 `postCreatedAt`。',
        '',
    ]
    if recent:
        lines.extend(recent_bullet(note, index) for index, note in enumerate(recent, start=1))
    else:
        lines.append('当前还没有可显示的收藏内容。')
    write_generated(path, lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='只检查原始文章和专辑索引，不写入')
    args = parser.parse_args()

    if args.check:
        errors = validate_source_notes(VAULT)
        if errors:
            print('\n'.join(errors))
            return 1
        print('rednote_source_validation=PASS')
        return 0

    # Format source notes before rebuilding the derived navigation.  The
    # operation is idempotent, so the Obsidian event listener settles after one
    # follow-up pass even when these files trigger modify events.
    format_source_notes(VAULT)
    notes = [classify(note) for note in collect_notes().values()]
    notes.sort(key=lambda x: (x['primary'], x['subcategory'], x['value'], x['title'].lower()))
    local = local_skills()
    skill_notes = [n for n in notes if 'Skill' in n['tags_inferred']]

    # Count local matches first, then annotate all Skill notes consistently.
    match_names = []
    for note in skill_notes:
        text_norm = normalize(note['title'] + ' ' + note['body'])
        for record in local:
            if len(normalize(record['name'])) >= 5 and normalize(record['name']) in text_norm:
                match_names.append(record['name'])
            elif any(normalize(p) in text_norm for p in ALIAS_PHRASES.get(record['name'], ())):
                match_names.append(record['name'])
    repeat_counts = Counter(match_names)
    for note in skill_notes:
        note['skill_status'], note['skill_match'] = skill_status(note, local, repeat_counts)

    OUT.mkdir(exist_ok=True)
    groups = defaultdict(list)
    for note in notes:
        groups[note['primary']].append(note)
    write_category(OUT / '01-嵌入式主线.md', '嵌入式主线', '围绕嵌入式学习、项目、实习与面试的内容。', groups['嵌入式主线'])
    write_category(OUT / '03-好玩的 AI.md', '好玩的 AI', '围绕 AI 工具、AI 编程、Agent、Obsidian 与有趣开源项目的内容。', groups['好玩的 AI'])
    write_category(OUT / '04-辅助与其他内容.md', '辅助与其他内容', '暂不属于两条主线，但可能对学习、工作或生活有帮助的内容。', groups['辅助与其他内容'])
    write_recent_bookmarks(OUT / '05-最新30条收藏.md', notes)

    skill_lines = [
        '# 常用 Skill 工具库', '',
        '这里单独整理小红书中提到的 Skill、Agent、Prompt、工作流和可复用工具。Skill 状态只按本机用户级目录中的 `SKILL.md` 做只读核对，不执行安装。', '',
        f'> 本页收录 {len(skill_notes)} 条包含 Skill 线索的独立内容。状态分为：已安装可用、疑似已安装、未安装、名称不明确。', '',
    ]
    for subcat in sorted({n['subcategory'] for n in skill_notes}):
        subset = [n for n in skill_notes if n['subcategory'] == subcat]
        skill_lines += [f'## {subcat}', '']
        for value in ['核心精选', '备查内容']:
            valued = [n for n in subset if n['value'] == value]
            if valued:
                skill_lines += [f'### {value}', '']
                for note in sorted(valued, key=lambda x: x['title'].lower()):
                    extra = f' · 本机状态：`{note["skill_status"]}` · 匹配：`{note["skill_match"]}`'
                    skill_lines.append(bullet(note, extra))
                skill_lines.append('')
    skill_lines += ['## 本机用户级 Skill 清单', '', f'> 共发现 {len(local)} 个 `SKILL.md`。以下是核对依据，不代表每个都与小红书笔记同名。', '']
    for record in local:
        skill_lines.append(f'- `{record["name"]}` · `{record["path"]}`')
    write_generated(OUT / '02-常用 Skill 工具库.md', skill_lines)

    flagged = [n for n in notes if n['value'] == '待清理' or n['review']]
    cleanup = [n for n in flagged if n['value'] == '待清理']
    review = [n for n in flagged if n['review']]
    audit_lines = [
        '# 待清理与人工复核', '',
        '本页只记录筛选建议，不执行删除或移动。`待清理`是明显偏离当前嵌入式与 AI 主线、过时或低信息量的候选；`需人工复核`表示正文较少或图片为主，自动判断不足。', '',
        f'统计：待清理 {len(cleanup)} 条；需人工复核 {len(review)} 条；两类可能重叠时以待清理为准。', '',
        '## 待清理候选', '',
    ]
    audit_lines.extend(bullet(n) for n in sorted(cleanup, key=lambda x: x['title'].lower()))
    audit_lines += ['', '## 需人工复核', '']
    audit_lines.extend(bullet(n) for n in sorted(review, key=lambda x: x['title'].lower()))
    write_generated(OUT / '99-待清理与人工复核.md', audit_lines)

    counts = Counter(n['primary'] for n in notes)
    values = Counter(n['value'] for n in notes)
    sources = Counter(n['source_status'] for n in notes)
    bookmark_count = len(list(BOOKMARKS.glob('*.md')))
    like_count = len(list(LIKES.glob('*.md')))
    duplicate_count = sum(1 for note in notes if note['source_status'] == '收藏+点赞')
    main_lines = [
        '# 小红书精选导航', '',
        '> [!info] 使用说明',
        '> 本页是非破坏性整理入口；原始同步笔记、专辑和媒体均保留在原目录。', '',
        '## 快速入口', '',
        '- [[小红书（RedNote）/。。。。。。。/整理层/01-嵌入式主线|嵌入式主线]]：MCU、RTOS、嵌入式 Linux、项目、实习与面试。',
        '- [[小红书（RedNote）/。。。。。。。/整理层/02-常用 Skill 工具库|常用 Skill 工具库]]：Skill、Agent、Prompt、工作流及本机状态核对。',
        '- [[小红书（RedNote）/。。。。。。。/整理层/03-好玩的 AI|好玩的 AI]]：AI 编程、开源工具、Obsidian AI 与有趣玩法。',
        '- [[小红书（RedNote）/。。。。。。。/整理层/04-辅助与其他内容|辅助与其他内容]]：Mac、算法、科研、学习和其他备查内容。',
        '- [[小红书（RedNote）/。。。。。。。/整理层/05-最新30条收藏|最新 30 条收藏]]：按同步进入 Vault 的时间倒序，实时保留最近 30 条。',
        '- [[小红书（RedNote）/。。。。。。。/整理层/99-待清理与人工复核|待清理与人工复核]]：只列候选，不删除原始笔记。', '',
        '## 当前统计', '',
        f'- 独立内容：**{len(notes)}** 条（收藏 {bookmark_count}、点赞 {like_count}；两者重复 {duplicate_count}）。',
        f'- 主分类：嵌入式 {counts["嵌入式主线"]}、Skill {counts["常用 Skill 工具库"]}、好玩的 AI {counts["好玩的 AI"]}、辅助与其他 {counts["辅助与其他内容"]}。',
        f'- 价值分层：核心精选 {values["核心精选"]}、备查内容 {values["备查内容"]}、待清理 {values["待清理"]}。',
        f'- Skill 线索：{len(skill_notes)} 条；本机用户级 Skill 清单：{len(local)} 个 `SKILL.md`。',
        f'- 来源状态：收藏 {sources["收藏"]}、点赞 {sources["点赞"]}、收藏+点赞 {sources["收藏+点赞"]}。', '',
        '## 使用规则', '',
        '- 先看“嵌入式主线”和“常用 Skill 工具库”的核心精选。',
        '- Skill 的“已安装可用”只表示本机找到明确的 `SKILL.md`；名称或功能相近但无法确认的标为“疑似已安装”。',
        '- 图片为主、正文不足的内容不会直接删除，而会进入人工复核。',
        '- 本整理层不移动或删除原始文件；文章格式由本地 RedNote Indexer 统一维护。', '',
        '## 原始入口', '',
        '- [[小红书（RedNote）/。。。。。。。/小红书内容总览.base|小红书内容总览]]',
        '- [[小红书（RedNote）/。。。。。。。/专辑（Albums）/好玩的 ai/专辑索引|原有小红书专辑（示例入口）]]',
    ]
    write_generated(OUT / '00-小红书精选导航.md', main_lines)

    print(f'generated={len(notes)} skill_notes={len(skill_notes)} local_skills={len(local)} cleanup={len(cleanup)} review={len(review)}')
    print('counts=' + repr(dict(counts)))
    print('values=' + repr(dict(values)))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
