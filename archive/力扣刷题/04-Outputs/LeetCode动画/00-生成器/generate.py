#!/usr/bin/env python3
"""Generate the 100 LeetCode learning animations from the source note.

The source note remains read-only.  Each generated page is a small HTML shell
that loads the shared engine and carries the exact YXC code plus a deterministic
learning trace.  The trace intentionally highlights the invariant-changing
moments instead of animating every punctuation mark.
"""

from __future__ import annotations

import html
import json
import re
import shutil
from urllib.parse import quote
from pathlib import Path

VAULT = Path('/Users/zhaowenqiang/Library/Mobile Documents/iCloud~md~obsidian/Documents/qianrushi')
SOURCE = VAULT / 'archive/力扣刷题/01-Raw/04-Hot100两周速通-yxc简洁代码.md'
WIKI = VAULT / 'archive/力扣刷题/02-Wiki/题目详解'
OUT = VAULT / 'archive/力扣刷题/04-Outputs/LeetCode动画'
ASSET = OUT / '00-生成器'


def clean_md(value: str) -> str:
    value = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', value)
    value = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', value)
    value = re.sub(r'\[\[([^\]]+)\]\]', r'\1', value)
    value = value.replace('**', '').replace('`', '')
    value = re.sub(r'^\s*[-*]\s*', '', value, flags=re.M)
    value = re.sub(r'\s+', ' ', value).strip()
    return value


def section(block: str, heading: str) -> str:
    found = re.search(re.escape(heading) + r'\s*\n(.*?)(?=\n#### |\Z)', block, re.S)
    return found.group(1).strip() if found else ''


def markdown_html(markdown: str) -> str:
    """Small safe renderer for the official-question drawer.

    The local Wiki notes are the captured LeetCode statement plus its examples
    and constraints.  We keep the text intact, but render only the Markdown
    constructs needed for readable offline HTML.
    """
    lines = markdown.strip().splitlines()
    out: list[str] = []
    in_code = False
    code_lines: list[str] = []
    list_open = False
    for raw in lines:
        line = raw.rstrip()
        if line.startswith('```'):
            if in_code:
                out.append('<pre><code>' + html.escape('\n'.join(code_lines)) + '</code></pre>')
                code_lines = []
                in_code = False
            else:
                if list_open:
                    out.append('</ul>'); list_open = False
                in_code = True
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line.strip():
            if list_open:
                out.append('</ul>'); list_open = False
            continue
        if line.strip() in {'---', '***', '___'}:
            if list_open:
                out.append('</ul>'); list_open = False
            continue
        if line.startswith('- '):
            if not list_open:
                out.append('<ul>'); list_open = True
            content = line[2:]
            content = html.escape(content)
            content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
            content = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', content)
            out.append('<li>' + content + '</li>')
            continue
        if list_open:
            out.append('</ul>'); list_open = False
        content = html.escape(line)
        content = re.sub(r'`([^`]+)`', r'<code>\1</code>', content)
        content = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', content)
        out.append('<p>' + content + '</p>')
    if list_open:
        out.append('</ul>')
    if in_code:
        out.append('<pre><code>' + html.escape('\n'.join(code_lines)) + '</code></pre>')
    return ''.join(out)


def parse_source() -> list[dict]:
    text = SOURCE.read_text()
    heads = list(re.finditer(r'^### (\d+)\. (.+?)（LeetCode (\d+) · (Easy|Medium|Hard)）$', text, re.M))
    entries = []
    day = ''
    for index, match in enumerate(heads):
        prefix = text[:match.start()]
        day_match = list(re.finditer(r'^## (Day .*?)$', prefix, re.M))
        day = day_match[-1].group(1) if day_match else day
        end = heads[index + 1].start() if index + 1 < len(heads) else len(text)
        block = text[match.end():end]
        code_match = re.search(r'#### YXC 最终代码\s*\n```[^\n]*\n(.*?)\n```', block, re.S)
        code = code_match.group(1).rstrip() if code_match else ''
        wiki_candidates = sorted(WIKI.glob(f'{int(match.group(3))}-*.md'))
        official_raw = ''
        leetcode_url = f'https://leetcode.cn/problems/'
        if wiki_candidates:
            wiki_text = wiki_candidates[0].read_text()
            official_match = re.search(r'## 题目描述\s*\n(.*?)(?=\n## |\Z)', wiki_text, re.S)
            official_raw = official_match.group(1).strip() if official_match else ''
            link = re.search(r'\*\*LeetCode 题目：\*\* \[打开题目\]\(([^)]+)\)', wiki_text)
            if link:
                leetcode_url = link.group(1)
        entries.append({
            'order': index + 1,
            'id': int(match.group(3)),
            'title': match.group(2),
            'difficulty': match.group(4),
            'day': day,
            'code': code,
            'thought': clean_md(section(block, '#### 解题思路')),
            'pitfalls': clean_md(section(block, '#### 易错点')),
            'officialHtml': markdown_html(official_raw) if official_raw else '<p>题面暂未归档，请打开官方链接查看。</p>',
            'leetcodeUrl': leetcode_url,
        })
    if len(entries) != 100:
        raise RuntimeError(f'expected 100 questions, parsed {len(entries)}')
    return entries


