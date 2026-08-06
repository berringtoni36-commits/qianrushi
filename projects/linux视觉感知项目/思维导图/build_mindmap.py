"""Build the Linux vision project review mind map.

The tree is deliberately kept in one place and rendered into Markdown, SVG,
and PNG so that the XMind import source and the preview image cannot drift
apart.  The only project interview "八股" source is the 3.2–3.8 range in
原作者学习指南.md; the RTOS interview file is never read.
"""

from __future__ import annotations

import argparse
import html
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Sequence


ROOT_TITLE = "Linux视觉感知项目｜快速复习思维导图"
GUIDE_NAME = "原作者学习指南.md"
OUTPUT_DIR_NAME = "思维导图"


@dataclass
class Node:
    label: str
    kind: str = "normal"
    children: list["Node"] = field(default_factory=list)


@dataclass
class Placement:
    node: Node
    depth: int
    parent: int | None
    x: int
    y: int
    width: int
    height: int
    lines: list[str]
    font_size: int


def N(label: str, *children: Node, kind: str = "normal") -> Node:
    return Node(label=label, kind=kind, children=list(children))


def _strip_markdown(value: str) -> str:
    value = value.strip()
    value = re.sub(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", "", value)
    value = re.sub(r"^\s*>\s?", "", value)
    value = re.sub(r"!\[([^]]*)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", value)
    value = value.replace("**", "").replace("__", "")
    value = value.replace("`", "")
    value = value.replace("&nbsp;", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip(" |")


def _split_facts(line: str) -> list[str]:
    """Split long source sentences without rewriting their wording."""

    if re.match(r"^\|?\s*:?-{3,}\s*(\|\s*:?-{3,}\s*)+\|?$", line.strip()):
        return []
    line = _strip_markdown(line)
    if not line or line in {"---", "|---|---|---|", "|---|---|"}:
        return []
    if line.startswith("|") and line.endswith("|"):
        cells = [_strip_markdown(cell) for cell in line.strip("|").split("|")]
        cells = [cell for cell in cells if cell]
        return ["｜".join(cells)] if cells else []
    if len(line) <= 72:
        return [line]

    pieces = re.split(r"(?<=[。；！？])", line)
    result: list[str] = []
    for piece in pieces:
        piece = piece.strip()
        if not piece:
            continue
        if len(piece) <= 72:
            result.append(piece)
            continue
        subpieces = re.split(r"(?<=[，、：])", piece)
        current = ""
        for subpiece in subpieces:
            if not subpiece:
                continue
            if current and len(current) + len(subpiece) > 68:
                result.append(current)
                current = subpiece
            else:
                current += subpiece
        if current:
            result.append(current)
    return result or [line]


def _extract_project_eightfold(project_dir: Path) -> Node:
    """Extract only sections 3.2–3.8 from the original learning guide."""

    guide = project_dir / GUIDE_NAME
    lines = guide.read_text(encoding="utf-8").splitlines()
    start = next(i for i, line in enumerate(lines) if line.startswith("### 3.2 "))
    end = next(
        (i for i, line in enumerate(lines[start:], start) if line.startswith("### 4.5 ")),
        len(lines),
    )

    root = N("9. 项目八股｜原作者学习指南第 3.2–3.8 节", kind="major")
    current_top: Node | None = None
    stack: list[tuple[int, Node]] = []
    in_code = False

    for raw in lines[start:end]:
        stripped = raw.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        heading = re.match(r"^(#{3,5})\s+(.+)$", stripped)
        if heading and not in_code:
            level = len(heading.group(1))
            label = _strip_markdown(heading.group(2))
            label = re.sub(r"^\d+\.\d+(?:\.\d+)*\s*", "", label)
            kind = "question" if level == 3 else "section"
            new_node = N(("Q｜" if level == 3 else "" ) + label, kind=kind)
            if level == 3:
                root.children.append(new_node)
                current_top = new_node
                stack = [(level, new_node)]
            elif current_top is not None:
                while stack and stack[-1][0] >= level:
                    stack.pop()
                parent = stack[-1][1] if stack else current_top
                parent.children.append(new_node)
                stack.append((level, new_node))
            continue

        if not stripped or in_code or current_top is None:
            continue
        parent = stack[-1][1] if stack else current_top
        for fact in _split_facts(stripped):
            if fact:
                parent.children.append(N("答｜" + fact, kind="answer"))

    return root


def _core_branches(project_dir: Path) -> list[Node]:
    """Curated high-signal project map, based on the project's 35 docs."""

    return [
        N(
            "1. 项目定位与硬件平台",
            N("场景｜校园无人配送车的实时车道线识别", kind="highlight"),
            N("核心痛点｜夜间/弱光导致车道线对比度低，模型容易漏检或误检"),
            N("平台｜飞腾 FT2000/4，四核 ARM，银河麒麟 V10"),
            N("输入输出｜摄像头或视频帧 → 增强/推理 → 车道线结果图"),
            N("技术栈｜C++、OpenCV、Qt、LIME、ONNX Runtime、NCNN"),
            N("约束｜没有可用 GPU 通用计算路径，实时性主要依靠 CPU 优化"),
            N("一句话介绍｜在 ARM Linux 平台完成低照度增强、车道线检测和可视化监控闭环", kind="highlight"),
            kind="major",
        ),
        N(
            "2. 系统架构与完整数据流",
            N("启动｜Qt 创建 QApplication → MainWindow → show() → a.exec()"),
            N("主链｜摄像头/视频 → OpenCV 采集 → 保存 frames/ → LIME → Unet/LSTR → result/ → Qt 显示", kind="highlight"),
            N("Qt 上位机｜按钮控制、帧采集、外部进程管理、结果显示、CPU/内存监控"),
            N("LIME 程序｜低照度增强，只改善输入图像质量，不负责车道线检测"),
            N("模型程序｜Unet 做像素级分割；LSTR 做参数化曲线检测"),
            N("模块通信｜文件系统交换图像，QProcess 启动/控制外部程序，信号槽读取输出"),
            N("进程边界｜重计算放到独立可执行程序，避免阻塞 Qt UI 事件循环", kind="highlight"),
            N("数据目录｜frames/ 保存输入帧；LSTR/result/ 保存推理结果；Qt 读取结果回显"),
            N("故障定位｜界面卡顿看 Qt/进程；图像偏暗看 LIME；识别错误看模型/后处理"),
            kind="major",
        ),
        N(
            "3. Qt 上位机",
            N("main()｜创建 QApplication、MainWindow，进入事件循环"),
            N("信号槽四步｜谁发事件 → 什么信号 → 谁处理 → 调哪个槽函数", kind="highlight"),
            N("按钮链｜Open 开摄像头；Stop 停止；Select 选择视频；识别按钮启动推理"),
            N("QTimer｜readFrame() 定时采集；timerTimeOut() 定时刷新 CPU/内存"),
            N("QProcess｜启动 bash/外部推理程序，write() 发送命令，readyReadStandardOutput() 读取输出"),
            N("CPU 监控｜读取 /proc/stat，前后两次累计时间做差，得到瞬时占用率"),
            N("内存监控｜读取 free -m，按 total/free 计算当前使用率"),
            N("动态曲线｜新值加入历史列表，清空并重新 append QSplineSeries"),
            N("Mat → QImage｜按 CV_8UC1/CV_8UC3/CV_8UC4 分支处理通道和步长"),
            N("高频风险｜推理放 UI 主线程会卡死；waitKey/延时会影响响应；颜色通道要核对", kind="warning"),
            kind="major",
        ),
        N(
            "4. LIME 算法原理",
            N("Retinex 视角｜图像 I = 反射分量 R × 光照分量 T，增强时按通道除以 T"),
            N("初始光照图｜T_hat = max(R, G, B)，每个像素取 RGB 最大值", kind="formula"),
            N("ADMM 目标｜用带权 TV 正则优化光照图，处理非光滑项并保持边缘"),
            N("变量｜T 主变量；G 辅助变量；Z 对偶变量；u 惩罚参数；W 边缘权重"),
            N("迭代顺序｜solveT → solveG → solveZ → solveU，顺序对应变量依赖", kind="highlight"),
            N("solveT｜频域求解主变量，利用 FFT 将卷积/微分问题转成逐元素运算"),
            N("solveG｜结合导数、权重和软阈值处理正则项"),
            N("收敛｜用 Frobenius 范数和 epsilon 判断残差，避免无意义继续迭代"),
            N("安全护栏｜normalize(T, 0.2, 1.0)，防止除以接近 0 的光照值"),
            N("输出｜R/T、G/T、B/T → threshold/merge/convertTo → CV_8U 增强图"),
            N("代码地标｜_init_IllumMap()、getMax()、optIllumMap()、solveT/G/Z/U()、enhance()"),
            kind="major",
        ),
        N(
            "5. NEON、OpenMP 与缓存优化",
            N("优化递进｜循环重排 → 循环展开 → NEON SIMD → OpenMP 多核并行"),
            N("Loop Reordering｜按连续内存访问顺序遍历，提升局部性和缓存命中率", kind="highlight"),
            N("Loop Unrolling｜一次展开处理多个元素，减少计数、分支和循环控制开销"),
            N("NEON｜ARMv8 SIMD 指令集，单条指令并行处理多个 float；本项目通过 C++ 库调用，不是手写汇编"),
            N("NEON 热点｜getMax() 通道最大值、Frobenius() 范数、数据密集型像素运算"),
            N("OpenMP｜共享内存并行 API，通过 pragma 将独立循环分配给多核 CPU"),
            N("线程数｜FT2000/4 是四核，通常使用 4 个线程；线程过多会增加调度和竞争开销"),
            N("OpenMP vs Pthread｜OpenMP 易用且适合数据并行；Pthread 控制细但需要手动管理线程"),
            N("Cacheline｜CPU 与内存传输的最小缓存单位，通常 64 字节；连续访问更容易命中"),
            N("Perf 验证｜通过 cache-misses、cache-references 等指标验证缓存命中率变化"),
            N("工程原则｜先计时定位热点，再做单项优化，最后回归输出正确性"),
            kind="major",
        ),
        N(
            "6. LSTR 与 Unet 模型部署",
            N("LSTR 思路｜把车道线建模为参数化曲线，而不是逐像素分类"),
            N("LSTR 输入｜归一化图像 [1,3,360,640] + 全零 mask_tensor"),
            N("LSTR 输出｜pred_logits 判断候选车道线存在性；pred_curves 提供曲线参数"),
            N("曲线解码｜pred_curves + log_space.bin → 离散采样点 → 坐标映射 → 绿色区域", kind="highlight"),
            N("LSTR 部署｜ONNX Runtime 加载模型，Run() 执行推理并读取 tensor"),
            N("Unet 思路｜Encoder-Decoder + skip connection，输出像素级语义分割 mask"),
            N("Unet 输入｜保持比例补边后 resize 到 720×720，再归一化和 HWC→CHW"),
            N("Unet 部署｜NCNN 使用 .param + .bin，适合 ARM 端轻量推理"),
            N("HWC→CHW｜OpenCV 按像素存通道；卷积推理按通道连续存储，必须重排", kind="formula"),
            N("Unet 后处理｜多通道 argmax → 去 padding → 恢复尺寸 → 可视化"),
            N("核心区别｜Unet 像素级画线；LSTR 直接预测曲线参数；绿色显示区域来自后处理"),
            kind="major",
        ),
        N(
            "7. 系统集成与性能数据",
            N("LIME 性能｜原始 1.6305s；傅里叶重构 1.031s；NEON+OpenMP 0.314s；约 5.19× 加速", kind="highlight"),
            N("Unet｜平均推理 17.386s → 4.676s；权重约 124MB → 10MB；DICE 93.1% → 84.5%"),
            N("LSTR｜平均推理 1.953s → 0.182s；权重 124.7MB → 12MB；准确率 97.4% → 90.7%"),
            N("端到端｜采集/JPEG 约 40ms + LIME 约 314ms + LSTR 约 182ms ≈ 536ms/帧"),
            N("当前瓶颈｜LIME 约占端到端耗时一半，是继续优化的主要方向"),
            N("轻量化｜深度可分离卷积 + FP16/参数量化，压缩模型但需要权衡精度"),
            N("通信权衡｜文件系统简单、可靠、方便调试；共享内存/消息队列性能更高但复杂"),
            N("评价维度｜功能、端到端延迟、精度、CPU/内存、长时间稳定性"),
            kind="major",
        ),
        N(
            "8. 项目面试表达与设计权衡",
            N("先讲痛点｜弱光影响识别 + ARM 无 GPU 通用计算 + 需要实时处理"),
            N("再讲主链｜Qt 采集 → LIME 增强 → Unet/LSTR 推理 → Qt 显示与监控", kind="highlight"),
            N("模块化原因｜控制显示、增强、推理解耦，便于定位问题和替换模型"),
            N("为什么先增强｜低质量输入会造成漏检/误检，LIME 先改善模型输入"),
            N("为什么双模型｜Unet 擅长像素边界；LSTR 擅长参数化曲线和速度"),
            N("为什么两种框架｜LSTR 需要 ONNX 图兼容性；Unet 更适合 NCNN ARM 优化"),
            N("为什么文件交换｜实现简单、跨进程直观、结果可留存，满足当前场景"),
            N("追问瓶颈｜LIME 迭代/像素计算、模型推理、文件 I/O、内存占用"),
            N("改进方向｜量化剪枝、共享内存、预分配、减少拷贝、跳过不必要增强"),
            N("表达边界｜不要把 LIME 说成检测；不要把绿色区域说成 LSTR 直接输出", kind="warning"),
            kind="major",
        ),
        _extract_project_eightfold(project_dir),
        N(
            "10. 主动回忆、易错点与破坏测试",
            N("闭卷主链｜写出 Qt 信号、槽、QProcess、输出回调和显示更新顺序"),
            N("LIME 手算｜用 2×2 图像和 2×2 T 手算一个通道的 I/T，并说明 T 接近 0 的风险"),
            N("ADMM 追踪｜画出 T_hat/W → solveT → T → solveG → G → solveZ → Z → solveU → u"),
            N("NEON 追踪｜vld1q_f32 → vmaxq_f32 → vst1q_f32，并说明尾部元素处理"),
            N("OpenMP 追踪｜标记可并行循环、写冲突、归约和数据竞争"),
            N("Unet 追踪｜读图 → pad → resize → normalize → HWC→CHW → NCNN → argmax → 去 padding"),
            N("LSTR 追踪｜pred_logits 筛选 → pred_curves + log_space → 坐标点 → 后处理显示"),
            N("破坏测试｜去掉 T 下界、调换 ADMM 顺序、删 HWC→CHW、忽略 padding、乱加 OpenMP"),
            N("常见误判｜UI 卡顿不是模型一定崩溃；缓存提升要用 Perf 数据证明；模型输出和显示结果要区分", kind="warning"),
            N("复习模板｜真实痛点、系统位置、输入输出、主调用链、关键变量、边界条件、代码地标", kind="highlight"),
            kind="major",
        ),
    ]


def build_tree(project_dir: Path) -> Node:
    project_dir = Path(project_dir)
    docs = list((project_dir / "文档").rglob("*.md"))
    guide = project_dir / GUIDE_NAME
    if len(docs) < 30:
        raise ValueError(f"项目文档数量异常：{len(docs)}")
    if not guide.exists():
        raise FileNotFoundError(guide)
    root = N(ROOT_TITLE, kind="root")
    root.children.extend(_core_branches(project_dir))
    return root


def _iter_nodes(node: Node, depth: int = 0, parent: int | None = None):
    index = yield node, depth, parent
    for child in node.children:
        yield from _iter_nodes(child, depth + 1, index)


def flatten_tree(root: Node) -> list[tuple[Node, int, int | None]]:
    result: list[tuple[Node, int, int | None]] = []

    def visit(node: Node, depth: int, parent: int | None) -> None:
        index = len(result)
        result.append((node, depth, parent))
        for child in node.children:
            visit(child, depth + 1, index)

    visit(root, 0, None)
    return result


def render_markdown(root: Node) -> str:
    lines: list[str] = []
    for node, depth, _ in flatten_tree(root):
        level = min(depth + 1, 6)
        label = node.label.replace("\n", " ").strip()
        lines.append("#" * level + " " + label)
    return "\n".join(lines) + "\n"


def max_markdown_depth(markdown: str) -> int:
    depths = [len(match.group(1)) for match in map(lambda line: re.match(r"^(#+)\s+", line), markdown.splitlines()) if match]
    return max(depths, default=0)


def validate_markdown(markdown: str) -> list[str]:
    errors: list[str] = []
    if not markdown.startswith("# " + ROOT_TITLE):
        errors.append("第一行必须是 XMind 中央主题")
    if max_markdown_depth(markdown) > 6:
        errors.append("Markdown 标题层级超过 XMind 支持范围")
    if "RTOS" in markdown.upper() or "FREERTOS" in markdown.upper():
        errors.append("错误引入 RTOS/FreeRTOS 内容")
    if "---" in markdown:
        errors.append("不应包含 frontmatter 或分隔线")
    for line_no, line in enumerate(markdown.splitlines(), 1):
        if line.startswith("#") and not re.match(r"^#{1,6}\s+\S", line):
            errors.append(f"第 {line_no} 行不是合法标题节点")
    return errors


def _font_path(bold: bool = False) -> str:
    candidates = (
        [
            r"C:\Windows\Fonts\Noto Sans SC Bold (TrueType).otf",
            r"C:\Windows\Fonts\msyhbd.ttc",
        ]
        if bold
        else [
            r"C:\Windows\Fonts\Noto Sans SC (TrueType).otf",
            r"C:\Windows\Fonts\msyh.ttc",
        ]
    )
    for candidate in candidates:
        if Path(candidate).exists():
            return candidate
    return candidates[-1]


def _load_font(size: int, bold: bool = False):
    from PIL import ImageFont

    return ImageFont.truetype(_font_path(bold), size=size)


def _wrap_text(text: str, font, max_width: int) -> list[str]:
    from PIL import ImageDraw, Image

    probe = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    result: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        if current and probe.textlength(candidate, font=font) > max_width:
            result.append(current)
            current = char
        else:
            current = candidate
    if current:
        result.append(current)
    return result or [""]


def layout_tree(root: Node, width: int = 1500) -> tuple[list[Placement], int]:
    placements: list[Placement] = []
    x_by_depth = [60, 180, 330, 500, 680, 860]
    max_width_by_depth = [520, 360, 420, 470, 520, 570]
    y = 58
    flat = flatten_tree(root)
    for index, (node, depth, parent) in enumerate(flat):
        depth = min(depth, 5)
        font_size = 18 if depth == 0 else 14 if depth == 1 else 12
        font = _load_font(font_size, bold=depth <= 1 or node.kind in {"question", "highlight"})
        max_width = min(max_width_by_depth[depth], width - x_by_depth[depth] - 70)
        lines = _wrap_text(node.label, font, max_width - 24)
        line_height = font_size + 5
        height = max(26, len(lines) * line_height + 12)
        measured_width = max((font.getlength(line) for line in lines), default=100)
        box_width = int(min(max_width, max(110, measured_width + 24)))
        if depth == 0:
            box_width = 430
        placements.append(
            Placement(
                node=node,
                depth=depth,
                parent=parent,
                x=x_by_depth[depth],
                y=y,
                width=box_width,
                height=height,
                lines=lines,
                font_size=font_size,
            )
        )
        y += height + (12 if depth <= 1 else 7)
    return placements, y + 48


COLORS = {
    "card": "#FFFFFF",
    "background": "#F6F8FA",
    "line": "#D7DEE6",
    "text": "#5E6873",
    "root_fill": "#E9EEF3",
    "root_stroke": "#9DAAB8",
    "major_fill": "#F3F7FB",
    "major_stroke": "#B4C9E4",
    "answer_fill": "#E7F3DF",
    "answer_stroke": "#98C68C",
    "answer_text": "#2C7440",
    "formula_fill": "#EEF2FF",
    "formula_stroke": "#B8C5EC",
    "warning_fill": "#FFF5E3",
    "warning_stroke": "#E2C47D",
}


def _style_for(node: Node) -> tuple[str, str, str]:
    if node.kind == "root":
        return COLORS["root_fill"], COLORS["root_stroke"], "#455361"
    if node.kind == "major":
        return COLORS["major_fill"], COLORS["major_stroke"], "#45658B"
    if node.kind in {"answer", "highlight"}:
        return COLORS["answer_fill"], COLORS["answer_stroke"], COLORS["answer_text"]
    if node.kind == "formula":
        return COLORS["formula_fill"], COLORS["formula_stroke"], "#536DAA"
    if node.kind == "warning":
        return COLORS["warning_fill"], COLORS["warning_stroke"], "#8B6A2D"
    return COLORS["card"], COLORS["line"], COLORS["text"]


def _svg_text(lines: Sequence[str], x: int, y: int, font_size: int, color: str, bold: bool) -> str:
    weight = "600" if bold else "400"
    parts = []
    line_height = font_size + 5
    for offset, line in enumerate(lines):
        parts.append(
            f'<text x="{x}" y="{y + font_size + offset * line_height}" '
            f'font-family="Noto Sans SC, Microsoft YaHei, sans-serif" '
            f'font-size="{font_size}px" font-weight="{weight}" fill="{color}">{html.escape(line)}</text>'
        )
    return "".join(parts)


def render_svg(root: Node) -> str:
    width = 1500
    placements, height = layout_tree(root, width)
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" data-title="{html.escape(ROOT_TITLE)}">',
        '<defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">'
        '<feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#9AA6B2" flood-opacity="0.18"/>'
        '</filter></defs>',
        f'<rect width="100%" height="100%" fill="{COLORS["background"]}"/>',
        f'<rect x="28" y="20" width="{width-56}" height="{height-40}" rx="22" fill="{COLORS["card"]}" filter="url(#shadow)"/>',
    ]

    for index, placement in enumerate(placements):
        if placement.parent is None:
            continue
        parent = placements[placement.parent]
        start_x = parent.x + parent.width
        start_y = parent.y + parent.height / 2
        end_x = placement.x
        end_y = placement.y + placement.height / 2
        elbow = max(start_x + 18, end_x - 18)
        out.append(
            f'<path data-edge="{placement.parent}-{index}" d="M {start_x} {start_y} '
            f'L {elbow} {start_y} L {elbow} {end_y} L {end_x} {end_y}" '
            f'fill="none" stroke="{COLORS["line"]}" stroke-width="1.2"/>'
        )

    for index, placement in enumerate(placements):
        fill, stroke, text_color = _style_for(placement.node)
        radius = 8 if placement.depth <= 1 or placement.node.kind in {"answer", "highlight", "warning", "formula"} else 4
        out.append(f'<g data-node="{index}" data-kind="{html.escape(placement.node.kind)}">')
        out.append(
            f'<rect x="{placement.x}" y="{placement.y}" width="{placement.width}" '
            f'height="{placement.height}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="1"/>'
        )
        out.append(
            _svg_text(
                placement.lines,
                placement.x + 12,
                placement.y + 4,
                placement.font_size,
                text_color,
                placement.depth <= 1 or placement.node.kind in {"question", "highlight"},
            )
        )
        out.append("</g>")
    out.append(
        f'<text x="{width/2}" y="{height-22}" text-anchor="middle" '
        'font-family="Noto Sans SC, Microsoft YaHei, sans-serif" font-size="11px" fill="#A1AAB4">'
        "XMind-ready · Linux视觉感知项目复习版</text>"
    )
    out.append("</svg>")
    return "".join(out)


def render_png(root: Node, destination: Path) -> None:
    from PIL import Image, ImageDraw

    width = 1500
    placements, height = layout_tree(root, width)
    image = Image.new("RGB", (width, height), COLORS["background"])
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((28, 20, width - 28, height - 40), radius=22, fill=COLORS["card"])

    for index, placement in enumerate(placements):
        if placement.parent is None:
            continue
        parent = placements[placement.parent]
        start = (parent.x + parent.width, int(parent.y + parent.height / 2))
        end = (placement.x, int(placement.y + placement.height / 2))
        elbow = max(start[0] + 18, end[0] - 18)
        draw.line((start[0], start[1], elbow, start[1], elbow, end[1], end[0], end[1]), fill=COLORS["line"], width=2)

    for placement in placements:
        fill, stroke, text_color = _style_for(placement.node)
        draw.rounded_rectangle(
            (placement.x, placement.y, placement.x + placement.width, placement.y + placement.height),
            radius=8 if placement.depth <= 1 or placement.node.kind in {"answer", "highlight", "warning", "formula"} else 4,
            fill=fill,
            outline=stroke,
            width=1,
        )
        font = _load_font(placement.font_size, bold=placement.depth <= 1 or placement.node.kind in {"question", "highlight"})
        line_height = placement.font_size + 5
        text_y = placement.y + 6
        for line in placement.lines:
            draw.text((placement.x + 12, text_y), line, font=font, fill=text_color)
            text_y += line_height

    footer_font = _load_font(11)
    footer = "XMind-ready · Linux视觉感知项目复习版"
    bbox = draw.textbbox((0, 0), footer, font=footer_font)
    draw.text(((width - (bbox[2] - bbox[0])) / 2, height - 34), footer, font=footer_font, fill="#A1AAB4")
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, format="PNG", optimize=True)


