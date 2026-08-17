import { AbsoluteFill, Composition, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Fragment } from "react";
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
  opening: seconds(14),
  map: seconds(16),
  raw: seconds(36),
  arrays: seconds(34),
  mismatch: seconds(36),
  embedded: seconds(30),
  followups: seconds(48),
  final: seconds(24),
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
    transform: `translateY(${interpolate(frame, [from, from + 24], immediate ? [3, 0] : [distance, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    })}px)`,
  };
};

const Card: React.FC<{ children: ReactNode; style?: CSSProperties; strong?: boolean }> = ({ children, style, strong }) => (
  <div style={{
    border: `1px solid ${COLORS.border}`,
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

const TopBar: React.FC<{ frame: number; section: string; title: string; tag?: string }> = ({ frame, section, title, tag = "慢速复习 · 3:58" }) => (
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
      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 760, whiteSpace: "nowrap" }}>第 10 题</div>
      <div style={{ color: COLORS.muted, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{section} · {title}</div>
    </div>
    <div style={{ flex: "0 0 auto", padding: "8px 11px", border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 700 }}>{tag}</div>
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
    borderTop: `3px solid ${color}`,
    ...reveal(frame),
  }}>
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

const Prompt: React.FC<{ frame: number; question: string; seconds: number; color?: string; hint?: string }> = ({ frame, question, seconds: duration, color = COLORS.active, hint = "先在脑中说一遍，再看标准说法" }) => {
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
    <div style={{ padding: "18px 18px", fontFamily: CODE_FONT, fontSize: 17, lineHeight: 1.7 }}>
      {lines.map((line, index) => {
        const active = index === activeLine;
        return (
          <div key={`${title}-${index}`} style={{ display: "flex", minHeight: 34, padding: "0 10px", borderRadius: 5, backgroundColor: active ? `${COLORS.compare}16` : "transparent", color: active ? COLORS.text : COLORS.text, opacity: activeLine >= 0 && index > activeLine + 2 ? 0.44 : 1 }}>
            <span style={{ width: 31, color: active ? COLORS.compare : COLORS.faint, fontSize: 14 }}>{String(index + 1).padStart(2, "0")}</span>
            <span style={{ whiteSpace: "pre" }}>{line}</span>
          </div>
        );
      })}
    </div>
  </Card>
);

const Badge: React.FC<{ children: ReactNode; color: string }> = ({ children, color }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 11px", border: `1px solid ${color}55`, borderRadius: 6, backgroundColor: `${color}12`, color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 750 }}>
    <span style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: color }} />
    {children}
  </div>
);