# The animation mode is a vocabulary, not a second solution.  Every mode keeps
# the actual source code and explanation visible while tracing its central
# invariant.  This makes the 100 pages consistent without pretending that every
# brace deserves a cinematic transition.
MODES = {
    1:'hash',49:'hash-group',128:'hash-run',283:'two-ptr',11:'two-ptr',15:'two-ptr',42:'two-ptr',
    3:'window',438:'window',560:'prefix',239:'mono-deque',76:'window',53:'dp1d',56:'interval',
    189:'array',238:'prefix',41:'array',73:'grid',54:'grid',48:'grid',240:'matrix-search',
    160:'linked',206:'linked',234:'linked',141:'cycle',142:'cycle',21:'linked',2:'linked',19:'linked',24:'linked',
    25:'linked',138:'linked',148:'linked',23:'heap',146:'lru',
    94:'tree',104:'tree',226:'tree',101:'tree',543:'tree',102:'tree',108:'tree',98:'tree',230:'tree',199:'tree',
    114:'tree',105:'tree',437:'tree',236:'tree',124:'tree',
    200:'grid',994:'grid-bfs',207:'graph',208:'trie',20:'stack',155:'stack',394:'stack',739:'mono-stack',84:'mono-stack',
    215:'heap',347:'heap',295:'heap',
    46:'backtrack',78:'backtrack',17:'backtrack',39:'backtrack',22:'backtrack',79:'backtrack',131:'backtrack',51:'backtrack',
    35:'binary',74:'binary',34:'binary',33:'binary',153:'binary',4:'binary',
    121:'greedy',55:'greedy',45:'greedy',763:'greedy',70:'dp1d',118:'dp2d',198:'dp1d',279:'dp1d',322:'dp1d',139:'dp1d',
    300:'dp1d',152:'dp1d',416:'dp1d',32:'dp1d',62:'dp2d',64:'dp2d',5:'dp2d',1143:'dp2d',72:'dp2d',
    136:'bit',169:'boyer',75:'two-ptr',31:'array',287:'cycle',
}


# Canonical small examples make the animation concrete.  `expected` is shown in
# the page and is also checked by the static audit generated below.
EXAMPLES = {
  1:('[2, 7, 11, 15], target = 9','indices [0, 1]'), 49:('[eat, tea, tan, ate, nat, bat]','3 组：{eat, tea, ate} / {tan, nat} / {bat}'),
  128:('[100, 4, 200, 1, 3, 2]','连续最长长度 = 4'), 283:('[0, 1, 0, 3, 12]','[1, 3, 12, 0, 0]'),
  11:('[1, 8, 6, 2, 5, 4, 8, 3, 7]','最大面积 = 49'), 15:('[-1, 0, 1, 2, -1, -4]','三元组：[-1,-1,2]、[-1,0,1]'),
  42:('[0,1,0,2,1,0,1,3,2,1,2,1]','接水总量 = 6'), 3:('s = "abcabcbb"','最长窗口长度 = 3'),
  438:('s = "cbaebabacd", p = "abc"','起点下标 [0, 6]'), 560:('[1,1,1], k = 2','子数组个数 = 2'),
  239:('[1,3,-1,-3,5,3,6,7], k = 3','[3,3,5,5,6,7]'), 76:('s = "ADOBECODEBANC", t = "ABC"','最小覆盖子串 = "BANC"'),
  53:('[-2,1,-3,4,-1,2,1,-5,4]','最大和 = 6'), 56:('[[1,3],[2,6],[8,10],[15,18]]','[[1,6],[8,10],[15,18]]'),
  189:('[1,2,3,4,5,6,7], k = 3','[5,6,7,1,2,3,4]'), 238:('[1,2,3,4]','[24,12,8,6]'),
  41:('[3,4,-1,1]','第一个缺失正数 = 2'), 73:('[[1,1,1],[1,0,1],[1,1,1]]','[[1,0,1],[0,0,0],[1,0,1]]'),
  54:('[[1,2,3],[4,5,6],[7,8,9]]','螺旋序列 [1,2,3,6,9,8,7,4,5]'), 48:('[[1,2,3],[4,5,6],[7,8,9]]','[[7,4,1],[8,5,2],[9,6,3]]'),
  240:('矩阵 + target = 5','找到 5 → true'), 160:('A=[4,1,8,4,5], B=[5,6,1]','相交节点值 = 8'),
  206:('[1,2,3,4,5]','[5,4,3,2,1]'), 234:('[1,2,2,1]','true'), 141:('[3,2,0,-4]，尾部回到下标 1','存在环 → true'),
  142:('[3,2,0,-4]，尾部回到下标 1','环入口值 = 2'), 21:('[1,2,4] + [1,3,4]','[1,1,2,3,4,4]'),
  2:('[2,4,3] + [5,6,4]','[7,0,8]'), 19:('[1,2,3,4,5], n = 2','[1,2,3,5]'), 24:('[1,2,3,4]','[2,1,4,3]'),
  25:('[1,2,3,4,5], k = 2','[2,1,4,3,5]'), 138:('7→null, 13→7, 11→1, 10→11, 1→7','复制后 random 关系保持'),
  148:('[4,2,1,3]','[1,2,3,4]'), 23:('[[1,4,5],[1,3,4],[2,6]]','[1,1,2,3,4,4,5,6]'),
  146:('put(1,1), put(2,2), get(1), put(3,3), get(2)','get 结果 [1,-1]，淘汰最久未用项'),
  94:('[1,null,2,3]','中序 [1,3,2]'), 104:('[3,9,20,null,null,15,7]','最大深度 = 3'), 226:('[4,2,7,1,3,6,9]','翻转后层序 [4,7,2,9,6,3,1]'),
  101:('[1,2,2,3,4,4,3]','对称 → true'), 543:('[1,2,3,4,5]','直径 = 3'), 102:('[3,9,20,null,null,15,7]','[[3],[9,20],[15,7]]'),
  108:('[-10,-3,0,5,9]','以 0 为根的平衡 BST'), 98:('[2,1,3]','合法 BST → true'), 230:('[3,1,4,null,2], k=1','第 k 小 = 1'),
  199:('[1,2,3,null,5,null,4]','右视图 [1,3,4]'), 114:('[1,2,5,3,4,null,6]','原地展开为 1→2→3→4→5→6'),
  105:('pre=[3,9,20,15,7], in=[9,3,15,20,7]','根 3，递归切分左右子树'), 437:('树根 10，target = 8','路径条数 = 3'),
  236:('树根 3，p = 5，q = 1','最近公共祖先 = 3'), 124:('树 [-10,9,20,null,null,15,7]','最大路径和 = 42'),
  200:('[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]','岛屿数量 = 3'), 994:('[[2,1,1],[1,1,0],[0,1,1]]','最少分钟 = 4'),
  207:('n=2, prerequisites=[[1,0]]','可以完成 → true'), 208:('insert apple, insert app, search app, startsWith ap','true, true'),
  20:('s = "([{}])"','括号有效 → true'), 155:('push(-2), push(0), push(-3), getMin(), pop()','最小值序列 [-3,-2]'), 394:('s = "3[a2[c]]"','解码 = "accaccacc"'),
  739:('[73,74,75,71,69,72,76,73]','[1,1,4,2,1,1,0,0]'), 84:('[2,1,5,6,2,3]','最大矩形面积 = 10'), 215:('[3,2,1,5,6,4], k=2','第 2 大 = 5'),
  347:('[1,1,1,2,2,3], k=2','高频元素 [1,2]'), 295:('依次加入 1, 2, 3','中位数依次 1, 1.5, 2'), 46:('[1,2,3]','6 个排列'), 78:('[1,2,3]','8 个子集'),
  17:('digits = "23"','ad, ae, af, bd, be, bf, cd, ce, cf'), 39:('candidates=[2,3,6,7], target=7','[[2,2,3],[7]]'), 22:('n = 3','5 个合法括号串'),
  79:('board + word = "ABCCED"','找到路径 → true'), 131:('s = "aab"','[[a,a,b],[aa,b]]'), 51:('n = 4','2 种皇后摆法'), 35:('[1,3,5,6], target=2','插入下标 = 1'),
  74:('矩阵 + target = 3','找到 3 → true'), 34:('[5,7,7,8,8,10], target=8','范围 [3,4]'), 33:('[4,5,6,7,0,1,2], target=0','下标 = 4'),
  153:('[3,4,5,1,2]','最小值 = 1'), 4:('[1,3] + [2]','中位数 = 2'), 121:('[7,1,5,3,6,4]','最大利润 = 5'),
  55:('[2,3,1,1,4]','可以到达末尾 → true'), 45:('[2,3,1,1,4]','最少跳数 = 2'), 763:('"ababcbacadefegdehijhklij"','分段长度 [9,7,8]'),
  70:('n = 5','方法数 = 8'), 118:('numRows = 5','第 5 行 [1,4,6,4,1]'), 198:('[2,7,9,3,1]','最大金额 = 12'),
  279:('n = 12','最少平方数 = 3'), 322:('coins=[1,2,5], amount=11','最少硬币 = 3'), 139:('s="leetcode", dict=["leet","code"]','可以拆分 → true'),
  300:('[10,9,2,5,3,7,101,18]','最长递增子序列长度 = 4'), 152:('[2,3,-2,4]','最大乘积 = 6'), 416:('[1,5,11,5]','可以分成等和 → true'),
  32:('s = "(()"','最长有效括号长度 = 2'), 62:('m=3, n=7','路径数 = 28'), 64:('[[1,3,1],[1,5,1],[4,2,1]]','最小路径和 = 7'),
  5:('s = "babad"','最长回文 = "bab" 或 "aba"'), 1143:('text1="abcde", text2="ace"','最长公共子序列长度 = 3'), 72:('word1="horse", word2="ros"','编辑距离 = 3'),
  136:('[4,1,2,1,2]','只出现一次 = 4'), 169:('[2,2,1,1,1,2,2]','多数元素 = 2'), 75:('[2,0,2,1,1,0]','排序后 [0,0,1,1,2,2]'),
  31:('[1,2,3]','下一个排列 = [1,3,2]'), 287:('[1,3,4,2,2]','重复数 = 2'),
}


