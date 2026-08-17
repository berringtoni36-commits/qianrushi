import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

const FPS = 30;
const seconds = (value: number) => Math.round(value * FPS);

const COLORS = {
  background: "#eef2f4",
  surface: "rgba(255, 255, 255, 0.72)",
  strong: "rgba(255, 255, 255, 0.90)",
  text: "#100f0f",
  muted: "#6f6e69",
  faint: "#9b9a97",
  border: "rgba(22, 30, 38, 0.11)",
  accent: "#d87757",
  active: "#087f8c",
  result: "#198754",
  danger: "#c2413b",
  compare: "#b45309",
  violet: "#6f65b8",
  code: "#f7f8f9",
};

const BODY_FONT = 'Inter, "PingFang SC", "Noto Sans SC", system-ui, sans-serif';
const DISPLAY_FONT = 'Iowan Old Style, "Songti SC", STSong, Georgia, serif';
const CODE_FONT = '"Fira Code", "SFMono-Regular", Menlo, Consolas, monospace';
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const SCENE = {
  opening: seconds(18),
  map: seconds(22),
  pointer: seconds(55),
  embedded: seconds(33),
  boundary: seconds(28),
  followups: seconds(48),
  final: seconds(26),
} as const;

const TOTAL_FRAMES = Object.values(SCENE).reduce((sum, value) => sum + value, 0);