const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const done = frame >= seconds(6);
  const cards = [
    ["01", "原始内存", "malloc 只交付一块字节存储，不负责构造对象", COLORS.compare],
    ["02", "对象生命周期", "new/delete 把分配、构造、析构和释放连起来", COLORS.active],
    ["03", "配对与边界", "new[] 要配 delete[]，嵌入式还要控制碎片和时延", COLORS.danger],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="主动回忆" title="malloc/free 和 new/delete 有什么区别？" />
      <SceneTitle frame={frame} eyebrow="复习目标" title="拿到一块内存，不等于得到一个对象" detail="这道题要把分配、初始化、析构、释放和工程边界拆开说清。" />
      <div style={{ position: "absolute", left: 72, top: 304, right: 72, display: "flex", gap: 26, alignItems: "stretch" }}>
        <Prompt frame={frame} question="malloc/free 和 new/delete，到底谁负责什么？" seconds={6} color={COLORS.active} hint="先抓住两个词：原始内存，还是对象生命周期" />
        <Card strong style={{ flex: 1, padding: "28px 30px", opacity: done ? 1 : 0.42, transform: `translateX(${done ? 0 : 18}px)` }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>本题路线</div>
          <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
            {cards.map(([number, label, detail, color]) => (
              <div key={number} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "center", padding: "12px 14px", border: `1px solid ${COLORS.border}`, borderRadius: 8, backgroundColor: `${color}0b` }}>
                <div style={{ color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{number}</div>
                <div><div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 4, color: COLORS.muted, fontSize: 14 }}>{detail}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Caption frame={frame} label="本题总纲" title="malloc 管字节，new 管对象" body="面试回答先说本质，再补失败处理、数组配对和嵌入式动态分配边界。" />
    </AbsoluteFill>
  );
};

const MAP_ITEMS = [
  ["malloc / free", "原始存储", "手动计算字节数；返回失败值；不调用构造和析构", COLORS.compare],
  ["new / delete", "对象生命周期", "类型安全；构造对象；delete 结束生命周期后再归还存储", COLORS.active],
  ["共同边界", "必须成对", "new[] / delete[]、malloc / free；错误混用直接进入未定义行为", COLORS.danger],
] as const;
const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flow = ["allocate", "initialize", "use", "destroy", "release"];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="答案地图" title="先分配，再谈对象生命周期" />
      <SceneTitle frame={frame} eyebrow="答案地图" title="同一块 RAM，两个抽象层" detail="malloc/free 只处理存储；new/delete 还负责把存储变成对象，并按类型结束对象生命周期。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {MAP_ITEMS.map(([title, code, detail, color], index) => (
          <Card key={title} strong style={{ minHeight: 296, padding: "26px 24px", borderTop: `4px solid ${color}`, ...reveal(frame, index * 24, 20) }}>
            <div style={{ color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div>
            <div style={{ marginTop: 20, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 29, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 22, padding: "12px 14px", borderRadius: 6, backgroundColor: `${color}10`, color, fontFamily: CODE_FONT, fontSize: 16 }}>{code}</div>
            <div style={{ marginTop: 15, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{detail}</div>
          </Card>
        ))}
      </div>
      <Card strong style={{ position: "absolute", left: 72, right: 72, top: 650, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {flow.map((item, index) => <Fragment key={item}><div style={{ flex: 1, padding: "11px 12px", textAlign: "center", border: `1px solid ${index === 1 || index === 3 ? COLORS.active : COLORS.border}`, borderRadius: 6, backgroundColor: index === 1 || index === 3 ? `${COLORS.active}10` : "rgba(255,255,255,0.46)", color: index === 1 || index === 3 ? COLORS.active : COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{item}</div>{index < flow.length - 1 && <div style={{ color: COLORS.faint, fontFamily: CODE_FONT, fontSize: 17 }}>→</div>}</Fragment>)}
        </div>
      </Card>
      <Caption frame={frame} label="一句话结论" title="new 不只是 malloc 的另一种写法" body="可以把 new 看成‘取得存储 + 初始化对象’，delete 看成‘结束对象生命周期 + 释放存储’，但底层分配器和语言运算符仍是两个层次。" color={COLORS.active} />
    </AbsoluteFill>
  );
};

const RAW_CODE = [
  "void* storage = std::malloc(sizeof(Device));",
  "Device* raw = static_cast<Device*>(storage);",
  "// raw 仍不是已构造的 Device",
  "Device* dev = new (storage) Device(17);",
  "dev->~Device(); std::free(storage);",
];
const RAW_STEPS = [
  ["拿到字节", "malloc", "只有一块可用存储，构造函数没有运行", COLORS.compare],
  ["解释地址", "Device*", "类型指针改变看法，不会凭空启动对象生命周期", COLORS.danger],
  ["开始生命周期", "placement new", "构造函数运行，Device 对象才真正出现", COLORS.active],
  ["结束并归还", "析构 → free", "先结束对象，再把原始存储交还给分配器", COLORS.result],
] as const;
const RawScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(6);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(6)) / seconds(7.5))) : -1;
  const activeLine = phase < 0 ? 0 : [0, 1, 3, 4][phase];
  const current = phase < 0 ? ["等待定位", "先区分存储和对象", "—", "malloc 不负责构造 Device", COLORS.active] as const : RAW_STEPS[phase];
  const currentColor = current[4] ?? COLORS.active;
  const objectLive = phase === 2;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="原始内存" title="malloc 只给存储，new 才建立对象" />
      <SceneTitle frame={frame} eyebrow="机制场景 01" title="字节存储和对象生命周期是两件事" detail="在 C++ 中，拿到一段地址以后，还要确认对象何时构造、何时析构。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <CodePanel title="raw-storage.cpp" lines={RAW_CODE} activeLine={activeLine} style={{ height: 520 }} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>OBJECT LIFETIME · {phase < 0 ? "等待回忆" : `${phase + 1} / 4`}</div>
          <div style={{ marginTop: 18, padding: "18px 18px", border: `2px solid ${currentColor}`, borderRadius: 8, backgroundColor: `${currentColor}10` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div style={{ color: currentColor, fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{current[0]}</div><Badge color={currentColor}>{current[1]}</Badge></div>
            <div style={{ marginTop: 12, color: COLORS.text, fontSize: 16, fontWeight: 750 }}>{current[2]}</div>
          </div>
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {Array.from({ length: 4 }, (_, index) => <div key={index} style={{ height: 84, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${phase >= 0 && index <= phase ? currentColor : COLORS.border}`, borderRadius: 6, backgroundColor: phase >= 0 && index <= phase ? `${currentColor}12` : "rgba(255,255,255,0.48)", color: phase >= 0 && index <= phase ? currentColor : COLORS.faint, fontFamily: CODE_FONT, fontSize: 12 }}>slot {index}</div>)}
          </div>
          <div style={{ marginTop: 20, padding: "16px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}><span>Device instance</span><span style={{ color: objectLive ? COLORS.active : COLORS.faint }}>{objectLive ? "1 live" : "0 live"}</span></div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{["ctor", "state", "dtor"].map((label, index) => <div key={label} style={{ padding: "10px 8px", textAlign: "center", border: `1px solid ${objectLive && index < 2 ? COLORS.active : phase === 3 && index === 2 ? COLORS.result : COLORS.border}`, borderRadius: 5, color: objectLive && index < 2 ? COLORS.active : phase === 3 && index === 2 ? COLORS.result : COLORS.faint, fontFamily: CODE_FONT, fontSize: 11 }}>{label}</div>)}</div>
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="static_cast<Device*>(storage) 后，构造函数运行了吗？" seconds={6} color={COLORS.active} hint="先分清‘有地址’和‘有对象’" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="生命周期边界" title="类型指针不是构造函数" body="如果用 malloc 承载非平凡 C++ 对象，需要 placement new 开始生命周期，并显式调用析构函数后再 free；普通 C++ 代码优先直接使用 new/delete 或 RAII。" color={COLORS.compare} />
    </AbsoluteFill>
  );
};

const ARRAY_CODE = [
  "Device* one = new Device;",
  "delete one;",
  "",
  "Device* many = new Device[3];",
  "delete[] many;",
];
const ARRAY_STEPS = [
  ["单个对象", "new Device", "构造 1 次，delete 只结束 1 个对象", COLORS.active],
  ["对象数组", "new Device[3]", "连续创建 3 个元素，每个元素都有生命周期", COLORS.compare],
  ["逐个析构", "delete[]", "数组释放时要按数组形式调用 3 次析构", COLORS.result],
] as const;
const ArrayScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(2, Math.floor((frame - seconds(5)) / (seconds(29) / 3))) : -1;
  const activeLine = phase < 0 ? 0 : [0, 3, 4][phase];
  const current = phase < 0 ? ["等待判断", "先比较单个和数组", "—", "不要把 delete 当成 delete[]", COLORS.active] as const : ARRAY_STEPS[phase];
  const liveCount = phase < 0 ? "?" : phase === 0 ? "1" : phase === 1 ? "3" : "0";
  const constructCount = phase < 0 ? "?" : phase === 0 ? "1 ctor" : "3 ctor";
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="数组配对" title="new[] 必须配 delete[]" />
      <SceneTitle frame={frame} eyebrow="机制场景 02" title="数组释放，关键是析构次数和数组边界" detail="单个对象和对象数组都由 new 创建，但释放表达式必须保留同一层级。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 22 }}>
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>CONSTRUCTOR / DESTRUCTOR TRACE</div><div style={{ color: current[4], fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>live objects: {liveCount}</div></div>
          <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
            {["allocate", "construct", "destroy", "release"].map((label, index) => { const active = (phase === 0 && index < 2) || (phase === 1 && index < 2) || (phase === 2 && index >= 2); return <div key={label} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", alignItems: "center", gap: 12, padding: "14px 14px", border: `1px solid ${active ? current[4] : COLORS.border}`, borderRadius: 7, backgroundColor: active ? `${current[4]}10` : "rgba(255,255,255,0.48)" }}><div style={{ color: active ? current[4] : COLORS.faint, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{index + 1}</div><div style={{ color: COLORS.text, fontSize: 17, fontWeight: 750 }}>{label}</div><div style={{ color: active ? current[4] : COLORS.faint, fontFamily: CODE_FONT, fontSize: 13 }}>{index === 1 ? constructCount : index === 2 ? phase === 2 ? "3× dtor" : "—" : ""}</div></div>; })}
          </div>
          <div style={{ marginTop: 24, padding: "17px 16px", borderLeft: `3px solid ${current[4]}`, backgroundColor: `${current[4]}10`, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{current[2]}</div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="new Device[3] 最后应该调用几次析构？" seconds={5} color={COLORS.compare} hint="数组有 3 个元素，释放形式也要是数组形式" /></div>}
        </Card>
        <CodePanel title="array-lifetime.cpp" lines={ARRAY_CODE} activeLine={activeLine} style={{ height: 520 }} />
      </div>
      <Caption frame={frame} label="配对口诀" title="new 对 delete，new[] 对 delete[]" body="基本类型数组混用时可能‘看起来没事’，也仍然是未定义行为；带析构函数的对象数组更容易暴露问题。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

const PAIRS = [
  ["malloc", "free", "原始字节存储", "正确", COLORS.result],
  ["new", "delete", "单个对象", "正确", COLORS.active],
  ["new[]", "delete[]", "对象数组", "正确", COLORS.compare],
  ["new[]", "delete / free", "层级不匹配", "未定义行为", COLORS.danger],
] as const;
const MismatchScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(5)) / (seconds(31) / 4))) : -1;
  const current = phase < 0 ? ["等待检查", "先逐行对照释放方", "—", "不要把‘释放成功’当成‘行为定义’", COLORS.active] as const : PAIRS[phase];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="错误配对" title="混用不是风格问题，而是未定义行为" />
      <SceneTitle frame={frame} eyebrow="机制场景 03" title="释放函数必须记得是谁分配的" detail="错误配对可能少析构、多析构、破坏分配器元数据，结果不能靠‘这次没崩’证明正确。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 22 }}>
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>PAIRING CHECK · {phase < 0 ? "等待回忆" : `${phase + 1} / 4`}</div>
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {PAIRS.map(([from, to, meaning, result, color], index) => { const active = index === phase; return <div key={`${from}-${to}`} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, padding: "13px 14px", border: `1px solid ${active ? color : COLORS.border}`, borderLeft: `3px solid ${color}`, borderRadius: 6, backgroundColor: active ? `${color}12` : "rgba(255,255,255,0.48)", ...reveal(frame, 12 + index * 16) }}><div style={{ color: COLORS.text, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{from}</div><div style={{ color: active ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 20 }}>→</div><div><div style={{ color: active ? color : COLORS.text, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{to}</div><div style={{ marginTop: 4, color: COLORS.muted, fontSize: 12 }}>{meaning}</div></div><div style={{ gridColumn: "1 / -1", color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{result}</div></div>; })}
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="new Device[3] 用 delete 释放，能说‘只是少析构’吗？" seconds={5} color={COLORS.danger} hint="先给出标准术语：undefined behavior" /></div>}
        </Card>
        <Card strong style={{ padding: "26px 24px", borderLeft: `4px solid ${current[4]}` }}>
          <div style={{ color: current[4], fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>CURRENT CASE</div>
          <div style={{ marginTop: 22, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 34, fontWeight: 700 }}>{current[0]} <span style={{ color: COLORS.faint }}>→</span> {current[1]}</div>
          <div style={{ marginTop: 22, padding: "18px 18px", border: `1px solid ${current[4]}44`, borderRadius: 7, backgroundColor: `${current[4]}10`, color: current[4], fontFamily: CODE_FONT, fontSize: 21, fontWeight: 800 }}>{current[3]}</div>
          <div style={{ marginTop: 24, color: COLORS.muted, fontSize: 17, lineHeight: 1.5 }}>{phase === 3 ? "不能把结果简化成‘析构一次还是三次’。接口层级已经不匹配，程序进入未定义行为，任何结果都不能作为正确性依据。" : "先确认分配接口，再确认释放接口；两边必须来自同一套配对规则。"}</div>
          <div style={{ marginTop: 25, padding: "16px 16px", border: `1px solid ${COLORS.border}`, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.5)" }}><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>坏例子</div><div style={{ marginTop: 10, color: COLORS.danger, fontFamily: CODE_FONT, fontSize: 15, lineHeight: 1.7 }}>new Device[3] → delete<br />new Device → free</div></div>
        </Card>
      </div>
      <Caption frame={frame} label="错误预警" title="未定义行为不是‘大概率没问题’" body="delete 后指针还保留旧地址，继续使用会变成悬空指针；释放后应立即置为 nullptr，并让所有权路径保持清楚。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const EMBEDDED_RULES = [
  ["优先静态分配", "编译期确定", "RAM 有限时先消除碎片和失败路径", COLORS.active],
  ["启动阶段一次分配", "运行期稳定", "如果必须动态申请，尽量在初始化阶段完成", COLORS.compare],
  ["固定块内存池", "上限可证明", "对象大小固定时，池比通用堆更容易做最坏情况分析", COLORS.violet],
  ["失败与所有权", "必须可处理", "检查 nullptr / bad_alloc，确保每条路径都能释放", COLORS.danger],
] as const;
const EmbeddedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(5)) / seconds(6.25))) : -1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="嵌入式边界" title="能用动态内存，不代表应该频繁用" />
      <SceneTitle frame={frame} eyebrow="工程场景" title="把对象语义和实时性要求一起考虑" detail="嵌入式系统关注的不只是‘能不能申请到’，还要问碎片、最坏时延、泄漏和长期运行稳定性。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {EMBEDDED_RULES.map(([title, code, detail, color], index) => { const active = index === phase; return <Card key={title} strong style={{ minHeight: 214, padding: "22px 22px", borderTop: `4px solid ${color}`, borderColor: active ? color : COLORS.border, backgroundColor: active ? `${color}10` : COLORS.strong, ...reveal(frame, index * 14, 18) }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div><Badge color={color}>{active ? "当前策略" : "检查入口"}</Badge></div><div style={{ marginTop: 14, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 25, fontWeight: 700 }}>{title}</div><div style={{ marginTop: 11, color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{code}</div><div style={{ marginTop: 9, color: COLORS.muted, fontSize: 14, lineHeight: 1.4 }}>{detail}</div></Card>; })}
      </div>
      {!promptDone && <div style={{ position: "absolute", left: 625, top: 366 }}><Prompt frame={frame} question="嵌入式里，动态分配最该先防什么？" seconds={5} color={COLORS.compare} hint="先说 RAM、碎片、时延和长期稳定性" /></div>}
      <Card strong style={{ position: "absolute", left: 72, right: 72, top: 780, padding: "14px 18px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}><div style={{ color: COLORS.text, fontSize: 17, fontWeight: 800 }}>推荐顺序</div><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 14 }}>静态分配 → 固定块池 → 启动时一次分配 → 受控的 RAII</div></div></Card>
      <Caption frame={frame} label="工程口诀" title="动态分配要有上限、有失败策略、有所有权" body="C++ 的 RAII 能减少泄漏，但不能自动消除堆碎片或不确定分配时延；资源模型仍要服从 MCU / RTOS 的约束。" color={COLORS.violet} />
    </AbsoluteFill>
  );
};

const FOLLOWUPS = [
  ["new 的底层一定直接调用 malloc 吗？", "不一定。new-expression 通常先调用匹配的 operator new，再完成对象初始化；具体分配器可以是堆、内存池或自定义实现。", COLORS.compare],
  ["malloc 失败和 new 失败一样吗？", "malloc 失败通常返回 nullptr；普通 new 失败默认抛 std::bad_alloc，也可以用 new (std::nothrow) 让它返回 nullptr。", COLORS.active],
  ["delete 之后指针会自动变 nullptr 吗？", "不会。指针变量仍保留旧地址，已经悬空；释放后应立即置为 nullptr，避免后续误用。delete nullptr 本身是安全的。", COLORS.danger],
  ["嵌入式为什么不建议频繁 new/delete？", "RAM 有限，通用堆会带来碎片、泄漏和难以证明的分配时延；更稳的选择通常是静态分配、固定块池或启动时一次分配。", COLORS.result],
] as const;
const FollowupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.min(3, Math.floor(frame / seconds(12)));
  const local = frame - index * seconds(12);
  const answer = local >= seconds(5);
  const [question, explanation, color] = FOLLOWUPS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="面试追问" title="先回答，再补标准边界" tag="慢速复习 · 0:48" />
      <SceneTitle frame={frame} eyebrow={`追问 ${index + 1} / 4`} title="不要把实现习惯说成语言保证" detail="每个追问先留 5 秒；答案要同时覆盖标准语义和目标平台的工程现实。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, display: "grid", gridTemplateColumns: "1.55fr 0.95fr", gap: 22 }}>
        <Card strong style={{ minHeight: 570, padding: "34px 38px", borderLeft: `4px solid ${color}`, ...reveal(frame) }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>INTERVIEW FOLLOW-UP</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <><div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 46, fontWeight: 800 }}>{Math.max(0, Math.ceil((seconds(5) - local) / FPS))}</div><div style={{ color: COLORS.muted, fontSize: 17 }}>先给结论，再说为什么。</div></div><div style={{ height: 6, marginTop: 24, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: `${clamp(local, 0, seconds(5)) * 100}%`, backgroundColor: color, borderRadius: 999 }} /></div></> : <div style={{ marginTop: 34, padding: "20px 22px", border: `1px solid ${color}44`, borderRadius: 7, backgroundColor: `${color}10`, color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(5)) }}>{explanation}</div>}
        </Card>
        <Card strong style={{ minHeight: 570, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>REVIEW QUEUE</div>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>{FOLLOWUPS.map(([item], itemIndex) => <div key={item} style={{ padding: "14px 14px", border: `1px solid ${itemIndex === index ? color : COLORS.border}`, borderRadius: 7, backgroundColor: itemIndex === index ? `${color}10` : "rgba(255,255,255,0.48)", opacity: itemIndex > index ? 0.58 : 1 }}><div style={{ color: itemIndex === index ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(itemIndex + 1).padStart(2, "0")}</div><div style={{ marginTop: 7, color: COLORS.text, fontSize: 16, lineHeight: 1.4 }}>{item}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="面试追问 · 复述" title="先说语言语义，再补实现和工程边界" body="‘new 就是 malloc’、‘delete 后指针自动为空’、‘RAII 解决所有堆问题’都不是完整答案。" color={color} />
    </AbsoluteFill>
  );
};

const FINAL_ITEMS = [
  ["malloc / free 管什么？", "只管理原始存储：手动算字节数、检查失败，并用 free 归还；不会替你构造和析构 C++ 对象。", COLORS.compare],
  ["new / delete 管什么？", "new-expression 取得存储并初始化对象，delete 先结束对象生命周期，再释放对应存储。", COLORS.active],
  ["数组怎么配对？", "new 对 delete，new[] 对 delete[]；混用是未定义行为，不能用‘没崩’证明正确。", COLORS.danger],
  ["嵌入式怎么选？", "静态分配优先，固定块池或启动时一次分配其次；动态分配必须有上限、失败处理和清晰所有权。", COLORS.result],
] as const;
const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const unit = seconds(6);
  const index = Math.min(3, Math.floor(frame / unit));
  const local = frame - index * unit;
  const answer = local >= seconds(3.8);
  const [question, answerText, color] = FINAL_ITEMS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="最终复述" title="最后一次：不看答案，自己说出来" tag="慢速复习 · 0:24" />
      <SceneTitle frame={frame} eyebrow="记忆收束" title="把这道题压缩成四个面试句子" detail="能把原始存储、对象生命周期、数组配对和嵌入式边界连起来，才算真正复习完成。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
        <Card strong style={{ minHeight: 565, padding: "32px 38px", borderLeft: `4px solid ${color}` }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>FINAL RECALL · {index + 1}/4</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <div style={{ marginTop: 28, color: COLORS.muted, fontSize: 17 }}>先停 3.8 秒，再继续。</div> : <div style={{ marginTop: 32, padding: "18px 20px", border: `1px solid ${color}44`, borderRadius: 7, backgroundColor: `${color}10`, color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(3.8)) }}>{answerText}</div>}
        </Card>
        <Card strong style={{ minHeight: 565, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>ONE-LINE SUMMARY</div>
          <div style={{ marginTop: 28, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 34, fontWeight: 700 }}>bytes ≠ object</div>
          <div style={{ marginTop: 22, display: "grid", gap: 12 }}>{[["分配", "谁拿到存储"], ["生命周期", "谁负责构造 / 析构"], ["配对", "谁负责释放"], ["工程", "是否可控、可证明"]].map(([label, text], itemIndex) => <div key={label} style={{ padding: "13px 16px", border: `1px solid ${itemIndex === index ? color : COLORS.border}`, borderRadius: 7, backgroundColor: itemIndex === index ? `${color}10` : "rgba(255,255,255,0.48)" }}><div style={{ color: itemIndex === index ? color : COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 5, color: COLORS.text, fontSize: 16, fontWeight: 700 }}>{text}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="复习完成" title="malloc 管字节，new 管对象；配对正确，边界清楚" body="下次看到动态内存题，先问对象是否构造，再问谁负责析构，最后检查释放配对和平台约束。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

export const MallocNewQ10Video: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const starts = {
    opening: 0,
    map: SCENE.opening,
    raw: SCENE.opening + SCENE.map,
    arrays: SCENE.opening + SCENE.map + SCENE.raw,
    mismatch: SCENE.opening + SCENE.map + SCENE.raw + SCENE.arrays,
    embedded: SCENE.opening + SCENE.map + SCENE.raw + SCENE.arrays + SCENE.mismatch,
    followups: SCENE.opening + SCENE.map + SCENE.raw + SCENE.arrays + SCENE.mismatch + SCENE.embedded,
    final: SCENE.opening + SCENE.map + SCENE.raw + SCENE.arrays + SCENE.mismatch + SCENE.embedded + SCENE.followups,
  };
  return (
    <AbsoluteFill style={{ fontFamily: BODY_FONT, color: COLORS.text, overflow: "hidden" }}>
      <Background />
      <Sequence from={starts.opening} durationInFrames={SCENE.opening}><Opening /></Sequence>
      <Sequence from={starts.map} durationInFrames={SCENE.map}><MapScene /></Sequence>
      <Sequence from={starts.raw} durationInFrames={SCENE.raw}><RawScene /></Sequence>
      <Sequence from={starts.arrays} durationInFrames={SCENE.arrays}><ArrayScene /></Sequence>
      <Sequence from={starts.mismatch} durationInFrames={SCENE.mismatch}><MismatchScene /></Sequence>
      <Sequence from={starts.embedded} durationInFrames={SCENE.embedded}><EmbeddedScene /></Sequence>
      <Sequence from={starts.followups} durationInFrames={SCENE.followups}><FollowupScene /></Sequence>
      <Sequence from={starts.final} durationInFrames={SCENE.final}><FinalScene /></Sequence>
      <div style={{ position: "absolute", left: 58, right: 58, bottom: 22, height: 4, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: `${progress * 100}%`, borderRadius: 999, backgroundColor: COLORS.accent }} /></div>
      <div style={{ position: "absolute", right: 58, bottom: 31, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 700 }}>Q10 · malloc/new · 3:58</div>
    </AbsoluteFill>
  );
};

export const MallocNewQ10Composition = () => <Composition id="MallocNewQ10" component={MallocNewQ10Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />;
