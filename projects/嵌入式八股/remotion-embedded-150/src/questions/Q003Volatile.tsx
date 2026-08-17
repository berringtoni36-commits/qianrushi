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
  map: seconds(24),
  loop: seconds(58),
  scenarios: seconds(38),
  limits: seconds(30),
  followups: seconds(48),
  final: seconds(44),
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

const Card: React.FC<{ children: ReactNode; style?: CSSProperties; strong?: boolean }> = ({ children, style, strong }) => (
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
  tag = "慢速复习 · 4:20",
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
      <div style={{ color: COLORS.accent, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>C / C++ 基础</div>
      <div style={{ width: 1, height: 18, backgroundColor: COLORS.border }} />
      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 760, whiteSpace: "nowrap" }}>{section}</div>
      <div style={{ color: COLORS.muted, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
    </div>
    <div style={{ flex: "0 0 auto", padding: "8px 11px", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 700 }}>{tag}</div>
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

const SceneTitle: React.FC<{ frame: number; eyebrow: string; title: string; detail: string }> = ({ frame, eyebrow, title, detail }) => (
  <div style={{ position: "absolute", left: 72, right: 72, top: 122, ...reveal(frame) }}>
    <div style={{ color: COLORS.accent, fontFamily: CODE_FONT, fontSize: 14, fontWeight: 800, letterSpacing: 1.3 }}>{eyebrow}</div>
    <div style={{ marginTop: 10, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 44, fontWeight: 700, lineHeight: 1.16 }}>{title}</div>
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

const CodePanel: React.FC<{ title: string; lines: string[]; activeLine?: number; style?: CSSProperties }> = ({ title, lines, activeLine = -1, style }) => (
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
  const done = frame >= seconds(7);
  const map = [
    ["01", "编译器视角", "为什么会读到旧值？", COLORS.accent],
    ["02", "外部改值", "中断、硬件、DMA 都可能动它", COLORS.active],
    ["03", "工程边界", "volatile 不是锁，也不是原子操作", COLORS.result],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题" title="volatile 关键字在嵌入式开发中有什么作用？" />
      <SceneTitle frame={frame} eyebrow="复习目标" title="先找到那个‘看不见的修改者’" detail="volatile 的关键不只是‘每次读内存’，而是告诉编译器：值可能由当前代码之外的事件改变。" />
      <div style={{ position: "absolute", left: 72, top: 304, right: 72, display: "flex", gap: 26, alignItems: "stretch" }}>
        <Prompt frame={frame} question="volatile 到底防住了什么？" seconds={7} color={COLORS.active} hint="先说：谁可能改值、编译器会怎样、它不保证什么。" />
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
      <Caption frame={frame} label="本题总纲" title="volatile 保留必要的读写，但不替你完成同步" body="先看一个等待中断完成的循环，再把它和原子性、锁、const volatile 分开回答。" />
    </AbsoluteFill>
  );
};

const ACTORS = [
  ["中断", "ISR 随时把 flag 置 1", "主循环之外的执行路径", COLORS.accent],
  ["硬件寄存器", "外设状态会自己变化", "读操作本身就是 I/O", COLORS.active],
  ["DMA / 任务", "另一个执行者写入缓冲或状态", "当前函数看不到完整控制流", COLORS.result],
] as const;

const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题" title="volatile 的三类外部改值者" />
      <SceneTitle frame={frame} eyebrow="答案地图" title="先问：谁会在你看不见的时刻改值？" detail="volatile 不是让变量‘更安全’，而是让编译器保留这类不可见事件需要的访问。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        {ACTORS.map(([title, code, detail, color], index) => (
          <Card key={title} strong style={{ minHeight: 300, padding: "26px 24px", borderTop: `4px solid ${color}`, ...reveal(frame, index * 26, 22) }}>
            <div style={{ color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div>
            <div style={{ marginTop: 22, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 31, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 28, padding: "12px 14px", borderRadius: 6, backgroundColor: `${color}10`, color, fontFamily: CODE_FONT, fontSize: 16 }}>{code}</div>
            <div style={{ marginTop: 16, color: COLORS.muted, fontSize: 16, lineHeight: 1.45 }}>{detail}</div>
            <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 10, color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}><span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: color }} />值可能在当前代码之外变化</div>
          </Card>
        ))}
      </div>
      <Caption frame={frame} label="答案框架" title="volatile 解决的是‘访问不能被编译器自作主张删掉’" body="它描述的是可观察性边界，不是互斥关系；后面要把‘读得到’和‘改得安全’分开。" />
    </AbsoluteFill>
  );
};