def write_outputs(project_dir: Path, output_dir: Path | None = None) -> dict[str, object]:
    project_dir = Path(project_dir)
    output_dir = Path(output_dir) if output_dir else project_dir / OUTPUT_DIR_NAME
    output_dir.mkdir(parents=True, exist_ok=True)
    tree = build_tree(project_dir)
    markdown = render_markdown(tree)
    errors = validate_markdown(markdown)
    if errors:
        raise ValueError("; ".join(errors))
    md_path = output_dir / "Linux视觉感知项目-复习思维导图.md"
    svg_path = output_dir / "Linux视觉感知项目-复习思维导图.svg"
    png_path = output_dir / "Linux视觉感知项目-复习思维导图.png"
    md_path.write_text(markdown, encoding="utf-8", newline="\n")
    svg_path.write_text(render_svg(tree), encoding="utf-8", newline="\n")
    render_png(tree, png_path)
    return {
        "markdown": md_path,
        "svg": svg_path,
        "png": png_path,
        "node_count": len(flatten_tree(tree)),
        "height": layout_tree(tree)[1],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the Linux vision project review mind map")
    parser.add_argument("--project-dir", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--check", action="store_true", help="validate source scope and generated tree without writing files")
    args = parser.parse_args()
    tree = build_tree(args.project_dir)
    markdown = render_markdown(tree)
    errors = validate_markdown(markdown)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print(f"nodes={len(flatten_tree(tree))} depth={max_markdown_depth(markdown)}")
    if args.check:
        return 0
    result = write_outputs(args.project_dir, args.output_dir)
    for key in ("markdown", "svg", "png"):
        print(f"{key}={result[key]}")
    print(f"height={result['height']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