MODE_COPY = {
    'hash': '先查 complement，再把当前值写入表；查询发生在写入之前，所以不会用同一个元素两次。',
    'hash-group': '把“属于同一组”的条件压缩成一个稳定 key，再让哈希表聚合同 key 元素。',
    'hash-run': '只有 num-1 不在集合里的数字才是序列起点；从起点延伸，避免重复扫描。',
    'two-ptr': '两个指针分别代表还没处理的边界；每次只移动不可能产生更优答案的一侧。',
    'window': '窗口右端负责探索，左端只在约束被破坏时收缩；窗口重新合法后更新答案。',
    'prefix': '把区间/子数组条件改写成两个前缀状态之间的关系，当前状态先查历史，再写入。',
    'mono-deque': '队列保持单调，过期元素从头部移除，较差候选从尾部淘汰。',
    'dp1d': 'dp[i] 保存“到当前位置为止的最优子答案”，当前值只从已经完成的状态转移。',
    'dp2d': '二维表格把两个维度的前缀状态显式摆出来，每个格子由左/上/左上状态转移。',
    'interval': '排序后只需维护当前合并段的右端；下一个区间重叠就扩张，否则结算上一段。',
    'array': '先把目标动作拆成原地可逆的小操作，再用指针/区间保持不变量。',
    'grid': '网格问题先固定边界和访问标记；一次 DFS/BFS 只负责覆盖一个连通区域。',
    'grid-bfs': '多源 BFS 按层扩散；队列中的每一层就是经过的分钟/距离。',
    'matrix-search': '从右上角（或左下角）出发，每次排除一整行或一整列。',
    'linked': '链表题只追踪少量指针；先保存 next，再改链接，避免丢失剩余链。',
    'cycle': '快慢指针把环转化为“相遇”；相遇后重新同步即可定位入口或验证存在性。',
    'heap': '堆顶始终保留当前最有价值/最小的候选，其他元素只需维护局部顺序。',
    'lru': '哈希表负责 O(1) 定位，双向链表负责 O(1) 调整最近使用顺序。',
    'tree': '递归函数的返回值携带子树答案；先明确“当前节点要向父节点汇报什么”。',
    'graph': '把依赖关系看成有向图；入度为零的节点可以先处理，处理后释放后继。',
    'trie': '公共前缀共享同一条路径，节点上的结束标记区分完整单词和前缀。',
    'stack': '栈保存尚未匹配/尚未结算的状态，后进先出正好对应题目的嵌套结构。',
    'mono-stack': '栈保持单调；一旦新元素破坏顺序，弹出的元素就找到了它的边界。',
    'backtrack': '路径是当前选择，撤销是恢复现场；每层只做一种选择并保证不重复。',
    'binary': '循环维护答案一定存在的区间；每次比较后丢掉一半，并保持边界不变量。',
    'greedy': '只保留对未来最有利的局部信息；当当前边界耗尽时做一次不可逆的选择。',
    'bit': '利用异或的交换律与自反性抵消成对元素，剩下的就是唯一状态。',
    'boyer': '候选人和计数相互抵消；当计数归零时重新选择候选人。',
}

