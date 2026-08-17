import { AbsoluteFill, Composition, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
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
};

const BODY_FONT = 'Inter, "PingFang SC", "Noto Sans SC", system-ui, sans-serif';
const DISPLAY_FONT = 'Iowan Old Style, "Songti SC", STSong, Georgia, serif';
const CODE_FONT = '"Fira Code", "SFMono-Regular", Menlo, Consolas, monospace';
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const SCENE = {
  opening: seconds(12),
  map: seconds(14),
  single: seconds(28),
  array: seconds(34),
  pairing: seconds(30),
  dangling: seconds(22),
  embedded: seconds(24),
  followups: seconds(36),
  final: seconds(18),
} as const;

const TOTAL_FRAMES = Object.values(SCENE).reduce((sum, value) => sum + value, 0);

const clamp = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: ease,
});

const reveal = (frame: number, start = 0, distance = 16): CSSProperties => {
  const immediate = start <= 0;
  const from = immediate ? 0 : start;
  return {
    opacity: interpolate(frame, [from, from + 24], immediate ? [0.9, 1] : [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }),
    transform: "translateY(" + interpolate(frame, [from, from + 24], immediate ? [3, 0] : [distance, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }) + "px)",
  };
};

const Card: React.FC<{ children: ReactNode; style?: CSSProperties; strong?: boolean }> = ({ children, style, strong }) => (
  <div style={{
    border: "1px solid " + COLORS.border,
    borderRadius: 8,
    backgroundColor: strong ? COLORS.strong : COLORS.surface,
    boxShadow: "0 16px 48px rgba(22, 30, 38, 0.10)",
    ...style,
  }}>
    {children}
  </div>
);

const Background: React.FC = () => (
  <>
    <div style={{
      position: "absolute",
      inset: 0,
      backgroundColor: COLORS.background,
      backgroundImage: "linear-gradient(rgba(8, 127, 140, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(8, 127, 140, 0.035) 1px, transparent 1px), linear-gradient(135deg, rgba(255,255,255,0.42), rgba(238,242,244,0.18))",
      backgroundSize: "48px 48px, 48px 48px, 100% 100%",
    }} />
    <div style={{
      position: "absolute",
      left: -180,
      top: 80,
      width: 760,
      height: 760,
      borderRadius: 180,
      backgroundColor: "rgba(255, 255, 255, 0.28)",
      transform: "rotate(-16deg)",
      filter: "blur(12px)",
    }} />
    <div style={{
      position: "absolute",
      right: -240,
      bottom: -260,
      width: 760,
      height: 680,
      borderRadius: 220,
      backgroundColor: "rgba(216, 119, 87, 0.075)",
      transform: "rotate(18deg)",
      filter: "blur(16px)",
    }} />
  </>
);

const TopBar: React.FC<{ frame: number; section: string; title: string; tag?: string }> = ({ frame, section, title, tag = "慢速复习 · 3:38" }) => (
  <Card strong style={{
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
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
      <div style={{ color: COLORS.accent, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>C / C++ 基础</div>
      <div style={{ width: 1, height: 18, backgroundColor: COLORS.border }} />
      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 760, whiteSpace: "nowrap" }}>第 11 题</div>
      <div style={{ color: COLORS.muted, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{section} · {title}</div>
    </div>
    <div style={{ flex: "0 0 auto", padding: "8px 11px", border: "1px solid " + COLORS.border, borderRadius: 6, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 700 }}>{tag}</div>
  </Card>
);

const Caption: React.FC<{ frame: number; label: string; title: string; body: string; color?: string }> = ({ frame, label, title, body, color = COLORS.active }) => (
  <Card strong style={{
    position: "absolute",
    left: 58,
    right: 58,
    bottom: 54,
    minHeight: 106,
    padding: "15px 20px 16px",
    borderTop: "3px solid " + color,
    ...reveal(frame),
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 20, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 800 }}>
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

const Prompt: React.FC<{ frame: number; question: string; duration: number; color?: string; hint?: string }> = ({ frame, question, duration, color = COLORS.active, hint = "先在脑中说一遍，再看标准说法" }) => {
  const remaining = Math.max(0, Math.ceil((duration * FPS - frame) / FPS));
  const progress = clamp(frame, 0, duration * FPS);
  return (
    <Card strong style={{ width: 670, minHeight: 278, padding: "28px 32px", borderLeft: "4px solid " + color, ...reveal(frame, 0, 20) }}>
      <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>先暂停 · 主动回忆</div>
      <div style={{ marginTop: 20, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 33, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 25 }}>
        <div style={{ color, fontFamily: CODE_FONT, fontSize: 44, fontWeight: 800, minWidth: 54 }}>{remaining}</div>
        <div style={{ color: COLORS.muted, fontSize: 16, lineHeight: 1.45 }}>{hint}</div>
      </div>
      <div style={{ height: 6, marginTop: 23, borderRadius: 999, backgroundColor: COLORS.border }}>
        <div style={{ height: "100%", width: progress * 100 + "%", borderRadius: 999, backgroundColor: color }} />
      </div>
    </Card>
  );
};

const CodePanel: React.FC<{ title: string; lines: string[]; activeLine?: number; style?: CSSProperties }> = ({ title, lines, activeLine = -1, style }) => (
  <Card strong style={{ overflow: "hidden", backgroundColor: "rgba(247,248,249,0.92)", ...style }}>
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", borderBottom: "1px solid " + COLORS.border, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 750 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.danger }} />
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.compare }} />
      <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.result }} />
      <span style={{ marginLeft: 8 }}>{title}</span>
    </div>
    <div style={{ padding: "18px 18px", fontFamily: CODE_FONT, fontSize: 17, lineHeight: 1.7 }}>
      {lines.map((line, index) => {
        const active = index === activeLine;
        return (
          <div key={title + "-" + index} style={{ display: "flex", minHeight: 34, padding: "0 10px", borderRadius: 5, backgroundColor: active ? COLORS.compare + "16" : "transparent", color: COLORS.text, opacity: activeLine >= 0 && index > activeLine + 2 ? 0.44 : 1 }}>
            <span style={{ width: 31, color: active ? COLORS.compare : COLORS.faint, fontSize: 14 }}>{String(index + 1).padStart(2, "0")}</span>
            <span style={{ whiteSpace: "pre" }}>{line}</span>
          </div>
        );
      })}
    </div>
  </Card>
);

const Badge: React.FC<{ children: ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 11px", border: "1px solid " + color + "55", borderRadius: 6, backgroundColor: color + "12", color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 750 }}>
    <span style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: color }} />
    {children}
  </div>
);

