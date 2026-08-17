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
  leak: seconds(26),
  paths: seconds(32),
  cycle: seconds(26),
  prevent: seconds(30),
  tools: seconds(20),
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

const TopBar: React.FC<{ frame: number; section: string; title: string; tag?: string }> = ({ frame, section, title, tag = "慢速复习 · 3:34" }) => (
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
      <div style={{ color: COLORS.text, fontSize: 18, fontWeight: 760, whiteSpace: "nowrap" }}>第 12 题</div>
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
    ["01", "先看定义", "内存申请成功，但所有权路径断了，块变得不可达", COLORS.danger],
    ["02", "再看原因", "提前 return、错误分支、容器只增不删、循环引用", COLORS.compare],
    ["03", "最后防守", "RAII、成对释放、静态分配和堆监控", COLORS.active],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="主动回忆" title="什么是内存泄漏？如何避免？" />
      <SceneTitle frame={frame} eyebrow="复习目标" title="申请成功，不等于资源还可回收" detail="这道题要把‘内存还在’和‘程序还能找到它’分开，再把所有权闭环补回来。" />
      <div style={{ position: "absolute", left: 72, top: 304, right: 72, display: "flex", gap: 26, alignItems: "stretch" }}>
        <Prompt frame={frame} question="内存申请成功后，什么情况会让 RAM 回不来？" duration={6} color={COLORS.danger} hint="先抓住一个词：分配成功，但所有权断了" />
        <Card strong style={{ flex: 1, padding: "28px 30px", opacity: done ? 1 : 0.42, transform: "translateX(" + (done ? 0 : 18) + "px)" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, letterSpacing: 1.2 }}>本题路线</div>
          <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
            {route.map(([number, label, detail, color]) => (
              <div key={number} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "center", padding: "12px 14px", border: "1px solid " + COLORS.border, borderRadius: 8, backgroundColor: color + "0b" }}>
                <div style={{ color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{number}</div>
                <div><div style={{ color: COLORS.text, fontSize: 20, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 4, color: COLORS.muted, fontSize: 14 }}>{detail}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Caption frame={frame} label="本题总纲" title="内存泄漏 = 还占着内存，但程序已经找不到它" body="防泄漏不是只记一个 free，而是让每条所有权路径都能回到释放、转移或对象自动销毁。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    ["申请", "malloc / new", "得到一块内存", COLORS.compare],
    ["断链", "owner lost", "没有指针或所有者能到达它", COLORS.danger],
    ["累积", "free heap ↓", "长期运行，最终 OOM 或系统不可用", COLORS.active],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="答案地图" title="泄漏的本质，是可达性和所有权断开" />
      <SceneTitle frame={frame} eyebrow="答案地图" title="内存还在，但回收路径已经消失" detail="把泄漏想成一块没有入口的内存：它仍占着 RAM，却再也没有合法路径把它交还给分配器。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 302, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {items.map(([title, code, detail, color], index) => (
          <Card key={title} strong style={{ minHeight: 296, padding: "26px 24px", borderTop: "4px solid " + color, ...reveal(frame, index * 24, 20) }}>
            <div style={{ color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div>
            <div style={{ marginTop: 20, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 29, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 22, padding: "12px 14px", borderRadius: 6, backgroundColor: color + "10", color, fontFamily: CODE_FONT, fontSize: 16 }}>{code}</div>
            <div style={{ marginTop: 15, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{detail}</div>
          </Card>
        ))}
      </div>
      <Card strong style={{ position: "absolute", left: 72, right: 72, top: 654, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {["allocate", "own", "release", "or leak"].map((label, index) => (
            <span key={label} style={{ display: "flex", alignItems: "center", flex: 1, gap: 12 }}>
              <span style={{ flex: 1, padding: "11px 12px", textAlign: "center", border: "1px solid " + (index === 3 ? COLORS.danger : COLORS.border), borderRadius: 6, backgroundColor: index === 3 ? COLORS.danger + "10" : "rgba(255,255,255,0.46)", color: index === 3 ? COLORS.danger : COLORS.muted, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{label}</span>
              {index < 3 && <span style={{ color: COLORS.faint, fontFamily: CODE_FONT, fontSize: 17 }}>→</span>}
            </span>
          ))}
        </div>
      </Card>
      <Caption frame={frame} label="一句话结论" title="谁申请，谁负责让它最终可达并被释放" body="如果所有者丢了，free heap 会慢慢下降；嵌入式设备不会因为程序一直运行就自动把泄漏收回来。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const LEAK_CODE = [
  "void poll() {",
  "  Packet* p = new Packet;",
  "  if (read(p) < 0) return; // leak",
  "  process(p);",
  "  delete p;",
  "}",
];
const LeakScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(5)) / (seconds(21) / 4))) : -1;
  const activeLine = phase < 0 ? 1 : [1, 2, 2, 4][phase];
  const current = phase < 0 ? ["等待定位", "先找所有权", "申请成功后，谁负责把 Packet 交还？", COLORS.active] as const : [
    ["申请成功", "owner = p", "内存块可达，尚未泄漏", COLORS.compare],
    ["错误返回", "return", "函数离开，p 没有走到 delete", COLORS.danger],
    ["块不可达", "owner lost", "Packet 仍然存在，但没有合法指针能找到它", COLORS.danger],
    ["泄漏累积", "free heap ↓", "每次错误路径再留一块，长期运行最终耗尽 RAM", COLORS.violet],
  ][phase];
  const leakedBlocks = phase < 0 ? "?" : phase === 0 ? "0" : phase === 1 ? "1" : phase === 2 ? "2" : "4";
  const reachable = phase >= 0 && phase === 0;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="泄漏原理" title="内存块还在，但所有权已经断了" />
      <SceneTitle frame={frame} eyebrow="机制场景 01" title="提前 return，是最容易漏掉的一条路径" detail="错误不是 new 本身，而是函数离开时没有把已经申请的 Packet 交还给分配器。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <CodePanel title="leak-path.cpp" lines={LEAK_CODE} activeLine={activeLine} style={{ height: 520 }} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>OWNERSHIP TRACE · {phase < 0 ? "等待回忆" : phase + 1 + " / 4"}</div>
          <div style={{ marginTop: 18, padding: "18px 18px", border: "2px solid " + current[3], borderRadius: 8, backgroundColor: current[3] + "10" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div style={{ color: current[3], fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{current[0]}</div><Badge color={current[3]}>{current[1]}</Badge></div>
            <div style={{ marginTop: 12, color: COLORS.text, fontSize: 16, fontWeight: 750, lineHeight: 1.45 }}>{current[2]}</div>
          </div>
          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
            {["Packet block", "p / owner", "free heap"].map((label, index) => {
              const active = index === 0 ? phase >= 0 : index === 1 ? reachable : phase >= 2;
              const color = phase >= 2 && index !== 1 ? COLORS.danger : active ? current[3] : COLORS.faint;
              const value = index === 0 ? (phase < 0 ? "unknown" : "live") : index === 1 ? (reachable ? "p" : "lost") : (phase < 0 ? "256 KB" : phase === 0 ? "256 KB" : phase === 1 ? "255 KB" : phase === 2 ? "252 KB" : "248 KB");
              return <div key={label} style={{ minHeight: 92, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px", textAlign: "center", border: "1px solid " + (active ? color : COLORS.border), borderRadius: 6, backgroundColor: active ? color + "12" : "rgba(255,255,255,0.48)" }}><div style={{ color: active ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 12 }}>{label}</div><div style={{ marginTop: 10, color: active ? color : COLORS.faint, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{value}</div></div>;
            })}
          </div>
          <div style={{ marginTop: 20, padding: "16px 16px", border: "1px solid " + COLORS.border, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}><span>leaked blocks</span><span style={{ color: phase >= 1 ? COLORS.danger : COLORS.faint }}>{leakedBlocks}</span></div>
            <div style={{ marginTop: 13, height: 8, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: (phase < 0 ? 0 : phase === 0 ? 12 : phase === 1 ? 30 : phase === 2 ? 58 : 84) + "%", borderRadius: 999, backgroundColor: phase >= 1 ? COLORS.danger : COLORS.active }} /></div>
          </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="申请成功后，哪一条路径最可能造成泄漏？" duration={5} color={COLORS.danger} hint="先看 return、异常和所有权是否还在" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="泄漏定义" title="live block + owner lost = memory leak" body="内存泄漏不是‘申请失败’，而是申请成功后没有释放，而且程序已经失去找到这块内存的路径。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const PATH_CODE = [
  "char* buf = (char*)malloc(256);",
  "if (!buf) return -1;",
  "if (err) return -2; // leak",
  "use(buf);",
  "free(buf);",
  "return 0;",
];
const PATH_CODE_FIXED = [
  "char* buf = (char*)malloc(256);",
  "if (!buf) return -1;",
  "if (err) { free(buf); return -2; }",
  "use(buf);",
  "free(buf);",
  "return 0;",
];
const PathsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(5)) / (seconds(27) / 4))) : -1;
  const activeLine = phase < 0 ? 0 : [0, 2, 2, 4][phase];
  const code = phase >= 2 ? PATH_CODE_FIXED : PATH_CODE;
  const current = phase < 0 ? ["等待分叉", "先检查每条 return", "正常路径释放，不代表错误路径也释放", COLORS.active] as const : [
    ["申请完成", "buf owned", "buf 现在有明确所有者", COLORS.compare],
    ["坏的错误分支", "return -2", "提前返回跳过 free，buf 变成泄漏", COLORS.danger],
    ["修正错误分支", "free → return", "先释放，再返回；错误路径也闭环", COLORS.result],
    ["正常分支", "use → free", "使用完成后释放，所有路径都收口", COLORS.active],
  ][phase];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="路径检查" title="每条 return 都要回答：谁负责释放？" />
      <SceneTitle frame={frame} eyebrow="机制场景 02" title="正常路径正确，不等于错误路径安全" detail="代码审查看的不只是最后有没有 free，而是从每一个申请点出发，所有分支是否都能回到释放或所有权转移。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <CodePanel title="all-paths.cpp" lines={code} activeLine={activeLine} style={{ height: 520 }} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>PATH AUDIT · {phase < 0 ? "等待回忆" : phase + 1 + " / 4"}</div>
          <div style={{ marginTop: 18, padding: "18px 18px", border: "2px solid " + current[3], borderRadius: 8, backgroundColor: current[3] + "10" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div style={{ color: current[3], fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{current[0]}</div><Badge color={current[3]}>{current[1]}</Badge></div>
            <div style={{ marginTop: 12, color: COLORS.text, fontSize: 16, fontWeight: 750, lineHeight: 1.45 }}>{current[2]}</div>
          </div>
          <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
            {[
              ["err == true", "return -2", phase === 1 ? COLORS.danger : phase >= 2 ? COLORS.result : COLORS.faint],
              ["err == false", "use → free", phase === 3 ? COLORS.active : phase >= 2 ? COLORS.result : COLORS.faint],
            ].map(([branch, action, color]) => <div key={branch} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "14px 15px", border: "1px solid " + (color === COLORS.faint ? COLORS.border : color), borderRadius: 7, backgroundColor: color === COLORS.faint ? "rgba(255,255,255,0.48)" : color + "10" }}><div><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12 }}>{branch}</div><div style={{ marginTop: 5, color: COLORS.text, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{action}</div></div><div style={{ color, fontFamily: CODE_FONT, fontSize: 18, fontWeight: 800 }}>{color === COLORS.danger ? "LEAK" : color === COLORS.faint ? "?" : "free ✓"}</div></div>)}
          </div>
          <div style={{ marginTop: 20, padding: "15px 16px", borderLeft: "3px solid " + current[3], backgroundColor: current[3] + "10", color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{phase === 1 ? "修复不是把 free 只放在函数末尾，而是让错误分支也先完成清理。" : "每个资源都要有清晰的 owner，以及每条路径的释放点。"} </div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="if (err) return 之前，buf 应该怎么办？" duration={5} color={COLORS.compare} hint="先释放，或者把所有权交给能释放的对象" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="路径口诀" title="谁申请，谁释放；每条路径都要闭环" body="把 free 写在正常路径末尾不够，提前 return、错误分支和异常退出都必须被纳入所有权审计。" color={COLORS.compare} />
    </AbsoluteFill>
  );
};

const CYCLE_CODE = [
  "auto a = make_shared<Node>();",
  "auto b = make_shared<Node>();",
  "a->peer = b;",
  "b->peer = a; // cycle",
  "a.reset(); b.reset();",
];
const CYCLE_FIXED_CODE = [
  "auto a = make_shared<Node>();",
  "auto b = make_shared<Node>();",
  "a->peer = b;",
  "b->peer = weak_ptr<Node>{a}; // non-owning",
  "a.reset(); b.reset();",
];
const CycleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(3, Math.floor((frame - seconds(5)) / (seconds(21) / 4))) : -1;
  const activeLine = phase < 0 ? 0 : [0, 2, 4, 3][phase];
  const code = phase === 3 ? CYCLE_FIXED_CODE : CYCLE_CODE;
  const current = phase < 0 ? ["等待判断", "先看引用计数", "两个对象互相持有，外部 owner 消失后还会释放吗？", COLORS.active] as const : [
    ["创建对象", "count = 1", "a 和 b 各自拥有一个 Node", COLORS.compare],
    ["互相持有", "A ↔ B", "两个 shared_ptr 让引用计数都变成 2", COLORS.danger],
    ["外部 reset", "count = 1", "栈上的 a、b 消失，但环内引用仍然存在", COLORS.danger],
    ["weak_ptr 打破", "count = 0", "把反向边改成 weak_ptr，环断开后对象可回收", COLORS.result],
  ][phase];
  const cycle = phase >= 1 && phase <= 2;
  const weak = phase === 3;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="循环引用" title="shared_ptr 也可能把对象永远留住" />
      <SceneTitle frame={frame} eyebrow="机制场景 03" title="引用计数不归零，析构就永远不会发生" detail="shared_ptr 解决单向所有权的自动释放，但两个对象互相持有时，引用计数会卡在 1。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 300, height: 570, display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 22 }}>
        <CodePanel title="shared-cycle.cpp" lines={code} activeLine={activeLine} style={{ height: 520 }} />
        <Card strong style={{ padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>REFERENCE GRAPH · {phase < 0 ? "等待回忆" : phase + 1 + " / 4"}</div>
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
            {[["Node A", phase < 0 ? "?" : phase === 0 ? "1" : phase === 1 ? "2" : phase === 2 ? "1" : "0"], ["Node B", phase < 0 ? "?" : phase === 0 ? "1" : phase === 1 ? "2" : phase === 2 ? "1" : "0"]].map(([label, count]) => <div key={label} style={{ width: 172, minHeight: 142, padding: "18px 15px", border: "2px solid " + (phase >= 1 && phase <= 2 ? COLORS.danger : phase === 3 ? COLORS.result : COLORS.compare), borderRadius: 8, backgroundColor: (phase >= 1 && phase <= 2 ? COLORS.danger : phase === 3 ? COLORS.result : COLORS.compare) + "10", textAlign: "center" }}><div style={{ color: COLORS.text, fontFamily: CODE_FONT, fontSize: 16, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 26, color: phase >= 1 && phase <= 2 ? COLORS.danger : phase === 3 ? COLORS.result : COLORS.compare, fontFamily: CODE_FONT, fontSize: 30, fontWeight: 800 }}>{count}</div><div style={{ marginTop: 6, color: COLORS.muted, fontSize: 12 }}>strong refs</div></div>)}
          </div>
          <div style={{ position: "absolute", left: 130, right: 130, top: 238, height: 38, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 14, height: 2, backgroundColor: cycle ? COLORS.danger : weak ? COLORS.result : COLORS.faint }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center", color: weak ? COLORS.result : cycle ? COLORS.danger : COLORS.faint, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800, backgroundColor: COLORS.strong }}>{weak ? "weak_ptr · non-owning" : cycle ? "shared_ptr ↔ shared_ptr" : "peer"}</div>
          </div>
          <div style={{ marginTop: 90, padding: "15px 16px", borderLeft: "3px solid " + current[3], backgroundColor: current[3] + "10", color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{current[2]}</div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="shared_ptr 互相引用，外部 reset 后会自动释放吗？" duration={5} color={COLORS.danger} hint="先看引用计数是否真的归零" /></div>}
        </Card>
      </div>
      <Caption frame={frame} label="循环引用" title="RAII 不是引用计数的万能解" body="shared_ptr 循环引用会让两个对象互相保活；用 weak_ptr 表示不拥有对象的观察关系，才能打破这个环。" color={COLORS.danger} />
    </AbsoluteFill>
  );
};

const PREVENT_RULES = [
  ["RAII", "make_unique / unique_ptr", "离开作用域自动销毁，减少忘记释放的路径", COLORS.active],
  ["成对释放", "malloc → free", "每个申请点都要有 owner，每条分支都要清理", COLORS.compare],
  ["静态分配", "static / fixed pool", "嵌入式优先从根源上减少泄漏和碎片", COLORS.result],
] as const;
const PreventScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(5);
  const phase = promptDone ? Math.min(2, Math.floor((frame - seconds(5)) / seconds(25 / 3))) : -1;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="避免泄漏" title="把释放责任放进结构里" />
      <SceneTitle frame={frame} eyebrow="机制场景 04" title="最可靠的防线，是让忘记释放变得困难" detail="先用对象生命周期承载所有权，再审计每条路径；在资源有限的 MCU 上，静态分配和固定池更容易证明。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {PREVENT_RULES.map(([title, code, detail, color], index) => {
          const active = index === phase;
          return <Card key={title} strong style={{ minHeight: 300, padding: "24px 22px", borderTop: "4px solid " + color, borderColor: active ? color : COLORS.border, backgroundColor: active ? color + "10" : COLORS.strong, ...reveal(frame, index * 18, 18) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}><div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</div><Badge color={color}>{active ? "当前策略" : "防守入口"}</Badge></div>
            <div style={{ marginTop: 18, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 20, padding: "13px 14px", borderRadius: 6, backgroundColor: color + "10", color, fontFamily: CODE_FONT, fontSize: 15, fontWeight: 800 }}>{code}</div>
            <div style={{ marginTop: 13, color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{detail}</div>
          </Card>;
        })}
      </div>
      <Card strong style={{ position: "absolute", left: 72, right: 72, top: 680, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}><div style={{ color: COLORS.text, fontSize: 17, fontWeight: 800 }}>所有权检查</div><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 14 }}>allocate → owner → use → release / transfer</div></div>
      </Card>
      {!promptDone && <div style={{ position: "absolute", left: 625, top: 370 }}><Prompt frame={frame} question="怎样让‘忘记释放’变得更难发生？" duration={5} color={COLORS.active} hint="先说 RAII，再说路径审计和静态分配" /></div>}
      <Caption frame={frame} label="防泄漏口诀" title="让所有权可见，让释放路径自动化" body="C++ 优先 RAII；C 接口必须成对；嵌入式优先静态分配或固定块池。" color={COLORS.active} />
    </AbsoluteFill>
  );
};

const TOOLS = [
  ["Linux", "Valgrind / ASan", "运行时报告未释放块、栈轨迹和访问问题", COLORS.compare],
  ["FreeRTOS", "xPortGetFreeHeapSize()", "定时记录剩余堆，观察长期下降趋势", COLORS.active],
  ["通用", "审查 + 日志", "记录申请点、所有权和失败路径，定位累积来源", COLORS.violet],
] as const;
const ToolsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(4);
  const phase = promptDone ? Math.min(2, Math.floor((frame - seconds(4)) / seconds(16 / 3))) : -1;
  const points = phase < 0 ? [100, 100, 100, 100] : phase === 0 ? [100, 96, 91, 84] : phase === 1 ? [100, 98, 95, 92] : [100, 99, 98, 97];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="排查工具" title="泄漏要靠趋势和证据定位" />
      <SceneTitle frame={frame} eyebrow="工程场景" title="工具回答的是：哪一块没有回来？" detail="Linux 可以用 Valgrind、ASan；FreeRTOS 可以定时记录剩余堆，但单次快照不能替代长期趋势和所有权审计。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 22 }}>
        <Card strong style={{ minHeight: 500, padding: "24px 24px", position: "relative" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>MONITORING VIEW · {phase < 0 ? "等待回忆" : phase + 1 + " / 3"}</div>
          <div style={{ marginTop: 22, display: "grid", gap: 13 }}>{TOOLS.map(([platform, tool, detail, color], index) => { const active = index === phase; return <div key={platform} style={{ padding: "15px 16px", border: "1px solid " + (active ? color : COLORS.border), borderLeft: "3px solid " + color, borderRadius: 7, backgroundColor: active ? color + "10" : "rgba(255,255,255,0.48)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div style={{ color: COLORS.text, fontSize: 17, fontWeight: 800 }}>{platform}</div><Badge color={color}>{tool}</Badge></div><div style={{ marginTop: 7, color: COLORS.muted, fontSize: 14, lineHeight: 1.4 }}>{detail}</div></div>; })}</div>
          {!promptDone && <div style={{ position: "absolute", inset: 24, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.74)", borderRadius: 8 }}><Prompt frame={frame} question="只看一次 free heap 快照，能证明没有泄漏吗？" duration={4} color={COLORS.compare} hint="不能，关键是长期趋势和申请路径" /></div>}
        </Card>
        <Card strong style={{ minHeight: 500, padding: "24px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>FREE HEAP TREND</div>
          <div style={{ marginTop: 28, height: 250, display: "flex", alignItems: "flex-end", gap: 18, padding: "0 18px 18px", borderLeft: "1px solid " + COLORS.border, borderBottom: "1px solid " + COLORS.border }}>
            {points.map((value, index) => <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><div style={{ color: phase === 0 && index > 0 ? COLORS.danger : COLORS.active, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{value}%</div><div style={{ width: "100%", height: value * 1.65, maxHeight: 190, backgroundColor: phase === 0 && index > 0 ? COLORS.danger : COLORS.active, opacity: 0.72, borderRadius: "5px 5px 0 0" }} /><div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11 }}>t{index + 1}</div></div>)}
          </div>
          <div style={{ marginTop: 22, padding: "16px 16px", borderLeft: "3px solid " + (phase === 0 ? COLORS.danger : COLORS.active), backgroundColor: (phase === 0 ? COLORS.danger : COLORS.active) + "10", color: COLORS.muted, fontSize: 15, lineHeight: 1.45 }}>{phase === 0 ? "连续下降是线索，不是单独的定罪；还要回到申请点和所有权路径。" : "把监控数据和代码路径放在一起，才能知道是泄漏、碎片还是正常峰值。"} </div>
        </Card>
      </div>
      <Caption frame={frame} label="排查口诀" title="看趋势，留证据，再回到所有权路径" body="Valgrind / ASan 和 FreeRTOS 剩余堆监控是定位工具，不会替你设计正确的资源所有权。" color={COLORS.violet} />
    </AbsoluteFill>
  );
};

const FOLLOWUPS = [
  ["shared_ptr 循环引用怎么办？", "把不拥有对象的反向关系改成 weak_ptr，打破引用环，让引用计数最终归零。", COLORS.danger],
  ["Valgrind 怎么查泄漏？", "Linux 上可以用 leak-check 选项观察未释放块、调用栈和分配位置，再回到代码修复所有权路径。", COLORS.compare],
  ["FreeRTOS 怎么监控堆？", "定时记录 xPortGetFreeHeapSize()，观察长期下降趋势；必要时结合分配失败钩子和申请点日志。", COLORS.active],
  ["嵌入式为什么更怕泄漏？", "设备往往长期无人值守，泄漏会累积，最终造成分配失败、任务异常或系统不可用。", COLORS.result],
] as const;
const FollowupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.min(3, Math.floor(frame / seconds(9)));
  const local = frame - index * seconds(9);
  const answer = local >= seconds(4);
  const [question, explanation, color] = FOLLOWUPS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="面试追问" title="先回答，再补工具和边界" tag="慢速复习 · 0:36" />
      <SceneTitle frame={frame} eyebrow={"追问 " + (index + 1) + " / 4"} title="别把一个工具名当成完整方案" detail="每个追问先留 4 秒；答案要同时覆盖所有权、检测证据和长期运行风险。" />
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
      <Caption frame={frame} label="面试追问 · 复述" title="工具能发现线索，所有权设计才解决根因" body="完整答案要从泄漏定义讲到路径、RAII、循环引用和嵌入式长期监控。" color={color} />
    </AbsoluteFill>
  );
};

const FINAL_ITEMS = [
  ["什么是内存泄漏？", "内存申请成功后，所有权丢失，块仍占着内存但程序无法再找到并释放它。", COLORS.danger],
  ["常见原因是什么？", "提前 return、错误分支遗漏、容器只增不删，以及 shared_ptr 循环引用。", COLORS.compare],
  ["如何避免？", "RAII、每条路径释放或转移所有权，嵌入式优先静态分配或固定块池。", COLORS.active],
  ["如何排查？", "Linux 看 Valgrind / ASan，FreeRTOS 看剩余堆长期趋势，再回到申请点审计。", COLORS.result],
] as const;
const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const unit = seconds(4.5);
  const index = Math.min(3, Math.floor(frame / unit));
  const local = frame - index * unit;
  const answer = local >= seconds(2.5);
  const [question, answerText, color] = FINAL_ITEMS[index];
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="最终复述" title="最后一次：不看答案，自己说出来" tag="慢速复习 · 0:18" />
      <SceneTitle frame={frame} eyebrow="记忆收束" title="把内存泄漏压缩成四个面试句子" detail="定义、原因、防守、排查四步连起来，才是可以在面试中稳定说出口的答案。" />
      <div style={{ position: "absolute", left: 72, right: 72, top: 306, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
        <Card strong style={{ minHeight: 565, padding: "32px 38px", borderLeft: "4px solid " + color }}>
          <div style={{ color, fontFamily: CODE_FONT, fontSize: 13, fontWeight: 800 }}>FINAL RECALL · {index + 1}/4</div>
          <div style={{ marginTop: 26, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 35, fontWeight: 700, lineHeight: 1.28 }}>{question}</div>
          {!answer ? <div style={{ marginTop: 28, color: COLORS.muted, fontSize: 17 }}>先停 2.5 秒，再继续。</div> : <div style={{ marginTop: 32, padding: "18px 20px", border: "1px solid " + color + "44", borderRadius: 7, backgroundColor: color + "10", color: COLORS.text, fontSize: 21, fontWeight: 750, lineHeight: 1.55, ...reveal(local, seconds(2.5)) }}>{answerText}</div>}
        </Card>
        <Card strong style={{ minHeight: 565, padding: "26px 24px" }}>
          <div style={{ color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>LEAK-FREE LOOP</div>
          <div style={{ marginTop: 28, color: COLORS.text, fontFamily: DISPLAY_FONT, fontSize: 34, fontWeight: 700 }}>reachable → releasable</div>
          <div style={{ marginTop: 22, display: "grid", gap: 12 }}>{[["定义", "owner lost"], ["原因", "return / cycle"], ["防守", "RAII / static"], ["排查", "trend / trace"]].map(([label, text], itemIndex) => <div key={label} style={{ padding: "13px 16px", border: "1px solid " + (itemIndex === index ? color : COLORS.border), borderRadius: 7, backgroundColor: itemIndex === index ? color + "10" : "rgba(255,255,255,0.48)" }}><div style={{ color: itemIndex === index ? color : COLORS.muted, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 5, color: COLORS.text, fontSize: 16, fontWeight: 700 }}>{text}</div></div>)}</div>
        </Card>
      </div>
      <Caption frame={frame} label="复习完成" title="让每块内存都可达、可释放、可监控" body="下次看到泄漏题，先找所有权断点，再看所有路径和长期堆趋势。" color={COLORS.result} />
    </AbsoluteFill>
  );
};

export const MemoryLeakQ12Video: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const starts = {
    opening: 0,
    map: SCENE.opening,
    leak: SCENE.opening + SCENE.map,
    paths: SCENE.opening + SCENE.map + SCENE.leak,
    cycle: SCENE.opening + SCENE.map + SCENE.leak + SCENE.paths,
    prevent: SCENE.opening + SCENE.map + SCENE.leak + SCENE.paths + SCENE.cycle,
    tools: SCENE.opening + SCENE.map + SCENE.leak + SCENE.paths + SCENE.cycle + SCENE.prevent,
    followups: SCENE.opening + SCENE.map + SCENE.leak + SCENE.paths + SCENE.cycle + SCENE.prevent + SCENE.tools,
    final: SCENE.opening + SCENE.map + SCENE.leak + SCENE.paths + SCENE.cycle + SCENE.prevent + SCENE.tools + SCENE.followups,
  };
  return (
    <AbsoluteFill style={{ fontFamily: BODY_FONT, color: COLORS.text, overflow: "hidden" }}>
      <Background />
      <Sequence from={starts.opening} durationInFrames={SCENE.opening}><Opening /></Sequence>
      <Sequence from={starts.map} durationInFrames={SCENE.map}><MapScene /></Sequence>
      <Sequence from={starts.leak} durationInFrames={SCENE.leak}><LeakScene /></Sequence>
      <Sequence from={starts.paths} durationInFrames={SCENE.paths}><PathsScene /></Sequence>
      <Sequence from={starts.cycle} durationInFrames={SCENE.cycle}><CycleScene /></Sequence>
      <Sequence from={starts.prevent} durationInFrames={SCENE.prevent}><PreventScene /></Sequence>
      <Sequence from={starts.tools} durationInFrames={SCENE.tools}><ToolsScene /></Sequence>
      <Sequence from={starts.followups} durationInFrames={SCENE.followups}><FollowupScene /></Sequence>
      <Sequence from={starts.final} durationInFrames={SCENE.final}><FinalScene /></Sequence>
      <div style={{ position: "absolute", left: 58, right: 58, bottom: 22, height: 4, borderRadius: 999, backgroundColor: COLORS.border }}><div style={{ height: "100%", width: progress * 100 + "%", borderRadius: 999, backgroundColor: COLORS.accent }} /></div>
      <div style={{ position: "absolute", right: 58, bottom: 31, color: COLORS.muted, fontFamily: CODE_FONT, fontSize: 11, fontWeight: 700 }}>Q12 · memory leak · 3:34</div>
    </AbsoluteFill>
  );
};

export const MemoryLeakQ12Composition = () => <Composition id="MemoryLeakQ12" component={MemoryLeakQ12Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />;