const clamp = (value: number, start: number, end: number) =>
  interpolate(value, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const reveal = (frame: number, start = 0, distance = 16): CSSProperties => {
  const immediate = start <= 0;
  const from = immediate ? 0 : start;
  const opacity = interpolate(frame, [from, from + 24], immediate ? [0.9, 1] : [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const y = interpolate(frame, [from, from + 24], immediate ? [3, 0] : [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { opacity, transform: `translateY(${y}px)` };
};

const Card: React.FC<{ children: ReactNode; style?: CSSProperties; strong?: boolean }> = ({
  children,
  style,
  strong,
}) => (
  <div
    style={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      backgroundColor: strong ? COLORS.strong : COLORS.surface,
      boxShadow: "0 16px 48px rgba(22, 30, 38, 0.10)",
      ...style,
    }}
  >
    {children}
  </div>
);

const Background: React.FC = () => (
  <>
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: COLORS.background,
        backgroundImage:
          "linear-gradient(rgba(8, 127, 140, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(8, 127, 140, 0.035) 1px, transparent 1px), linear-gradient(135deg, rgba(255,255,255,0.42), rgba(238,242,244,0.18))",
        backgroundSize: "48px 48px, 48px 48px, 100% 100%",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: -180,
        top: 80,
        width: 760,
        height: 760,
        borderRadius: 180,
        backgroundColor: "rgba(255, 255, 255, 0.28)",
        transform: "rotate(-16deg)",
        filter: "blur(12px)",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: -240,
        bottom: -260,
        width: 760,
        height: 680,
        borderRadius: 220,
        backgroundColor: "rgba(216, 119, 87, 0.075)",
        transform: "rotate(18deg)",
        filter: "blur(16px)",
      }}
    />
  </>
);

const TopBar: React.FC<{ frame: number; section: string; title: string; tag?: string }> = ({
  frame,
  section,
  title,
  tag = "慢速复习 · 3:50",
}) => (
  <Card
    strong
    style={{
      position: "absolute",
      left: 58,
      right: 58,
      top: 26,
      minHeight: 62,
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      ...reveal(frame),
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
      <div style={{ color: COLORS.accent, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>
        C / C++ 基础
      </div>
      <div style={{ width: 1, height: 18, backgroundColor: COLORS.border }} />
      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 760, whiteSpace: "nowrap" }}>
        {section}
      </div>
      <div style={{ color: COLORS.muted, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </div>
    </div>
    <div style={{ flex: "0 0 auto", padding: "8px 11px", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 700 }}>
      {tag}
    </div>
  </Card>
);

const Caption: React.FC<{ frame: number; label: string; title: string; body: string; color?: string }> = ({
  frame,
  label,
  title,
  body,
  color = COLORS.active,
}) => (
  <Card
    strong
    style={{
      position: "absolute",
      left: 58,
      right: 58,
      bottom: 54,
      minHeight: 106,
      padding: "15px 20px 16px",
      borderTop: `3px solid ${color}`,
      ...reveal(frame),
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 800 }}>
      <span>{label}</span>
      <span>先理解，再记忆</span>
    </div>
    <div style={{ marginTop: 8, color: COLORS.text, fontSize: 22, fontWeight: 800 }}>{title}</div>
    <div style={{ marginTop: 5, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{body}</div>
  </Card>
);

const SceneTitle: React.FC<{ frame: number; eyebrow: string; title: string; detail: string }> = ({
  frame,
  eyebrow,
  title,
  detail,
}) => (
  <div style={{ position: "absolute", left: 72, right: 72, top: 122, ...reveal(frame) }}>
    <div style={{ color: COLORS.accent, fontFamily: CODE_FONT, fontSize: 14, fontWeight: 800, letterSpacing: 1.3 }}>
      {eyebrow}
    </div>
    <div style={{ marginTop: 10, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 44, fontWeight: 700, lineHeight: 1.16 }}>
      {title}
    </div>
    <div style={{ marginTop: 9, color: COLORS.muted, fontSize: 18, lineHeight: 1.45 }}>{detail}</div>
  </div>
);

const Prompt: React.FC<{ frame: number; question: string; seconds: number; color?: string; hint?: string }> = ({
  frame,
  question,
  seconds: duration,
  color = COLORS.active,
  hint = "先在脑中说一遍，再看标准说法",
}) => {
  const remaining = Math.max(0, Math.ceil((duration * FPS - frame) / FPS));
  const progress = clamp(frame, 0, duration * FPS);
  return (
    <Card strong style={{ width: 670, minHeight: 290, padding: "28px 32px", borderLeft: `4px solid ${color}`, ...reveal(frame, 0, 20) }}>
      <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>先暂停 · 主动回忆</div>
      <div style={{ marginTop: 20, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 33, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 26 }}>
        <div style={{ color, fontFamily: CODE_FONT, fontSize: 44, fontWeight: 800, minWidth: 54 }}>{remaining}</div>
        <div style={{ color: COLORS.muted, fontSize: 16, lineHeight: 1.45 }}>{hint}</div>
      </div>
      <div style={{ height: 6, marginTop: 24, borderRadius: 999, backgroundColor: COLORS.border }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 999, backgroundColor: color }} />
      </div>
    </Card>
  );
};

const CodePanel: React.FC<{ title: string; lines: string[]; activeLine?: number; style?: CSSProperties }> = ({
  title,
  lines,
  activeLine = -1,
  style,
}) => (
  <Card strong style={{ overflow: "hidden", backgroundColor: "rgba(247,248,249,0.92)", ...style }}>
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 750 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.danger }} />
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.compare }} />
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.result }} />
      <span style={{ marginLeft: 8 }}>{title}</span>
    </div>
    <div style={{ padding: "18px 18px", fontFamily: CODE_FONT, fontSize: 20, lineHeight: 1.75 }}>
      {lines.map((line, index) => {
        const active = index === activeLine;
        return (
          <div key={`${title}-${index}`} style={{ display: "flex", minHeight: 34, padding: "0 10px", borderRadius: 5, backgroundColor: active ? `${COLORS.compare}16` : "transparent", color: active ? COLORS.text : index === 0 ? COLORS.muted : COLORS.text, opacity: activeLine >= 0 && index > activeLine + 2 ? 0.44 : 1 }}>
            <span style={{ width: 31, color: active ? COLORS.compare : COLORS.faint, fontSize: 14 }}>{String(index + 1).padStart(2, "0")}</span>
            <span style={{ whiteSpace: "pre" }}>{line}</span>
          </div>
        );
      })}
    </div>
  </Card>
);

const Badge: React.FC<{ children: ReactNode; color: string; style?: CSSProperties }> = ({ children, color, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 11px", border: `1px solid ${color}55`, borderRadius: 6, backgroundColor: `${color}12`, color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 750, ...style }}>
    <span style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: color }} />
    {children}
  </div>
);