MODE_ACTIONS = {
    'hash': ('查 complement', '先问“目标差值是否见过”，命中时立即返回；没命中才写入当前值。'),
    'hash-group': ('生成稳定 key', '排序/计数得到同一组的 key；把原字符串追加到 key 对应的桶。'),
    'hash-run': ('只从起点延伸', 'num-1 不存在才开始向右找 num+1、num+2；其余数字直接跳过。'),
    'two-ptr': ('比较两个边界', '比较两端当前值后，只移动不可能带来更优解的一侧，保留另一侧继续尝试。'),
    'window': ('扩展再收缩', '右端纳入新字符/元素；约束被破坏时移动左端，窗口恢复合法后更新答案。'),
    'prefix': ('查询历史前缀', '当前前缀状态先查询所需的历史状态，再把当前前缀计数写回哈希表。'),
    'mono-deque': ('维护单调队列', '去掉过期下标，再从尾部删除不可能成为最大值的候选，队首就是窗口答案。'),
    'dp1d': ('写入当前 dp', '从已完成的前一格/前几格转移，写入 dp[i]；这个状态以后只读不重算。'),
    'dp2d': ('填一格状态表', '当前格子只依赖已经计算过的邻居；填表顺序保证依赖先于使用。'),
    'interval': ('扩张或结算区间', '下一个区间与当前段重叠就扩张右端，否则把当前段结算并开启新段。'),
    'array': ('原地交换/翻转', '操作只改变当前区间，其他元素保持可解释；每一步都保留未处理区间。'),
    'grid': ('覆盖一个连通块', '发现未访问目标格就计数，并 DFS/BFS 标记所有相邻格，避免重复计数。'),
    'grid-bfs': ('按层扩散', '队列一层一层推进；本轮出队的节点共享同一个距离/分钟数。'),
    'matrix-search': ('排除一整行/列', '右上角比较后，目标更大就下移，目标更小就左移，每步排除一大片。'),
    'linked': ('保存 next 再改链', '先记住后继节点，再把当前链接接到新位置；最后返回题目要求的头节点。'),
    'cycle': ('让快慢指针相遇', 'slow 一步、fast 两步；相遇说明环结构存在，再按题目要求定位入口/结果。'),
    'heap': ('只保留堆顶候选', '每次插入后维护堆的局部顺序；堆顶直接代表当前第 k 大/最小/中位候选。'),
    'lru': ('同步哈希与链表', '哈希表 O(1) 找节点，双向链表 O(1) 把刚访问的节点移到头部。'),
    'tree': ('递归汇报子树', '先获得左右子树返回值，再决定当前节点向父节点汇报什么。'),
    'graph': ('释放入度为零节点', '处理一个节点后减少后继入度；新变成零的节点加入队列。'),
    'trie': ('沿公共前缀走路径', '每个字符对应一个子节点，单词结束标记只表示完整单词，不等于任意前缀。'),
    'stack': ('后进先出匹配', '左括号/未完成片段入栈；遇到闭合符时只和栈顶比较，顺序自然被验证。'),
    'mono-stack': ('弹出就结算', '新元素破坏单调性时，弹出的下标已经找到了右边界；栈顶给出左边界。'),
    'backtrack': ('选择—递归—撤销', '把候选加入路径，递归完成后恢复现场；同层选择顺序保证结果不重复。'),
    'binary': ('保留答案区间', '比较 mid 后丢掉一半不可能区域；循环结束时边界正好落在第一个满足条件的位置。'),
    'greedy': ('延长当前可达边界', '扫描区间内能到达的最远位置；边界耗尽才计数/做一次选择。'),
    'bit': ('让成对状态抵消', '异或满足交换律和 x^x=0，遍历后只留下没有配对的那一个。'),
    'boyer': ('候选与计数抵消', '遇到相同元素计数加一，不同元素减一；计数归零就重新选择候选人。'),
}


def line_for(code: str, *patterns: str) -> int:
    lines = code.splitlines() or ['']
    for pattern in patterns:
        for number, line in enumerate(lines, 1):
            if re.search(pattern, line):
                return number
    return min(1, len(lines))


def make_visual(mode: str, example: str, phase: int, total: int) -> dict:
    # Keep visual state deterministic and lightweight.  It is deliberately
    # abstract enough to fit arrays, trees, grids, and text in one panel.
    if mode in {'stack', 'mono-stack', 'mono-deque'}:
        return {'kind':'stack', 'label':'候选栈 / 单调结构', 'items':['底', f'候选状态 {phase + 1}', '顶']}
    if mode in {'dp1d', 'dp2d'}:
        return {'kind':'dp', 'label':'DP 状态表', 'rows':[['·', '已知', '·', '·'], ['·', f'当前 {phase + 1}', '←', '·'], ['·', '·', '·', '答案']]}
    if mode in {'grid', 'grid-bfs', 'matrix-search'}:
        return {'kind':'grid', 'label':'网格 / 矩阵', 'rows':[['□','□','□','□'],['□','●' if phase % 2 == 0 else '✓','→','□'],['□','↑','□','□']]}
    if mode in {'tree', 'graph', 'trie'}:
        return {'kind':'tree', 'label':'结构状态', 'root':'当前节点', 'children':['左/前驱', '右/后继'], 'active':phase + 1}
    if mode in {'linked', 'cycle'}:
        return {'kind':'list', 'label':'指针链', 'items':['A', 'B', 'C', 'D'], 'pointers':{'slow':'B' if phase % 2 else 'A','fast':'C' if phase % 2 else 'B'}}
    if mode in {'backtrack'}:
        return {'kind':'path', 'label':'递归路径', 'items':['选择', f'层 {phase + 1}', '撤销现场']}
    tokens = [x.strip() for x in re.split(r'[,，\s]+', example) if x.strip()][:10]
    if not tokens:
        tokens = ['输入', '状态', '答案']
    return {'kind':'tokens', 'label':'输入状态', 'items':tokens, 'pointer':phase % len(tokens), 'total':total}