const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const done = frame >= seconds(6);
  const route = [
    ["01", "单个对象", "delete 只结束一个对象，再归还它的存储", COLORS.active],
    ["02", "对象数组", "delete[] 逐个析构数组元素，释放整个数组", COLORS.compare],
    ["03", "边界与工程", "混用是未定义行为，嵌入式还要控制资源与时延", COLORS.danger],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="主动回忆" title="delete 和 delete[] 有什么区别？" />
      <SceneTitle frame={frame} eyebrow="复习目标" title="释放表达式，决定你结束哪一种生命周期" detail="这道题不只是在背方括号，而是在区分单个对象、对象数组和释放边界。" />
      <div style={{ position: "absolute", left: 72, top: 304, right: 72, display: "flex", gap: 26, alignItems: "stretch" }}>
        <Prompt frame={frame} question="delete 和 delete[]，到底差在哪里？" duration={6} color={COLORS.active} hint="先抓住两个词：单个对象，还是对象数组" />
        <Card strong style={{ flex: 1, padding: "28px 30px", opacity: done ? 1 : 0.42, transform: "translateX(" + (done ? 0 : 18) + "px)" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>本题路线</div>
          <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
            {route.map(([number, label, detail, color]) => (
              <div key={number} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "center", padding: "12px 14px", border: "1px solid " + COLORS.border, borderRadius: 8, backgroundColor: color + "0b" }}>
                <div style={{ color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{number}</div>
                <div>
                  <div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>{label}</div>
                  <div style={{ marginTop: 4, color: COLORS.muted, fontSize: 14 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Caption frame={frame} label="本题总纲" title="delete 释放单个对象，delete[] 释放对象数组" body="先记住适用场景，再补析构次数、错误配对、悬空指针和嵌入式资源边界。" />
    </AbsoluteFill>
  );
};

const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    ["delete", "new T", "单个对象", "调用 1 次析构，再释放对应存储", COLORS.active],
    ["delete[]", "new T[n]", "对象数组", "逐个结束元素生命周期，再释放数组", COLORS.compare],
    ["共同原则", "必须配对", "同一层级", "混用进入未定义行为，不能靠‘没崩’证明正确", COLORS.danger],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="答案地图" title="先看分配形式，再选释放形式" />
      <SceneTitle frame={frame} eyebrow="答案地图" title="方括号不是装饰，而是数组边界" detail="释放函数要和分配表达式保持同一层级；对象数组的每个元素都有自己的析构过程。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {items.map(([title, alloc, meaning, detail, color], index) => (
          <Card key={title} strong style={{ minHeight: 302, padding: "26px 24px", borderTop: "4px solid " + color, ...reveal(frame, index * 24, 20) }}>
            <div style={{ color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div>
            <div style={{ marginTop: 20, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 29, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 22, padding: "12px 14px", borderRadius: 6, backgroundColor: color + "10", color, fontFamily: CODE_FONT, fontSize: 16 }}>{alloc}</div>
            <div style={{ marginTop: 14, color: COLORS.text, fontSize: 17, fontWeight: 750 }}>{meaning}</div>
            <div style={{ marginTop: 9, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{detail}</div>
          </Card>
        ))}
      </div>
      <Card strong style={{ position: "absolute", left: 72, right: 72, top: 654, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {["分配", "构造", "使用", "析构", "释放"].map((label, index) => (
            <span key={label} style={{ display: "flex", alignItems: "center", flex: 1, gap: 12 }}>
              <span style={{ flex: 1, padding: "11px 12px", textAlign: "center", border: "1px solid " + (index === 3 ? COLORS.active : COLORS.border), borderRadius: 6, backgroundColor: index === 3 ? COLORS.active + "10" : "rgba(255,255,255,0.46)", color: index === 3 ? COLORS.active : COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{label}</span>
              {index < 4 && <span style={{ color: COLORS.faint, fontFamily: CODE_FONT, fontSize: 17 }}>→</span>}
            </span>
          ))}
        </div>
      </Card>
      <Caption frame={frame} label="一句话结论" title="delete 处理一个对象，delete[] 处理一组对象" body="释放动作的区别，最终落在对象生命周期的数量和数组边界上。" color={COLORS.compare} />
    </AbsoluteFill>
  );
};

const SINGLE_CODE = [
  "Widget* p = new Widget(7);",
  "use(*p);",
  "delete p;",
  "p = nullptr;",
];
const SINGLE_STEPS = [
  ["创建对象", "new", "分配存储并调用一次 Widget 构造函数", COLORS.active],
  ["使用对象", "live", "对象仍然存活，指针指向有效对象", COLORS.compare],
  ["结束生命周期", "delete", "先调用析构函数，再释放这一个对象的存储", COLORS.result],
  ["清空句柄", "nullptr", "指针变量主动归零，后续误用更容易暴露", COLORS.violet],
] as const;

const SingleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(6);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(6)) / (seconds(22) / 4))) : -1;
  const activeLine = phase < 0 ? 0 : [0, 1, 2, 3][phase];
  const current = phase < 0 ? ["等待判断", "先看单个对象", "delete 不是 delete[] 的缩写，而是单对象释放形式", COLORS.active] as const : SINGLE_STEPS[phase];
  const live = phase >= 0 && phase < 2;
  const released = phase >= 2;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="单个对象" title="delete 只结束一个对象" />
      <SceneTitle frame={frame} eyebrow="机制场景 01" title="没有方括号，就是一个对象的生命周期" detail="new Widget 创建一个对象；delete 结束这一个对象，再把对应存储交还给分配器。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <CodePanel title="single-object.cpp" lines={SINGLE_CODE} activeLine={activeLine} style={{ height: 520 }} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>OBJECT LIFETIME · {phase < 0 ? "等待回忆" : phase + 1 + " / 4"}</div>
          <div style={{ marginTop: 18, padding: "18px 18px", border: "2px solid " + current[3], borderRadius: 8, backgroundColor: current[3] + "10" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ color: current[3], fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{current[0]}</div>
              <Badge color={current[3]}>{current[1]}</Badge>
            </div>
            <div style={{ marginTop: 12, color: COLORS.text, fontSize: 16, fontWeight: 750 }}>{current[2]}</div>
          </div>
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
            {["heap block", "Widget", "pointer"].map((label, index) => {
              const active = index === 0 ? !released : index === 1 ? live : phase === 3;
              return <div key={label} style={{ minHeight: 82, display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", textAlign: "center", border: "1px solid " + (active ? current[3] : COLORS.border), borderRadius: 6, backgroundColor: active ? current[3] + "12" : "rgba(255,255,255,0.48)", color: active ? current[3] : COLORS.faint, fontFamily: CODE_FONT, fontSize: 12 }}>{label}</div>;
            })}
          </div>
          <div style={{ marginTop: 20, padding: "16px 16px", border: "1px solid " + COLORS.border, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}><span>Widget instance</span><span style={{ color: live ? COLORS.active : COLORS.faint }}>{live ? "1 live" : "0 live"}</span></div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["ctor ×1", "state", "dtor ×1"].map((label, index) => {
                const active = index === 0 ? phase >= 0 : index === 1 ? live : phase >= 2;
                return <div key={label} style={{ padding: "10px 8px", textAlign: "center", border: "1px solid " + (active ? (index === 2 ? COLORS.result : current[3]) : COLORS.border), borderRadius: 5, color: active ? (index === 2 ? COLORS.result : current[3]) : COLORS.faint, fontFamily: CODE_FONT, fontSize: 11 }}>{label}</div>;
              })}
            </div>
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="new Widget 后，delete 会做哪两件事？" duration={6} color={COLORS.active} hint="先说对象生命周期，再说存储释放" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="单对象口诀" title="delete = 结束 1 个对象 + 释放对应存储" body="它只适用于 new 创建的单个对象；如果分配表达式带了 []，释放时也必须保留 []。" color={COLORS.active} />
    </AbsoluteFill>
  );
};

const ARRAY_CODE = [
  "Widget* items = new Widget[3];",
  "use(items[0]);",
  "use(items[1]);",
  "use(items[2]);",
  "delete[] items;",
];
const ArrayScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phaseLength = seconds(29) / 3;
  const phase = promptDone ? Math.min(2, Math.floor((frame - seconds(5)) / phaseLength)) : -1;
  const phaseStart = phase < 0 ? 0 : seconds(5) + phase * phaseLength;
  const local = phase < 0 ? 0 : frame - phaseStart;
  const destroyCount = phase === 2 ? Math.min(3, Math.floor((local / phaseLength) * 4)) : 0;
  const activeLine = phase < 0 ? 0 : [0, 1, 4][phase];
  const liveCount = phase < 0 ? "?" : String(phase === 2 ? 3 - destroyCount : 3);
  const currentColor = phase < 0 ? COLORS.active : phase === 0 ? COLORS.compare : phase === 1 ? COLORS.active : COLORS.result;
  const status = phase < 0 ? "等待判断" : phase === 0 ? "构造 3 个元素" : phase === 1 ? "3 个对象同时存活" : "delete[] 逐个析构";
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="对象数组" title="delete[] 逐个结束数组元素" />
      <SceneTitle frame={frame} eyebrow="机制场景 02" title="数组不是一个大对象，而是多个元素的生命周期集合" detail="new Widget[3] 创建三个 Widget；delete[] 负责按数组形式逐个析构，通常按逆序结束元素。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
            <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>ARRAY LIFETIME TRACE</div>
            <div style={{ color: currentColor, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>live objects: {liveCount}</div>
          </div>
          <div style={{ marginTop: 20, padding: "16px 14px", border: "1px solid " + currentColor + "55", borderRadius: 7, backgroundColor: currentColor + "0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div style={{ color: currentColor, fontFamily: CODE_FONT, fontSize: 17, fontWeight: 800 }}>{status}</div><Badge color={currentColor}>{phase === 2 ? destroyCount + " / 3 dtor" : phase < 0 ? "先回忆" : "3 ctor"}</Badge></div>
            <div style={{ marginTop: 9, color: COLORS.muted, fontSize: 14 }}>析构顺序：<span style={{ color: COLORS.text, fontFamily: CODE_FONT, fontWeight: 800 }}>items[2] → items[1] → items[0]</span></div>
          </div>
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[0, 1, 2].map((index) => {
              const destroyed = phase === 2 && index >= 3 - destroyCount;
              const active = phase >= 0 && !destroyed;
              const color = destroyed ? COLORS.result : active ? currentColor : COLORS.faint;
              return <div key={index} style={{ minHeight: 124, padding: "14px 10px", border: "1px solid " + color, borderRadius: 7, backgroundColor: destroyed ? COLORS.result + "10" : active ? currentColor + "10" : "rgba(255,255,255,0.48)", textAlign: "center" }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>items[{index}]</div><div style={{ marginTop: 18, color, fontFamily: CODE_FONT, fontSize: 15 }}>{destroyed ? "dtor ✓" : active ? "Widget live" : "not started"}</div><div style={{ marginTop: 10, color: COLORS.muted, fontSize: 12 }}>{destroyed ? "结束生命周期" : active ? "对象存在" : "等待 new[]"}</div></div>;
            })}
          </div>
          <div style={{ marginTop: 20, padding: "14px 16px", borderLeft: "3px solid " + currentColor, backgroundColor: currentColor + "10", color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{phase === 2 ? "delete[] 不是只释放首地址；它要让数组中的每个元素都完成析构。" : "看到 []，就要把‘一个对象’切换成‘一组元素’来思考。"} </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="new Widget[3] 最后要调用几次析构？" duration={5} color={COLORS.compare} hint="三个元素，各自都有生命周期" /></div>}
        </Card>
        <CodePanel title="array-lifetime.cpp" lines={ARRAY_CODE} activeLine={activeLine} style={{ height: 520 }} />
      </div>
      <Caption frame={frame} label="数组口诀" title="delete[] = 逐个析构数组元素，再释放数组存储" body="带析构函数的对象数组最能暴露错误配对；析构顺序和次数都来自数组生命周期，而不是一个普通单对象。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

const PAIRS = [
  ["new Widget", "delete", "单个对象", "正确", COLORS.active],
  ["new Widget[3]", "delete[]", "对象数组", "正确", COLORS.compare],
  ["malloc(bytes)", "free", "原始存储", "正确", COLORS.result],
  ["new Widget[3]", "delete", "层级不匹配", "未定义行为", COLORS.danger],
] as const;
const PairingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(5)) / (seconds(25) / 4))) : -1;
  const current = phase < 0 ? ["等待检查", "先判断分配层级", "不能把未定义行为说成‘只少析构两次’", "等待揭晓", COLORS.active] as const : PAIRS[phase];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="配对边界" title="分配和释放必须保持同一层级" />
      <SceneTitle frame={frame} eyebrow="机制场景 03" title="错误配对不是某一种固定故障" detail="new[] 配 delete、new 配 free，都进入未定义行为；具体表现不能被当成语言保证。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 22 }}>
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>PAIRING CHECK · {phase < 0 ? "等待回忆" : phase + 1 + " / 4"}</div>
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {PAIRS.map(([from, to, meaning, result, color], index) => {
              const active = index === phase;
              return <div key={from + "-" + to} style={{ display: "grid", gridTemplateColumns: "1.12fr auto 0.88fr", alignItems: "center", gap: 10, padding: "13px 14px", border: "1px solid " + (active ? color : COLORS.border), borderLeft: "3px solid " + color, borderRadius: 6, backgroundColor: active ? color + "12" : "rgba(255,255,255,0.48)", ...reveal(frame, 12 + index * 16) }}>
                <div style={{ color: COLORS.text, fontFamily: CODE_FONT, fontSize: 14, fontWeight: 800 }}>{from}</div>
                <div style={{ color: active ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 20 }}>→</div>
                <div><div style={{ color: active ? color : COLORS.text, fontFamily: CODE_FONT, fontSize: 14, fontWeight: 800 }}>{to}</div><div style={{ marginTop: 4, color: COLORS.muted, fontSize: 12 }}>{meaning}</div></div>
                <div style={{ gridColumn: "1 / -1", color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{result}</div>
              </div>;
            })}
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="new Widget[3] 用 delete 释放，能说只是少析构吗？" duration={5} color={COLORS.danger} hint="先给出标准术语：undefined behavior" /></div>}
        </Card>
        <Card strong style={{ padding: "26px 24px", borderLeft: "4px solid " + current[4] }}>
          <div style={{ color: current[4], fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>CURRENT CASE</div>
          <div style={{ marginTop: 22, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 31, fontWeight: 700, lineHeight: 1.25 }}>{current[0]} <span style={{ color: COLORS.faint }}>→</span> {current[1]}</div>
          <div style={{ marginTop: 22, padding: "18px 18px", border: "1px solid " + current[4] + "44", borderRadius: 7, backgroundColor: current[4] + "10", color: current[4], fontFamily: CODE_FONT, fontSize: 20, fontWeight: 800 }}>{current[3]}</div>
          <div style={{ marginTop: 24, color: COLORS.muted, fontSize: 17, lineHeight: 1.5 }}>{phase === 3 ? "不能承诺‘只析构第一个’或‘一定马上崩溃’。一旦配对不匹配，程序就进入未定义行为。" : "先确认是谁分配，再确认由谁释放；三组正确配对都保持同一套接口层级。"}</div>
          <div style={{ marginTop: 25, padding: "16px 16px", border: "1px solid " + COLORS.border, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.5)" }}>
            <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>记忆行</div>
            <div style={{ marginTop: 10, color: COLORS.text, fontFamily: CODE_FONT, fontSize: 16, lineHeight: 1.8 }}>new → delete<br />new[] → delete[]<br />malloc → free</div>
          </div>
        </Card>
      </div>
      <Caption frame={frame} label="错误预警" title="未定义行为不是‘大概率没问题’" body="基本类型混用时可能暂时看不出异常，仍然不能当作安全；换编译器、平台或对象类型，问题可能立刻暴露。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const DANGLING_CODE = [
  "Widget* p = new Widget;",
  "delete p;",
  "use(p);       // ❌ dangling",
  "p = nullptr; // ✅",
  "delete p;     // safe",
];
const DanglingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(4);
  const phase = promptDone ? Math.min(2, Math.floor((frame - seconds(4)) / (seconds(18) / 3))) : -1;
  const activeLine = phase < 0 ? 1 : [1, 3, 4][phase];
  const state = phase < 0 ? ["等待判断", "释放后地址还在吗？", COLORS.active] as const : phase === 0 ? ["悬空指针", "p 仍保存旧地址，但对象已经不存在", COLORS.danger] as const : phase === 1 ? ["主动置空", "p = nullptr，让句柄明确表示‘没有对象’", COLORS.violet] as const : ["安全空指针", "delete nullptr 不执行释放动作，可以安全调用", COLORS.result] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="悬空指针" title="delete 不会自动把指针变成 nullptr" />
      <SceneTitle frame={frame} eyebrow="机制场景 04" title="对象消失了，指针变量不会替你改写" detail="释放的是对象和存储，不是指针变量本身；要避免后续误用，释放后主动置为 nullptr。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <CodePanel title="dangling-pointer.cpp" lines={DANGLING_CODE} activeLine={activeLine} style={{ height: 520 }} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>POINTER STATE · {phase < 0 ? "等待回忆" : phase + 1 + " / 3"}</div>
          <div style={{ marginTop: 18, padding: "18px 18px", border: "2px solid " + state[2], borderRadius: 8, backgroundColor: state[2] + "10" }}>
            <div style={{ color: state[2], fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{state[0]}</div>
            <div style={{ marginTop: 11, color: COLORS.text, fontSize: 16, fontWeight: 750, lineHeight: 1.45 }}>{state[1]}</div>
          </div>
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ minHeight: 148, padding: "16px 14px", border: "1px solid " + (phase === 1 || phase === 2 ? COLORS.border : COLORS.danger), borderRadius: 7, backgroundColor: phase === 0 ? COLORS.danger + "10" : "rgba(255,255,255,0.48)" }}>
              <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>p 的值</div>
              <div style={{ marginTop: 22, color: phase === 1 || phase === 2 ? COLORS.violet : COLORS.danger, fontFamily: CODE_FONT, fontSize: 22, fontWeight: 800 }}>{phase === 1 || phase === 2 ? "nullptr" : "0xA100"}</div>
              <div style={{ marginTop: 10, color: COLORS.muted, fontSize: 13 }}>{phase === 0 ? "旧地址，不能解引用" : "句柄状态明确"}</div>
            </div>
            <div style={{ minHeight: 148, padding: "16px 14px", border: "1px solid " + (phase === 0 ? COLORS.danger : COLORS.border), borderRadius: 7, backgroundColor: phase === 0 ? COLORS.danger + "10" : "rgba(255,255,255,0.48)" }}>
              <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>对象存储</div>
              <div style={{ marginTop: 22, color: phase === 0 ? COLORS.danger : COLORS.faint, fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{phase < 0 ? "unknown" : "released"}</div>
              <div style={{ marginTop: 10, color: COLORS.muted, fontSize: 13 }}>{phase === 0 ? "地址可能被重新使用" : "没有可释放对象"}</div>
            </div>
          </div>
          <div style={{ marginTop: 20, padding: "15px 16px", borderLeft: "3px solid " + state[2], backgroundColor: state[2] + "10", color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{phase === 2 ? "delete nullptr 本身安全，但它不是修复悬空指针的替代品；关键动作是释放后及时置空。" : "指针值和指针指向的对象不是同一个东西。"} </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="delete 之后，指针会自动变成 nullptr 吗？" duration={4} color={COLORS.danger} hint="不会；它会留下旧地址，变成悬空指针" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="指针边界" title="释放对象 ≠ 清空指针" body="释放后立即 p = nullptr；这样既避免继续解引用旧地址，也让后续 delete nullptr 保持安全。" color={COLORS.violet} />
    </AbsoluteFill>
  );
};

const EMBEDDED_RULES = [
  ["静态分配优先", "编译期确定", "先减少碎片、失败路径和长期运行的不确定性", COLORS.active],
  ["固定块内存池", "上限可证明", "对象大小固定时，池更容易给出容量和最坏时延", COLORS.compare],
  ["资源绑定所有权", "RAII / owner", "析构不完整可能让外设、DMA 或锁没有正确收尾", COLORS.violet],
  ["失败必须可处理", "nullptr / 异常", "申请失败、提前返回和所有权转移都要有明确路径", COLORS.danger],
] as const;
const EmbeddedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(4);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(4)) / seconds(5))) : -1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="嵌入式边界" title="析构正确，还要问资源和时延是否可控" />
      <SceneTitle frame={frame} eyebrow="工程场景" title="delete 语义要服从 MCU 的资源模型" detail="在嵌入式里，数组析构不完整可能留下外设、DMA 或锁；频繁动态分配还会带来碎片和不可证明的时延。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {EMBEDDED_RULES.map(([title, code, detail, color], index) => {
          const active = index === phase;
          return <Card key={title} strong style={{ minHeight: 194, padding: "21px 22px", borderTop: "4px solid " + color, borderColor: active ? color : COLORS.border, backgroundColor: active ? color + "10" : COLORS.strong, ...reveal(frame, index * 14, 18) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div><Badge color={color}>{active ? "当前策略" : "检查入口"}</Badge></div>
            <div style={{ marginTop: 13, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 10, color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{code}</div>
            <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 14, lineHeight: 1.4 }}>{detail}</div>
          </Card>;
        })}
      </div>
      {!promptDone && <div style={{ position: "absolute", left: 625, top: 368 }}><Prompt frame={frame} question="嵌入式里，delete[] 之外还要防什么？" duration={4} color={COLORS.compare} hint="先说资源收尾、碎片、失败和时延" /></div>}
      <Card strong style={{ position: "absolute", left: 72, right: 72, top: 778, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}><div style={{ color: COLORS.text, fontSize: 17, fontWeight: 800 }}>推荐顺序</div><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 14 }}>静态分配 → 固定块池 → 清晰所有权 → 可处理的失败路径</div></div>
      </Card>
      <Caption frame={frame} label="工程口诀" title="析构次数要对，资源边界也要能证明" body="RAII 能把资源和对象生命周期绑定，但不能自动消除堆碎片、内存不足或不确定分配时延。" color={COLORS.violet} />
    </AbsoluteFill>
  );
};

const FOLLOWUPS = [
  ["new 和 malloc 有什么区别？", "new 负责对象初始化并返回类型相关指针；malloc 只取得原始存储，返回 void*，不会调用构造函数。", COLORS.compare],
  ["delete 后指针变什么？", "指针变量仍然保留旧地址，已经悬空；释放后应立即置为 nullptr，避免继续误用。", COLORS.danger],
  ["delete nullptr 安全吗？", "安全。对空指针执行 delete 不产生释放动作；但它不能替代释放后置空，也不能修复已经发生的悬空访问。", COLORS.result],
  ["嵌入式一般怎么管理？", "静态分配为主，必要时使用固定块内存池或启动阶段一次分配，避免运行期频繁 new/delete。", COLORS.active],
] as const;
const FollowupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.min(3, Math.floor(frame / seconds(9)));
  const local = frame - index * seconds(9);
  const answer = local >= seconds(4);
  const [question, explanation, color] = FOLLOWUPS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="面试追问" title="先给结论，再补语言边界" tag="慢速复习 · 0:36" />
      <SceneTitle frame={frame} eyebrow={"追问 " + (index + 1) + " / 4"} title="不要把实现习惯说成语言保证" detail="每个追问先留 4 秒；答案覆盖对象语义、指针状态和嵌入式工程现实。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, display: "grid", gridTemplateColumns: "1.55fr 0.95fr", gap: 22 }}>
        <Card strong style={{ minHeight: 570, padding: "34px 38px", borderLeft: "4px solid " + color, ...reveal(frame) }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>INTERVIEW FOLLOW-UP</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <><div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 46, fontWeight: 800 }}>{Math.max(0, Math.ceil((seconds(4) - local) / FPS))}</div><div style={{ color: COLORS.muted, fontSize: 17 }}>先给结论，再说为什么。</div></div><div style={{ height: 6, marginTop: 24, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: clamp(local, 0, seconds(4)) * 100 + "%", backgroundColor: color, borderRadius: 999 }} /></div></> : <div style={{ marginTop: 34, padding: "20px 22px", border: "1px solid " + color + "44", borderRadius: 7, backgroundColor: color + "10", color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(4)) }}>{explanation}</div>}
        </Card>
        <Card strong style={{ minHeight: 570, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>REVIEW QUEUE</div>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>{FOLLOWUPS.map(([item], itemIndex) => <div key={item} style={{ padding: "14px 14px", border: "1px solid " + (itemIndex === index ? color : COLORS.border), borderRadius: 7, backgroundColor: itemIndex === index ? color + "10" : "rgba(255,255,255,0.48)", opacity: itemIndex > index ? 0.58 : 1 }}><div style={{ color: itemIndex === index ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(itemIndex + 1).padStart(2, "0")}</div><div style={{ marginTop: 7, color: COLORS.text, fontSize: 16, lineHeight: 1.4 }}>{item}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="面试追问 · 复述" title="先说语义，再补实现和平台边界" body="完整答案要同时说清：对象有没有构造、释放后指针是什么、以及嵌入式是否允许这种分配策略。" color={color} />
    </AbsoluteFill>
  );
};

const FINAL_ITEMS = [
  ["单个对象怎么释放？", "new T 对 delete；delete 结束 1 个对象的生命周期，再释放对应存储。", COLORS.active],
  ["数组怎么释放？", "new T[n] 对 delete[]；delete[] 逐个析构元素，再释放整个数组存储。", COLORS.compare],
  ["最容易错在哪里？", "new 和 new[] 绝不混用；释放后指针要置 nullptr，嵌入式优先静态分配或固定块池。", COLORS.result],
] as const;
const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const unit = seconds(6);
  const index = Math.min(2, Math.floor(frame / unit));
  const local = frame - index * unit;
  const answer = local >= seconds(3.2);
  const [question, answerText, color] = FINAL_ITEMS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="最终复述" title="最后一次：不看答案，自己说出来" tag="慢速复习 · 0:18" />
      <SceneTitle frame={frame} eyebrow="记忆收束" title="把这道题压缩成三个面试句子" detail="只要能说清对象数量、数组析构和配对边界，这道题就不容易在追问中失分。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
        <Card strong style={{ minHeight: 565, padding: "32px 38px", borderLeft: "4px solid " + color }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>FINAL RECALL · {index + 1}/3</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <div style={{ marginTop: 28, color: COLORS.muted, fontSize: 17 }}>先停 3.2 秒，再继续。</div> : <div style={{ marginTop: 32, padding: "18px 20px", border: "1px solid " + color + "44", borderRadius: 7, backgroundColor: color + "10", color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(3.2)) }}>{answerText}</div>}
        </Card>
        <Card strong style={{ minHeight: 565, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>ONE-LINE SUMMARY</div>
          <div style={{ marginTop: 28, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 34, fontWeight: 700 }}>same level, same pair</div>
          <div style={{ marginTop: 22, display: "grid", gap: 12 }}>{[["单个", "new → delete"], ["数组", "new[] → delete[]"], ["指针", "delete 后 → nullptr"], ["工程", "静态 / 固定块优先"]].map(([label, text], itemIndex) => <div key={label} style={{ padding: "13px 16px", border: "1px solid " + (itemIndex === index ? color : COLORS.border), borderRadius: 7, backgroundColor: itemIndex === index ? color + "10" : "rgba(255,255,255,0.48)" }}><div style={{ color: itemIndex === index ? color : COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 5, color: COLORS.text, fontSize: 16, fontWeight: 700 }}>{text}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="复习完成" title="delete 释放一个对象，delete[] 释放一组对象；混用是未定义行为" body="下次看到这道题，先看分配表达式有没有 []，再检查析构数量、指针状态和嵌入式资源边界。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

export const DeleteArrayQ11Video: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const starts = {
    opening: 0,
    map: SCENE.opening,
    single: SCENE.opening + SCENE.map,
    array: SCENE.opening + SCENE.map + SCENE.single,
    pairing: SCENE.opening + SCENE.map + SCENE.single + SCENE.array,
    dangling: SCENE.opening + SCENE.map + SCENE.single + SCENE.array + SCENE.pairing,
    embedded: SCENE.opening + SCENE.map + SCENE.single + SCENE.array + SCENE.pairing + SCENE.dangling,
    followups: SCENE.opening + SCENE.map + SCENE.single + SCENE.array + SCENE.pairing + SCENE.dangling + SCENE.embedded,
    final: SCENE.opening + SCENE.map + SCENE.single + SCENE.array + SCENE.pairing + SCENE.dangling + SCENE.embedded + SCENE.followups,
  };
  return (
    <AbsoluteFill style={{ fontFamily: BODY_FONT, color: COLORS.text, overflow: "hidden" }}>
      <Background />
      <Sequence from={starts.opening} durationInFrames={SCENE.opening}><Opening /></Sequence>
      <Sequence from={starts.map} durationInFrames={SCENE.map}><MapScene /></Sequence>
      <Sequence from={starts.single} durationInFrames={SCENE.single}><SingleScene /></Sequence>
      <Sequence from={starts.array} durationInFrames={SCENE.array}><ArrayScene /></Sequence>
      <Sequence from={starts.pairing} durationInFrames={SCENE.pairing}><PairingScene /></Sequence>
      <Sequence from={starts.dangling} durationInFrames={SCENE.dangling}><DanglingScene /></Sequence>
      <Sequence from={starts.embedded} durationInFrames={SCENE.embedded}><EmbeddedScene /></Sequence>
      <Sequence from={starts.followups} durationInFrames={SCENE.followups}><FollowupScene /></Sequence>
      <Sequence from={starts.final} durationInFrames={SCENE.final}><FinalScene /></Sequence>
      <div style={{ position: "absolute", left: 58, right: 58, bottom: 22, height: 4, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: progress * 100 + "%", borderRadius: 999, backgroundColor: COLORS.accent }} /></div>
      <div style={{ position: "absolute", right: 58, bottom: 31, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 700 }}>Q11 · delete/delete[] · 3:38</div>
    </AbsoluteFill>
  );
};

export const DeleteArrayQ11Composition = () => <Composition id="DeleteArrayQ11" component={DeleteArrayQ11Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />;