const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const done = frame >= seconds(6);
  const map = [
    ["01", "数据只读", "const 约束的是修改权限", COLORS.accent],
    ["02", "指针组合", "看 const 在 * 的哪一边", COLORS.active],
    ["03", "工程边界", "接口、Flash 与 const_cast", COLORS.result],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题" title="const 关键字有什么作用？" />
      <SceneTitle frame={frame} eyebrow="复习目标" title="先别背‘只读’，先判断谁不能被改" detail="const 的难点不在定义，而在它和指针、接口、对象状态组合之后的边界。" />
      <div style={{ position: "absolute", left: 72, top: 304, right: 72, display: "flex", gap: 26, alignItems: "stretch" }}>
        <Prompt frame={frame} question="const 核心约束了什么？" seconds={6} color={COLORS.active} hint="先说：谁不能改、指针能不能动、接口想表达什么。" />
        <Card strong style={{ flex: 1, padding: "28px 30px", opacity: done ? 1 : 0.42, transform: `translateX(${done ? 0 : 18}px)` }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>本题路线</div>
          <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
            {map.map(([number, label, detail, color]) => (
              <div key={number} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "center", padding: "12px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 8, backgroundColor: `${color}0b` }}>
                <div style={{ color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{number}</div>
                <div><div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 4, color: COLORS.muted, fontSize: 14 }}>{detail}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Caption frame={frame} label="本题总纲" title="const 表达的是‘只读意图’，不是万能的线程安全" body="先把 const 看成编译器帮你守住的接口约束，再看指针位置和工程边界。" />
    </AbsoluteFill>
  );
};

const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    ["数据只读", "const int MAX = 100;", "通过这个名字不能修改对象", COLORS.accent],
    ["指针组合", "const int *p", "const 在 * 左边，内容只读", COLORS.active],
    ["接口语义", "void read(const uint8_t *buf)", "告诉调用者：函数不会改你的数据", COLORS.result],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题" title="const 的三层判断" />
      <SceneTitle frame={frame} eyebrow="答案地图" title="先判断 const 约束的是哪一层" detail="变量、指针、接口分别有不同的只读边界，别把它们混成一句‘不能改’。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 308, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {cards.map(([title, code, detail, color], index) => (
          <Card key={title} strong style={{ minHeight: 270, padding: "26px 24px", borderTop: `4px solid ${color}`, ...reveal(frame, index * 24, 22) }}>
            <div style={{ color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div>
            <div style={{ marginTop: 22, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 31, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 28, padding: "12px 14px", borderRadius: 6, backgroundColor: `${color}10`, color, fontFamily: CODE_FONT, fontSize: 17 }}>{code}</div>
            <div style={{ marginTop: 16, color: COLORS.muted, fontSize: 16, lineHeight: 1.45 }}>{detail}</div>
          </Card>
        ))}
      </div>
      <Caption frame={frame} label="答案框架" title="const 先看‘谁被约束’，再看‘能不能改指向’" body="这张地图会在后面的指针表格、函数参数和嵌入式用法里反复出现。" />
    </AbsoluteFill>
  );
};

const POINTERS = [
  ["const int *p", "指针可改指向", "不能通过 p 修改 *p", "p = &b;", COLORS.active],
  ["int * const p", "指针不能改指向", "可以修改 *p", "*p = 30;", COLORS.accent],
  ["const int * const p", "两边都不能改", "指向和内容都只读", "// 都不允许", COLORS.result],
] as const;

const PointerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(6);
  const phase = promptDone ? Math.min(2, Math.floor((frame - seconds(6)) / seconds(14))) : -1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题 / 指针" title="const 和 * 的相对位置" />
      <SceneTitle frame={frame} eyebrow="高频考点" title="口诀只有一句：const 在 * 哪边，谁就更受约束" detail="下面三种声明放在同一张表里，先看指向，再看内容。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 580, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 22 }}>
        <CodePanel title="pointer.c" activeLine={phase < 0 ? 1 : phase + 1} style={{ height: 500 }} lines={["int a = 10, b = 20;", "const int *p = &a;", "p = &b;", "// *p = 30;  编译报错", "", "// 记住：内容只读，不等于指针只读"]} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>声明对照 · 当前重点 {phase < 0 ? "等待回忆" : `${phase + 1} / 3`}</div>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {POINTERS.map(([declaration, pointer, content, example], index) => {
              const active = index === phase;
              return (
                <div key={declaration} style={{ padding: "15px 16px", border: `1px solid ${active ? POINTERS[index][4] : COLORS.border}`, borderTop: `3px solid ${POINTERS[index][4]}`, borderRadius: 7, backgroundColor: active ? `${POINTERS[index][4]}12` : "rgba(255,255,255,0.52)", ...reveal(frame, 18 + index * 20) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><div style={{ color: POINTERS[index][4], fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{declaration}</div><Badge color={POINTERS[index][4]}>{active ? "当前" : "对照"}</Badge></div>
                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, color: COLORS.muted, fontSize: 15 }}><div><b style={{ color: COLORS.text }}>指向：</b>{pointer}</div><div><b style={{ color: COLORS.text }}>内容：</b>{content}</div></div>
                  <div style={{ marginTop: 10, color: COLORS.text, fontFamily: CODE_FONT, fontSize: 14 }}>{example}</div>
                </div>
              );
            })}
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 22, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="const int *p 能改指向吗？能改内容吗？" seconds={6} color={COLORS.active} hint="用‘const 在 * 左边’判断" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="指针口诀" title="const 在 * 左边：内容只读；在 * 右边：指针只读" body="双 const 就是两边都受约束。面试时先说这句，再补一行具体声明。" />
    </AbsoluteFill>
  );
};