def make_steps(item: dict, mode: str, example: str, expected: str) -> list[dict]:
    code = item['code']
    thought = item['thought'] or MODE_COPY.get(mode, '')
    first = line_for(code, r'\bfor\b', r'\bwhile\b', r'\bif\b', r'\breturn\b')
    operation = line_for(code, r'\bmap\b', r'unordered', r'\bset\b', r'\bpush', r'\bpop', r'\bheap', r'\bdp', r'\bnums\[')
    finish = line_for(code, r'\breturn\b')
    if finish == 1 and code.splitlines():
        finish = len(code.splitlines())
    count = 6
    steps = []
    def add(line, phase, title, body, kind='info', phase_index=None):
        steps.append({'line': line, 'phase': phase, 'title': title, 'body': body, 'kind': kind,
                      'visual': make_visual(mode, example, len(steps) if phase_index is None else phase_index, count)})
    add(first, '读题', '先把题目压缩成一个不变量', f'{thought[:260]}  动画只追踪决定正确性的状态变化。', 'info')
    add(operation, '建立状态', MODE_COPY.get(mode, '先建立当前状态，再让循环保持它。'), f'输入：{example}。先建立能被下一步复用的状态，而不是立刻追求答案。', 'setup')
    action_title, action_body = MODE_ACTIONS.get(mode, ('核心动作', '当前状态满足不变量，下一轮只需要增量更新。'))
    add(operation, '核心动作', action_title, action_body, 'compare')
    add(operation, '状态更新', '只改变一个关键状态', f'{action_body} 当前示例的目标结果是 {expected}；更新后，下一轮仍然能使用同一个不变量。', 'move')
    add(operation, '检查边界', '在循环出口读取答案', f'当没有更多候选时，保留下来的状态就是本题答案：{expected}。', 'check')
    add(finish, '返回', '返回正确的结果对象', f'返回 {expected}。记住：代码返回的是题目要求的结果，而不是辅助状态本身。', 'done')
    return steps


def build_problem(item: dict) -> dict:
    mode = MODES.get(item['id'], 'array')
    if item['id'] not in EXAMPLES:
        raise RuntimeError(f'missing example for LeetCode {item["id"]}')
    example, expected = EXAMPLES[item['id']]
    return {
        **item,
        'mode': mode,
        'example': example,
        'expected': expected,
        'modeCopy': MODE_COPY.get(mode, ''),
        'steps': make_steps(item, mode, example, expected),
    }


PAGE_TEMPLATE = '''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>LeetCode {id} · {title} · C++ 逐步动画</title>
  <style>__ENGINE_CSS__</style>
</head>
<body>
  <div id="boot-fallback" style="padding:24px;font-family:system-ui;color:#697174">动画正在加载…</div>
  <script id="problem-data" type="application/json">__PROBLEM_DATA__</script>
  <script>__ENGINE_JS__</script>
</body>
</html>
'''


def preview_note(item: dict) -> str:
    folder = f'{item["id"]}-{item["title"]}'
    # Obsidian accepts an absolute file iframe reliably; theme=auto makes the
    # artifact follow the host/system instead of a saved standalone preference.
    path = (OUT / folder / 'index.html').as_posix()
    # A fragment is friendlier to Obsidian's file iframe than a query string;
    # the engine reads it as an explicit host-following theme override.
    uri = 'file://' + quote(path, safe='/') + '#theme=auto'
    return f'''# LeetCode {item['id']} 动画 · Obsidian 预览\n\n'''+ \
        f'''本页承载同目录的 HTML 动画；每一步只突出帮助理解解法不变量的关键动作。\n\n'''+ \
        f'''<iframe title="LeetCode {item['id']} {item['title']} 动画" src="{uri}" style="width:100%;height:1500px;border:0;border-radius:14px;display:block;" loading="eager"></iframe>\n\n'''+ \
        f'''[在浏览器中打开独立 HTML]({uri.replace('#theme=auto','')})\n'''


def write_outputs(items: list[dict]) -> None:
    ASSET.mkdir(parents=True, exist_ok=True)
    # The engine assets are maintained next to this generator.  They are copied
    # from the literal strings below so every page can be opened offline.
    (ASSET / 'engine.js').write_text(ENGINE_JS)
    (ASSET / 'engine.css').write_text(ENGINE_CSS)
    for item in items:
        if item['id'] == 21:
            # Preserve the hand-tuned linked-list pilot as the visual reference.
            continue
        folder = OUT / f"{item['id']}-{item['title']}"
        folder.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(build_problem(item), ensure_ascii=False, separators=(',', ':'))
        # JSON is placed in a raw-text script element; HTML-escaping it would
        # turn C++ operators such as `<` into literal `&lt;` in the source code.
        # Escaping only the closing-script sequence keeps the payload valid.
        safe_payload = payload.replace('</', '<\\/')
        page = PAGE_TEMPLATE.replace('{id}', str(item['id'])).replace('{title}', item['title'])
        page = page.replace('__ENGINE_CSS__', ENGINE_CSS).replace('__PROBLEM_DATA__', safe_payload).replace('__ENGINE_JS__', ENGINE_JS)
        (folder / 'index.html').write_text(page)
        (folder / 'Obsidian预览.md').write_text(preview_note(item))

    lines = ['# Hot100 LeetCode 动画索引', '', '这些页面全部读取 `01-Raw/04-Hot100两周速通-yxc简洁代码.md` 的原始 YXC 代码；动画只放大决定理解的关键状态。每页顶部的“力扣官方题目”默认折叠，展开后在独立滚动区域阅读，不会遮挡动画和控制按钮。', '', '| # | 题目 | 难度 | 模式 | HTML | Obsidian |', '|---:|---|---|---|---|---|']
    for item in items:
        folder = f"{item['id']}-{item['title']}"
        lines.append(f"| {item['id']} | {item['title']} | {item['difficulty']} | `{MODES[item['id']]}` | [{folder}/index.html]({folder}/index.html) | [{folder}/Obsidian预览.md]({folder}/Obsidian预览.md) |")
    (OUT / 'README.md').write_text('\n'.join(lines) + '\n')