const LOOP_STATES = [
  ["程序第一次检查", "read #1: rx_done = 0", "循环继续等待", COLORS.accent],
  ["优化器的风险", "如果只看当前控制流，值似乎不会变", "读取可能被缓存，不能假设每轮都重新观察", COLORS.compare],
  ["ISR 写入完成", "中断路径：rx_done = 1", "主循环之外发生了写入", COLORS.active],
  ["下一次观察", "read #2: rx_done = 1", "循环退出，继续处理数据", COLORS.result],
] as const;

const LoopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(7);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(7)) / seconds(12))) : -1;
  const activeLine = phase < 0 ? 1 : phase === 0 ? 1 : phase === 1 ? 1 : phase === 2 ? 4 : 1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题 / 机制" title="等待中断完成：为什么要保留每次读取？" />
      <SceneTitle frame={frame} eyebrow="确定性轨迹" title="同一个 while，外部事件决定它什么时候结束" detail="代码没有在函数体里修改 rx_done，但 ISR 可能随时写入；volatile 让这条访问边界对编译器可见。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 580, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 22 }}>
        <CodePanel title="receive.c" activeLine={activeLine} style={{ height: 500 }} lines={["volatile uint8_t rx_done = 0;", "while (!rx_done) {", "    wait_for_interrupt();", "}", "// ISR: rx_done = 1;", "// 每轮都保留对状态的观察"]} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>访问轨迹 · 当前阶段 {phase < 0 ? "等待回忆" : `${phase + 1} / 4`}</div>
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {LOOP_STATES.map(([title, code, detail, color], index) => {
              const active = index === phase;
              return (
                <div key={title} style={{ padding: "15px 16px", border: `1px solid ${active ? color : COLORS.border}`, borderTop: `3px solid ${color}`, borderRadius: 7, backgroundColor: active ? `${color}12` : "rgba(255,255,255,0.52)", ...reveal(frame, 18 + index * 22) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 17, fontWeight: 800 }}>{title}</div><Badge color={color}>{active ? "当前" : "轨迹"}</Badge></div>
                  <div style={{ marginTop: 10, color: COLORS.text, fontFamily: CODE_FONT, fontSize: 15 }}>{code}</div>
                  <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 15, lineHeight: 1.4 }}>{detail}</div>
                </div>
              );
            })}
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 22, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="没有 volatile，rx_done 可能发生什么？" seconds={7} color={COLORS.active} hint="先说：循环会不会重新读、ISR 什么时候介入" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="机制口诀" title="volatile 让必要的访问留下来，但不把读写变成原子操作" body="看到‘外部改值’先想到 volatile；看到‘多个执行者同时改’还要继续问原子性和同步。" />
    </AbsoluteFill>
  );
};

const SCENARIOS = [
  ["中断共享标志", "volatile uint8_t rx_done;", "ISR 置位，主循环轮询；适合表达外部事件会改变状态。", COLORS.accent],
  ["硬件寄存器", "*(volatile uint32_t *)0x40021000", "每次访问都可能触发或观察外设状态，不能被普通变量方式缓存。", COLORS.active],
  ["DMA / RTOS 标志", "volatile int state;", "其他执行者可能更新值，但并发保护仍要由原子操作、临界区或锁负责。", COLORS.result],
] as const;

const ScenariosScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(6);
  const active = promptDone ? Math.min(2, Math.floor((frame - seconds(6)) / seconds(9))) : -1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题 / 工程" title="volatile 的三个典型落点" />
      <SceneTitle frame={frame} eyebrow="工程落地" title="外部改值者不同，访问边界是同一个问题" detail="中断、寄存器、DMA 和任务共享状态都可能脱离当前函数的控制流。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, height: 560, display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 22 }}>
        <CodePanel title="embedded.c" activeLine={active < 0 ? 1 : active + 1} style={{ height: 500 }} lines={["volatile uint8_t rx_done;", "volatile uint32_t *status_reg;", "volatile int state;", "", "// ISR / 外设 / DMA 或其他任务", "// 都可能在这里之外改值"]} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>三个常见场景</div>
          <div style={{ marginTop: 18, display: "grid", gap: 15 }}>
            {SCENARIOS.map(([title, code, detail, color], index) => {
              const selected = index === active;
              return <div key={title} style={{ padding: "17px 18px", borderLeft: `4px solid ${color}`, border: `1px solid ${selected ? color : COLORS.border}`, borderLeftWidth: 4, borderRadius: 7, backgroundColor: selected ? `${color}11` : "rgba(255,255,255,0.50)", ...reveal(frame, 18 + index * 18) }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>{title}</div><Badge color={color}>{selected ? "当前" : "用法"}</Badge></div><div style={{ marginTop: 11, color, fontFamily: CODE_FONT, fontSize: 15 }}>{code}</div><div style={{ marginTop: 9, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{detail}</div></div>;
            })}
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 22, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="哪些场景必须先想到 volatile？" seconds={6} color={COLORS.accent} hint="中断、硬件寄存器、DMA 或 RTOS 状态" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="工程边界" title="volatile 描述谁可能改值，不描述谁有权安全地改值" body="在真实项目里还要结合寄存器定义、临界区、原子操作和内存序一起判断。" />
    </AbsoluteFill>
  );
};

const LimitsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const leftActive = frame >= seconds(6);
  const rightActive = frame >= seconds(14);
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题 / 边界" title="volatile 能做什么，不能做什么？" />
      <SceneTitle frame={frame} eyebrow="易错点" title="读得到，不代表改得安全" detail="volatile、原子操作、互斥锁和 const volatile 解决的是不同问题，面试时要分层回答。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card strong style={{ minHeight: 490, padding: "26px 24px", borderTop: `4px solid ${COLORS.active}`, ...reveal(frame, 0) }}>
          <div style={{ color: COLORS.active, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>volatile 能帮你</div>
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {["保留必要的读写访问", "让外部变化对编译器可见", "避免把轮询变量当成不变值"].map((line) => <div key={line} style={{ padding: "13px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text, fontSize: 17, fontWeight: 600, opacity: leftActive ? 1 : 0.42 }}>{line}</div>)}
          </div>
          <div style={{ marginTop: 22, padding: "13px 14px", borderRadius: 6, backgroundColor: `${COLORS.active}12`, color: COLORS.active, fontSize: 16, fontWeight: 750 }}>可见性 ≠ 原子性 ≠ 同步</div>
        </Card>
        <Card strong style={{ minHeight: 490, padding: "26px 24px", borderTop: `4px solid ${COLORS.danger}`, ...reveal(frame, 18) }}>
          <div style={{ color: COLORS.danger, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>还需要继续回答</div>
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {["不能替代锁或临界区", "不能保证复合读-改-写原子", "不能消除竞态条件"].map((line) => <div key={line} style={{ padding: "13px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.danger, fontSize: 17, fontWeight: 650, opacity: rightActive ? 1 : 0.42 }}>{line}</div>)}
          </div>
          <CodePanel title="read_only_register.c" activeLine={rightActive ? 2 : 0} style={{ marginTop: 20, height: 175 }} lines={["const volatile uint32_t *status", "    = (const volatile uint32_t *)ADDR;", "// 我不写，但硬件可能改"]} />
        </Card>
      </div>
      <Caption frame={frame} label="边界总结" title="volatile + 同步工具，才可能构成完整的共享保护" body="const volatile 表示‘代码不写，但外部可能改’，常见于只读硬件状态寄存器。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const FOLLOWUPS = [
  ["volatile 能替代锁吗？", "不能。volatile 只保留必要的访问，不保证原子性、互斥或内存同步。", COLORS.active],
  ["什么场景必须考虑 volatile？", "中断共享变量、硬件寄存器、DMA 或 RTOS 中可能被其他执行者修改的状态。", COLORS.accent],
  ["volatile 和 const 能同时用吗？", "可以。const volatile 表示当前代码不写，但硬件或其他外部执行者可能改变它。", COLORS.result],
  ["缺少 volatile 可能出现什么？", "轮询循环可能一直读到缓存的旧值，表现为等待永不结束或看不到寄存器变化。", COLORS.violet],
] as const;

const FollowupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.min(3, Math.floor(frame / seconds(12)));
  const local = frame - index * seconds(12);
  const answer = local >= seconds(5);
  const [question, explanation, color] = FOLLOWUPS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题 / 追问" title="面试官常问的四个边界问题" tag="慢速复习 · 0:48" />
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
      <Caption frame={frame} label="面试追问 · 复述" title="先说可见性，再说原子性和同步" body="把‘volatile 让编译器看见变化’和‘共享数据需要同步保护’连起来，回答才完整。" color={color} />
    </AbsoluteFill>
  );
};

const FINAL_ITEMS = [
  ["volatile 解决什么问题？", "保留可能被外部事件改变的必要读写，让编译器不要把访问优化掉。", COLORS.accent],
  ["哪些外部事件会改值？", "中断、硬件寄存器、DMA 或其他任务都可能脱离当前控制流修改它。", COLORS.active],
  ["volatile 能替代锁吗？", "不能；它不保证原子性、互斥、内存序或竞态安全。", COLORS.result],
  ["const volatile 是什么？", "当前代码不写，但外部可能改变；典型场景是只读硬件状态寄存器。", COLORS.danger],
] as const;

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const unit = seconds(11);
  const index = Math.min(3, Math.floor(frame / unit));
  const local = frame - index * unit;
  const answer = local >= seconds(6);
  const [question, answerText, color] = FINAL_ITEMS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 3 题 / 收束" title="最后一次：不看答案，自己复述" tag="慢速复习 · 0:44" />
      <SceneTitle frame={frame} eyebrow="记忆收束" title="把 volatile 压缩成四个可复述的句子" detail="真正复习完成的标志，是你能把可见性、外部事件和同步边界分开说清楚。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
        <Card strong style={{ minHeight: 565, padding: "32px 38px", borderLeft: `4px solid ${color}` }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>FINAL RECALL · {index + 1}/4</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <div style={{ marginTop: 28, color: COLORS.muted, fontSize: 17 }}>先停 6 秒，再继续。</div> : <div style={{ marginTop: 32, padding: "18px 20px", border: `1px solid ${color}44`, borderRadius: 7, backgroundColor: `${color}10`, color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(6)) }}>{answerText}</div>}
        </Card>
        <Card strong style={{ minHeight: 565, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>ONE-LINE SUMMARY</div>
          <div style={{ marginTop: 28, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 34, fontWeight: 700 }}>volatile = 保留可见访问</div>
          <div style={{ marginTop: 22, display: "grid", gap: 12 }}>{[["外部", "中断、硬件、DMA、任务"], ["编译器", "不要假设值不会变"], ["边界", "原子性和同步仍要另答"]].map(([label, text], itemIndex) => <div key={label} style={{ padding: "15px 16px", border: `1px solid ${itemIndex === index ? color : COLORS.border}`, borderRadius: 7, backgroundColor: itemIndex === index ? `${color}10` : "rgba(255,255,255,0.48)" }}><div style={{ color: itemIndex === index ? color : COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 6, color: COLORS.text, fontSize: 17, fontWeight: 700 }}>{text}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="复习完成" title="能说清这四句，第 3 题就真正过了一遍" body="下次复习先回忆外部改值者，再补一句：volatile 不是锁，也不是原子操作。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

export const VolatileQ3Video: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const starts = {
    opening: 0,
    map: SCENE.opening,
    loop: SCENE.opening + SCENE.map,
    scenarios: SCENE.opening + SCENE.map + SCENE.loop,
    limits: SCENE.opening + SCENE.map + SCENE.loop + SCENE.scenarios,
    followups: SCENE.opening + SCENE.map + SCENE.loop + SCENE.scenarios + SCENE.limits,
    final: SCENE.opening + SCENE.map + SCENE.loop + SCENE.scenarios + SCENE.limits + SCENE.followups,
  };
  return (
    <AbsoluteFill style={{ fontFamily: BODY_FONT, color: COLORS.text, overflow: "hidden" }}>
      <Background />
      <Sequence from={starts.opening} durationInFrames={SCENE.opening}><Opening /></Sequence>
      <Sequence from={starts.map} durationInFrames={SCENE.map}><MapScene /></Sequence>
      <Sequence from={starts.loop} durationInFrames={SCENE.loop}><LoopScene /></Sequence>
      <Sequence from={starts.scenarios} durationInFrames={SCENE.scenarios}><ScenariosScene /></Sequence>
      <Sequence from={starts.limits} durationInFrames={SCENE.limits}><LimitsScene /></Sequence>
      <Sequence from={starts.followups} durationInFrames={SCENE.followups}><FollowupScene /></Sequence>
      <Sequence from={starts.final} durationInFrames={SCENE.final}><FinalScene /></Sequence>
      <div style={{ position: "absolute", left: 58, right: 58, bottom: 22, height: 4, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 999, backgroundColor: COLORS.accent }} /></div>
      <div style={{ position: "absolute", right: 58, bottom: 31, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 700 }}>Q03 · volatile · 4:20</div>
    </AbsoluteFill>
  );
};

export const VolatileQ3Composition = () => (
  <Composition id="VolatileQ3" component={VolatileQ3Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
);