const EMBEDDED = [
  ["查表数组", "const uint16_t sin_table[]", "常见 MCU 工具链会把只读表放到 Flash / 只读区，具体看链接脚本。", COLORS.accent],
  ["函数参数", "void read(const uint8_t *buf, int len)", "接口承诺只读调用方缓冲区，编译器也能帮忙检查误写。", COLORS.active],
  ["固定配置", "const uint32_t BAUD_RATE = 115200", "类型明确、作用域清楚，避免把配置值当普通变量改掉。", COLORS.result],
] as const;

const EmbeddedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(6);
  const active = promptDone ? Math.min(2, Math.floor((frame - seconds(6)) / seconds(8))) : -1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题 / 工程" title="const 在嵌入式中的典型用法" />
      <SceneTitle frame={frame} eyebrow="工程落地" title="const 不只是语法，它是在描述硬件边界" detail="查表、接口和固定配置都在用同一个原则：这份数据不应该被当前代码改写。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, height: 560, display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 22 }}>
        <CodePanel title="embedded.c" activeLine={active < 0 ? 1 : active + 1} style={{ height: 500 }} lines={["const uint16_t sin_table[] = {", "    0, 707, 1000, 707, 0", "};", "", "void read(const uint8_t *buf, int len)", "{ /* 只读调用方缓冲区 */ }", "", "const uint32_t BAUD_RATE = 115200;"]} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>三个常见落点</div>
          <div style={{ marginTop: 18, display: "grid", gap: 15 }}>
            {EMBEDDED.map(([title, code, detail, color], index) => {
              const selected = index === active;
              return <div key={title} style={{ padding: "17px 18px", borderLeft: `4px solid ${color}`, border: `1px solid ${selected ? color : COLORS.border}`, borderLeftWidth: 4, borderRadius: 7, backgroundColor: selected ? `${color}11` : "rgba(255,255,255,0.50)", ...reveal(frame, 18 + index * 18) }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>{title}</div><Badge color={color}>{selected ? "当前" : "用法"}</Badge></div><div style={{ marginTop: 11, color, fontFamily: CODE_FONT, fontSize: 15 }}>{code}</div><div style={{ marginTop: 9, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{detail}</div></div>;
            })}
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 22, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="const 在嵌入式里最常见的三个场景是什么？" seconds={6} color={COLORS.accent} hint="查表、参数、固定配置" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="工程边界" title="const 能表达意图，但 Flash 映射仍由工具链和链接脚本决定" body="不要把‘const 一定在 Flash’说成语言保证；面试回答要把语言语义和平台实现分开。" />
    </AbsoluteFill>
  );
};

const BoundaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const leftActive = frame >= seconds(7);
  const rightActive = frame >= seconds(15);
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题 / 边界" title="const 和相近概念不要混答" />
      <SceneTitle frame={frame} eyebrow="易错点" title="只读约束不是线程同步，也不是文本替换" detail="面试追问经常从 const 继续问到 #define、const_cast 和 const 成员函数。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card strong style={{ minHeight: 490, padding: "26px 24px", borderTop: `4px solid ${COLORS.active}`, ...reveal(frame, 0) }}>
          <div style={{ color: COLORS.active, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>const vs #define</div>
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {["有类型检查", "有作用域", "可调试、可取地址", "#define 是预处理阶段的纯文本替换"].map((line, index) => <div key={line} style={{ padding: "13px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: index === 3 ? COLORS.compare : COLORS.text, fontSize: 17, fontWeight: index === 3 ? 700 : 600, opacity: leftActive ? 1 : 0.42 }}>{line}</div>)}
          </div>
        </Card>
        <Card strong style={{ minHeight: 490, padding: "26px 24px", borderTop: `4px solid ${COLORS.danger}`, ...reveal(frame, 18) }}>
          <div style={{ color: COLORS.danger, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>不要用 const_cast 绕过设计</div>
          <CodePanel title="undefined.cpp" activeLine={rightActive ? 3 : 1} style={{ marginTop: 20, height: 230 }} lines={["const int value = 10;", "const int *p = &value;", "int *hack = const_cast<int *>(p);", "*hack = 20;  // 未定义行为", "", "const 不是锁，但也不该被强行撕掉"]} />
          <div style={{ marginTop: 18, padding: "13px 14px", borderRadius: 6, backgroundColor: `${COLORS.danger}12`, color: COLORS.danger, fontSize: 16, fontWeight: 750 }}>如果对象本来就是 const，真正写入它属于未定义行为。</div>
        </Card>
      </div>
      <Caption frame={frame} label="边界总结" title="const 是编译期只读意图，不负责原子性、锁和同步" body="把 const、volatile、原子操作和互斥锁分开回答，才能避免把不同层次的保证混在一起。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const FOLLOWUPS = [
  ["const 和 #define 有什么区别？", "const 有类型检查、作用域和调试信息；#define 是预处理阶段的纯文本替换。", COLORS.active],
  ["const 变量能不能绕过修改？", "可以强转出非 const 指针，但修改真正的 const 对象属于未定义行为，工程上不应该这么做。", COLORS.accent],
  ["const 修饰成员函数有什么用？", "表示该函数不修改对象状态；const 对象只能调用 const 成员函数。", COLORS.result],
  ["函数参数加 const 的意义？", "它是接口承诺：函数只读调用方数据，编译器也能帮忙拦住误写。", COLORS.violet],
] as const;

const FollowupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.min(3, Math.floor(frame / seconds(12)));
  const local = frame - index * seconds(12);
  const answer = local >= seconds(5);
  const [question, explanation, color] = FOLLOWUPS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题 / 追问" title="面试官常问的四个边界问题" tag="慢速复习 · 0:48" />
      <SceneTitle frame={frame} eyebrow={`追问 ${index + 1} / 4`} title="先回答，再看标准说法" detail="每个追问先留出 5 秒，答案只保留面试中真正需要说清的边界。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, display: "grid", gridTemplateColumns: "1.55fr 0.95fr", gap: 22 }}>
        <Card strong style={{ minHeight: 570, padding: "34px 38px", borderLeft: `4px solid ${color}`, ...reveal(frame) }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>INTERVIEW FOLLOW-UP</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <><div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 46, fontWeight: 800 }}>{Math.max(0, Math.ceil((seconds(5) - local) / FPS))}</div><div style={{ color: COLORS.muted, fontSize: 17 }}>不要只说一个关键词，补上为什么。</div></div><div style={{ height: 6, marginTop: 24, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: `${clamp(local, 0, seconds(5)) * 100}%`, backgroundColor: color, borderRadius: 999 }} /></div></> : <div style={{ marginTop: 34, padding: "20px 22px", border: `1px solid ${color}44`, borderRadius: 7, backgroundColor: `${color}10`, color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(5)) }}>{explanation}</div>}
        </Card>
        <Card strong style={{ minHeight: 570, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>REVIEW QUEUE</div>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>{FOLLOWUPS.map(([item], itemIndex) => <div key={item} style={{ padding: "14px 14px", border: `1px solid ${itemIndex === index ? color : COLORS.border}`, borderRadius: 7, backgroundColor: itemIndex === index ? `${color}10` : "rgba(255,255,255,0.48)", opacity: itemIndex > index ? 0.58 : 1 }}><div style={{ color: itemIndex === index ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(itemIndex + 1).padStart(2, "0")}</div><div style={{ marginTop: 7, color: COLORS.text, fontSize: 16, lineHeight: 1.4 }}>{item}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="面试追问 · 复述" title="先说结论，再补边界和适用条件" body="把四个追问说完整，比只背‘const 就是不能改’更接近真实面试。" color={color} />
    </AbsoluteFill>
  );
};

const FINAL_ITEMS = [
  ["const 变量改变了什么？", "通过这个名字不能修改对象。", COLORS.accent],
  ["const int * 和 int * const？", "左边内容只读，右边指针只读。", COLORS.active],
  ["嵌入式里怎么用？", "查表、只读参数、固定配置；存储位置看工具链。", COLORS.result],
  ["最后一个边界？", "const 不是锁，也不要用强转去修改真正的 const 对象。", COLORS.danger],
] as const;

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const unit = seconds(6.5);
  const index = Math.min(3, Math.floor(frame / unit));
  const local = frame - index * unit;
  const answer = local >= seconds(4);
  const [question, answerText, color] = FINAL_ITEMS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 2 题 / 收束" title="最后一次：不看答案，自己复述" tag="慢速复习 · 0:26" />
      <SceneTitle frame={frame} eyebrow="记忆收束" title="把 const 压缩成四个可复述的句子" detail="真正复习完成的标志，是你能在没有代码提示时把边界说清楚。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
        <Card strong style={{ minHeight: 565, padding: "32px 38px", borderLeft: `4px solid ${color}` }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>FINAL RECALL · {index + 1}/4</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <div style={{ marginTop: 28, color: COLORS.muted, fontSize: 17 }}>先停 4 秒，再继续。</div> : <div style={{ marginTop: 32, padding: "18px 20px", border: `1px solid ${color}44`, borderRadius: 7, backgroundColor: `${color}10`, color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(4)) }}>{answerText}</div>}
        </Card>
        <Card strong style={{ minHeight: 565, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>ONE-LINE SUMMARY</div>
          <div style={{ marginTop: 28, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 34, fontWeight: 700 }}>const = 只读意图</div>
          <div style={{ marginTop: 22, display: "grid", gap: 12 }}>{[["数据", "通过这个名字不能改"], ["指针", "看 const 在 * 哪边"], ["工程", "接口清晰，边界明确"]].map(([label, text], itemIndex) => <div key={label} style={{ padding: "15px 16px", border: `1px solid ${itemIndex === index ? color : COLORS.border}`, borderRadius: 7, backgroundColor: itemIndex === index ? `${color}10` : "rgba(255,255,255,0.48)" }}><div style={{ color: itemIndex === index ? color : COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 6, color: COLORS.text, fontSize: 17, fontWeight: 700 }}>{text}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="复习完成" title="能说清这四句，第 2 题就真正过了一遍" body="下次复习先回忆 const 的三层约束，再补指针和工程边界。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

export const ConstQ2Video: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const starts = {
    opening: 0,
    map: SCENE.opening,
    pointer: SCENE.opening + SCENE.map,
    embedded: SCENE.opening + SCENE.map + SCENE.pointer,
    boundary: SCENE.opening + SCENE.map + SCENE.pointer + SCENE.embedded,
    followups: SCENE.opening + SCENE.map + SCENE.pointer + SCENE.embedded + SCENE.boundary,
    final: SCENE.opening + SCENE.map + SCENE.pointer + SCENE.embedded + SCENE.boundary + SCENE.followups,
  };
  return (
    <AbsoluteFill style={{ fontFamily: BODY_FONT, color: COLORS.text, overflow: "hidden" }}>
      <Background />
      <Sequence from={starts.opening} durationInFrames={SCENE.opening}><Opening /></Sequence>
      <Sequence from={starts.map} durationInFrames={SCENE.map}><MapScene /></Sequence>
      <Sequence from={starts.pointer} durationInFrames={SCENE.pointer}><PointerScene /></Sequence>
      <Sequence from={starts.embedded} durationInFrames={SCENE.embedded}><EmbeddedScene /></Sequence>
      <Sequence from={starts.boundary} durationInFrames={SCENE.boundary}><BoundaryScene /></Sequence>
      <Sequence from={starts.followups} durationInFrames={SCENE.followups}><FollowupScene /></Sequence>
      <Sequence from={starts.final} durationInFrames={SCENE.final}><FinalScene /></Sequence>
      <div style={{ position: "absolute", left: 58, right: 58, bottom: 22, height: 4, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 999, backgroundColor: COLORS.accent }} /></div>
      <div style={{ position: "absolute", right: 58, bottom: 31, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 700 }}>Q02 · const · 3:50</div>
    </AbsoluteFill>
  );
};

export const ConstQ2Composition = () => (
  <Composition id="ConstQ2" component={ConstQ2Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