# Shared engine: CSS and JavaScript are deliberately boring and deterministic.
# The page data contains the exact source code and the trace cards; the engine
# only renders, controls, and audits them.
ENGINE_CSS = r'''
:root{--font-body:"iA Writer Quattro V",Inter,"PingFang SC",-apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif;--font-code:"iA Writer Mono V","Fira Code","SFMono-Regular",Menlo,Monaco,Consolas,monospace;--bg:rgba(247,246,243,.72);--surface:rgba(255,255,255,.62);--surface-strong:rgba(255,255,255,.82);--text:#24272a;--muted:#697174;--line:rgba(64,71,74,.16);--accent:#5f5cf5;--teal:#277d70;--orange:#c56d2b;--shadow:0 18px 48px rgba(45,50,56,.12)}
html[data-theme="dark"]{--bg:rgba(16,24,30,.78);--surface:rgba(23,36,43,.70);--surface-strong:rgba(28,44,52,.86);--text:#edf5f3;--muted:#a9bbb9;--line:rgba(223,239,237,.17);--accent:#9b98ff;--teal:#74d3bd;--orange:#f0b35a;--shadow:0 22px 60px rgba(0,0,0,.3)}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:var(--font-body);color:var(--text);background:radial-gradient(circle at 82% 7%,rgba(95,92,245,.14),transparent 30rem),radial-gradient(circle at 10% 92%,rgba(49,151,132,.12),transparent 26rem),var(--bg)}body{padding:24px}button,select,input{font:inherit;color:inherit}button,select{border:1px solid var(--line);background:var(--surface);border-radius:10px;padding:8px 12px;cursor:pointer}button:hover,select:hover{border-color:var(--accent)}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 42%,transparent);outline-offset:2px}.shell{max-width:1500px;margin:auto}.top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:16px}.eyebrow{font:700 11px/1.4 var(--font-code);letter-spacing:.13em;color:var(--accent);text-transform:uppercase}.title{font-size:clamp(24px,3vw,42px);margin:4px 0 6px;letter-spacing:-.04em}.subtitle{max-width:760px;color:var(--muted);line-height:1.65;margin:0}.top-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.pill{border:1px solid var(--line);border-radius:999px;padding:7px 11px;color:var(--muted);background:var(--surface)}.accent{color:var(--accent)}.problem-drawer{margin:0 0 16px;background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 28px rgba(45,50,56,.08);backdrop-filter:blur(18px) saturate(115%)}.problem-drawer summary{cursor:pointer;list-style:none;padding:12px 16px;color:var(--accent);font-weight:700}.problem-drawer summary::-webkit-details-marker{display:none}.problem-drawer summary::before{content:'▸';display:inline-block;margin-right:8px;transition:transform .2s}.problem-drawer[open] summary::before{transform:rotate(90deg)}.problem-copy{max-height:250px;overflow:auto;padding:0 18px 16px;border-top:1px solid var(--line);color:var(--muted);font-size:13px;line-height:1.65}.problem-copy p{margin:9px 0}.problem-copy ul{margin:8px 0;padding-left:22px}.problem-copy pre{padding:10px 12px;border-radius:9px;background:rgba(0,0,0,.06);overflow:auto;font:12px/1.5 var(--font-code)}.problem-copy code{padding:1px 4px;border-radius:4px;background:rgba(95,92,245,.10);font-family:var(--font-code)}.problem-link{float:right;font-size:11px;font-weight:500;color:var(--muted)}.grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:16px;align-items:start}.panel{background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow);backdrop-filter:blur(18px) saturate(115%);overflow:hidden}.panel-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:15px 18px;border-bottom:1px solid var(--line);font:700 12px/1.4 var(--font-code);letter-spacing:.08em;text-transform:uppercase}.panel-head small{font:500 11px/1.4 var(--font-body);letter-spacing:0;text-transform:none;color:var(--muted)}.trace{padding:18px}.lesson{background:linear-gradient(135deg,rgba(95,92,245,.14),rgba(39,125,112,.10));border:1px solid color-mix(in srgb,var(--accent) 23%,var(--line));border-radius:14px;padding:14px 16px;margin-bottom:16px}.lesson strong{display:block;margin-bottom:5px}.lesson p{margin:0;color:var(--muted);line-height:1.65}.visual{min-height:180px;border:1px solid var(--line);border-radius:14px;background:var(--surface-strong);padding:17px;margin-bottom:14px}.visual-label{font:700 11px/1.4 var(--font-code);color:var(--muted);letter-spacing:.09em;text-transform:uppercase;margin-bottom:15px}.tokens,.list-row,.stack-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.token,.node{min-width:54px;text-align:center;border:1px solid color-mix(in srgb,var(--accent) 35%,var(--line));background:color-mix(in srgb,var(--accent) 8%,var(--surface-strong));border-radius:10px;padding:12px 10px;position:relative}.token.active,.node.active{border-color:var(--orange);box-shadow:0 0 0 3px color-mix(in srgb,var(--orange) 18%,transparent);transform:translateY(-2px)}.arrow{color:var(--muted)}.tag{position:absolute;left:50%;transform:translateX(-50%);bottom:-19px;font:700 9px/1 var(--font-code);color:var(--orange);white-space:nowrap}.grid-vis{display:grid;grid-template-columns:repeat(4,minmax(35px,1fr));gap:7px;max-width:320px}.cell{border:1px solid var(--line);border-radius:8px;text-align:center;padding:11px;background:rgba(95,92,245,.07)}.cell.active{background:rgba(240,179,90,.24);border-color:var(--orange)}.tree-vis{text-align:center;max-width:360px;margin:auto}.tree-root{display:inline-block;border:1px solid var(--accent);border-radius:10px;padding:10px 15px;background:rgba(95,92,245,.10)}.tree-children{display:flex;justify-content:space-around;gap:30px;margin-top:25px}.tree-child{border:1px solid var(--line);border-radius:9px;padding:9px 12px;color:var(--muted)}.stack-vis{display:flex;flex-direction:column-reverse;gap:7px;align-items:center;max-width:170px}.stack-item{width:100%;text-align:center;border:1px solid var(--line);border-radius:8px;padding:9px;background:rgba(39,125,112,.10)}.stack-item:last-child{border-color:var(--orange)}.dp-vis{display:grid;grid-template-columns:repeat(4,minmax(42px,1fr));gap:7px;max-width:330px}.dp-cell{border:1px solid var(--line);border-radius:8px;text-align:center;padding:10px;background:rgba(39,125,112,.08)}.dp-cell.active{border-color:var(--accent);background:rgba(95,92,245,.18)}.step-card{border:1px solid var(--line);border-radius:14px;padding:15px 16px;background:var(--surface-strong)}.step-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:6px}.step-title{font-size:18px;font-weight:700}.phase{font:700 10px/1.4 var(--font-code);letter-spacing:.1em;color:var(--accent);text-transform:uppercase}.step-body{margin:0;line-height:1.7;color:var(--muted)}.controls{display:grid;grid-template-columns:auto auto auto 1fr auto auto;gap:8px;align-items:center;margin-top:14px}.controls input[type=range]{width:100%;accent-color:var(--accent)}.counter{font:700 11px/1.4 var(--font-code);color:var(--muted);white-space:nowrap}.code{padding:14px 0 0}.code-toolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:0 18px 12px;color:var(--muted);font-size:12px}.code-scroll{max-height:620px;overflow:auto;padding:4px 10px 14px 0}.code-line{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:2px 15px 2px 8px;font:12px/1.48 var(--font-code);white-space:pre;min-height:18px;color:var(--muted)}.code-line .no{text-align:right;color:color-mix(in srgb,var(--muted) 70%,transparent);user-select:none}.code-line.active{background:linear-gradient(90deg,rgba(240,179,90,.24),rgba(240,179,90,.04));box-shadow:inset 3px 0 var(--orange);color:var(--text)}.code-line.active .no{color:var(--orange)}.details{border-top:1px solid var(--line);padding:14px 18px}.details summary{cursor:pointer;color:var(--accent);font-weight:700}.details p{color:var(--muted);line-height:1.7}.foot{margin-top:14px;color:var(--muted);font-size:12px;text-align:center}@media(max-width:980px){body{padding:13px}.grid{grid-template-columns:1fr}.code-scroll{max-height:440px}.controls{grid-template-columns:auto auto auto 1fr}.controls select{grid-column:span 2}.top{display:block}.top-meta{justify-content:flex-start;margin-top:12px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
'''


ENGINE_JS = r'''
(() => {
  const data = JSON.parse(document.getElementById('problem-data').textContent);
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modeText = data.modeCopy || '每一步都只保留决定正确性的状态。';
  const themeKey = `leetcode-animation-theme-${data.id}`;
  const queryMode = new URLSearchParams(location.search).get('theme') || new URLSearchParams(location.hash.replace(/^#/, '')).get('theme');
  const valid = ['auto','light','dark'];
  const media = matchMedia('(prefers-color-scheme: light)');
  function detectHostTheme() {
    try {
      const roots = [window.parent?.document?.documentElement, window.parent?.document?.body].filter(Boolean);
      const classes = roots.map(node => String(node.className || '')).join(' ');
      if (/\btheme-dark\b|\bdark-mode\b/i.test(classes)) return 'dark';
      if (/\btheme-light\b|\blight-mode\b/i.test(classes)) return 'light';
      const raw = getComputedStyle(roots[0]).getPropertyValue('--background-primary').trim();
      const rgb = raw.match(/rgba?\(([^)]+)\)/i);
      if (rgb) {
        const values = rgb[1].split(',').slice(0, 3).map(Number);
        if (values.length === 3 && values.every(Number.isFinite)) {
          const luminance = (0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]) / 255;
          return luminance < 0.48 ? 'dark' : 'light';
        }
      }
    } catch (_) {}
    return null;
  }
  let savedTheme = ''; try { savedTheme = localStorage.getItem(themeKey) || ''; } catch (_) {}
  let themeMode = valid.includes(queryMode) ? queryMode : (valid.includes(savedTheme) ? savedTheme : 'auto');
  function setTheme(mode, persist = true) {
    themeMode = mode; document.documentElement.dataset.theme = mode === 'auto' ? (detectHostTheme() || (media.matches ? 'light' : 'dark')) : mode;
    const labels = {auto:['◌ 自动','切换主题（当前自动，跟随系统/宿主）'],light:['☀ 浅色','切换到暗色主题'],dark:['◐ 暗色','切换到自动主题']};
    const btn = $('theme-toggle'); if (btn) { btn.textContent = labels[mode][0]; btn.title = labels[mode][1]; btn.setAttribute('aria-label', labels[mode][1]); }
    if (persist && !valid.includes(queryMode)) { try { localStorage.setItem(themeKey, mode); } catch (_) {} }
  }
  document.body.innerHTML = `<main class="shell"><header class="top"><div><div class="eyebrow">C++ TRACE LAB · LEETCODE ${data.id}</div><h1 class="title">${esc(data.title)}</h1><p class="subtitle">每一步只追踪帮助理解 YXC 思路的关键状态：比较/选择什么、哪条指针或状态改变、为什么可以继续。</p></div><div class="top-meta"><span class="pill">${esc(data.difficulty)}</span><span class="pill">${esc(data.mode)}</span><span class="pill">${esc(data.day.replace(/^## /,''))}</span><button id="theme-toggle" type="button">◌ 自动</button></div></header><section class="grid"><section class="panel"><div class="panel-head"><span>解法动画 / TRACE</span><small id="step-kind">准备</small></div><div class="trace"><div class="lesson"><strong>先记住这一句</strong><p id="mode-copy"></p></div><div class="visual" id="visual"></div><div class="step-card"><div class="step-top"><span class="phase" id="phase"></span><span class="phase" id="step-index"></span></div><div class="step-title" id="step-title"></div><p class="step-body" id="step-body"></p></div><div class="controls"><button id="prev" type="button">← 上一步</button><button id="play" class="primary" type="button">▶ 播放</button><button id="next" type="button">下一步 →</button><input id="slider" aria-label="动画步骤" type="range" min="0" max="0" step="1" value="0"><span class="counter" id="counter"></span><button id="reset" type="button">重置</button></div></div><div class="details"><details><summary>完整题解中的易错点</summary><p id="pitfalls"></p></details></div></section><section class="panel code"><div class="panel-head"><span>YXC FINAL CODE / C++17</span><small>当前高亮：第 <span id="line-no">—</span> 行</small></div><div class="code-toolbar"><span>输入示例：<strong id="example"></strong></span><span>期望：<strong class="accent" id="expected"></strong></span></div><div class="code-scroll" id="code"></div></section></section><p class="foot">原始题解只读 · 关键状态优先 · 主题可自动跟随 Obsidian / 系统</p></main>`;
  $('mode-copy').textContent = modeText; $('example').textContent = data.example; $('expected').textContent = data.expected; $('pitfalls').textContent = data.pitfalls || '本题没有额外的易错点记录。';
  const codeLines = data.code.split('\n');
  const problemDrawer = document.createElement('details');
  problemDrawer.className = 'problem-drawer';
  problemDrawer.setAttribute('aria-label', '力扣官方题目');
  problemDrawer.innerHTML = `<summary>力扣官方题目（展开查看，不影响动画操作） <a class="problem-link" href="${esc(data.leetcodeUrl)}" target="_blank" rel="noreferrer">打开力扣原题 ↗</a></summary><div class="problem-copy">${data.officialHtml || '<p>题面暂未归档，请打开官方链接查看。</p>'}</div>`;
  document.querySelector('header.top').insertAdjacentElement('afterend', problemDrawer);
  const codeEl = $('code');
  const codeHtml = codeLines.map((line, i) => `<div class="code-line" data-line="${i+1}"><span class="no">${i+1}</span><span>${esc(line)}</span></div>`).join(''); codeEl.innerHTML = codeHtml;
  const steps = data.steps; let index = 0, timer = null;
  function renderVisual(v) {
    v = v || {kind:'tokens',label:'状态'}; let inner = '';
    if (v.kind === 'tokens') inner = `<div class="tokens">${(v.items||[]).map((x,i)=>`<div class="token ${i===v.pointer?'active':''}">${esc(x)}${i===v.pointer?'<span class="tag">当前</span>':''}</div>`).join('<span class="arrow">→</span>')}</div>`;
    else if (v.kind === 'list') inner = `<div class="list-row">${(v.items||[]).map((x,i)=>`<div class="node ${i===v.active?'active':''}">${esc(x)}</div>${i<v.items.length-1?'<span class="arrow">→</span>':''}`).join('')}</div><p class="step-body">slow = ${esc(v.pointers?.slow)} · fast = ${esc(v.pointers?.fast)}</p>`;
    else if (v.kind === 'stack') inner = `<div class="stack-vis">${(v.items||[]).map(x=>`<div class="stack-item">${esc(x)}</div>`).join('')}</div>`;
    else if (v.kind === 'grid') inner = `<div class="grid-vis">${(v.rows||[]).flat().map((x,i)=>`<div class="cell ${x==='●'||x==='✓'?'active':''}">${esc(x)}</div>`).join('')}</div>`;
    else if (v.kind === 'dp') inner = `<div class="dp-vis">${(v.rows||[]).flat().map((x,i)=>`<div class="dp-cell ${String(x).startsWith('当前')?'active':''}">${esc(x)}</div>`).join('')}</div>`;
    else if (v.kind === 'tree') inner = `<div class="tree-vis"><div class="tree-root">${esc(v.root)}</div><div class="tree-children"><div class="tree-child">${esc(v.children?.[0])}</div><div class="tree-child">${esc(v.children?.[1])}</div></div></div>`;
    else if (v.kind === 'path') inner = `<div class="tokens">${(v.items||[]).map(x=>`<div class="token">${esc(x)}</div>`).join('<span class="arrow">→</span>')}</div>`;
    return `<div class="visual-label">${esc(v.label||'状态')}</div>${inner}`;
  }
  function render() {
    const s = steps[index]; $('step-kind').textContent = s.kind; $('phase').textContent = s.phase; $('step-index').textContent = `${String(index+1).padStart(2,'0')} / ${steps.length}`; $('step-title').textContent = s.title; $('step-body').textContent = s.body; $('visual').innerHTML = renderVisual(s.visual); $('counter').textContent = `${index+1} / ${steps.length}`; $('slider').value = index; $('slider').max = steps.length-1; $('prev').disabled = index===0; $('next').disabled = index===steps.length-1; $('play').textContent = timer ? '⏸ 暂停' : '▶ 播放'; $('line-no').textContent = s.line;
    codeEl.querySelectorAll('.code-line').forEach(el => el.classList.toggle('active', Number(el.dataset.line)===s.line));
    const active = codeEl.querySelector('.active'); if (active) active.scrollIntoView({block:'nearest'});
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}render();}
  function next(){if(index<steps.length-1){index++;render();}else stop();}
  $('prev').onclick=()=>{stop();index=Math.max(0,index-1);render()}; $('next').onclick=()=>{stop();next()}; $('reset').onclick=()=>{stop();index=0;render()}; $('slider').oninput=e=>{stop();index=Number(e.target.value);render()}; $('play').onclick=()=>{if(timer){stop();return;}if(index===steps.length-1){index=0;}timer=setInterval(next,900);render()}; $('theme-toggle').onclick=()=>setTheme(themeMode==='auto'?'light':themeMode==='light'?'dark':'auto'); document.addEventListener('keydown',e=>{if(['INPUT','SELECT','BUTTON'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();stop();next()}if(e.key==='ArrowLeft'){e.preventDefault();stop();index=Math.max(0,index-1);render()}if(e.key===' '){e.preventDefault();$('play').click()}}); media.addEventListener('change',()=>{if(themeMode==='auto')setTheme('auto',false)}); setTheme(themeMode, false); render();
  window.__leetcodeAnimation = {data, audit:()=>({id:data.id, steps:steps.length, lineRange:steps.every(s=>s.line>=1&&s.line<=codeLines.length), expected:data.expected, finalStep:steps.at(-1)?.phase==='返回'})};
})();
'''


if __name__ == '__main__':
    parsed = parse_source()
    # The existing pilot is intentionally left in place as the gold-standard
    # linked-list page; every other page is generated by the shared engine.
    write_outputs(parsed)
    print(f'generated {len(parsed)-1} shared-engine pages + preserved LeetCode 21 pilot')
