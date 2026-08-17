import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

const FPS = 30;

const COLORS = {
  background: "#eef2f4",
  surface: "rgba(255, 255, 255, 0.72)",
  surfaceStrong: "rgba(255, 255, 255, 0.88)",
  surfaceSoft: "rgba(255, 255, 255, 0.56)",
  text: "#100f0f",
  muted: "#6f6e69",
  faint: "#9b9a97",
  border: "rgba(22, 30, 38, 0.10)",
  borderStrong: "rgba(22, 30, 38, 0.16)",
  accent: "#d87757",
  active: "#087f8c",
  compare: "#b45309",
  result: "#198754",
  danger: "#c2413b",
  violet: "#6f65b8",
  codeBackground: "#f7f8f9",
  shadow: "0 16px 48px rgba(22, 30, 38, 0.10)",
};

const BODY_FONT = 'Inter, "PingFang SC", "Noto Sans SC", system-ui, sans-serif';
const DISPLAY_FONT = 'Iowan Old Style, "Songti SC", STSong, Georgia, serif';
const CODE_FONT = '"Fira Code", "SFMono-Regular", Menlo, Consolas, monospace';
const ease = Easing.bezier(0.22, 1, 0.36, 1);

const seconds = (value: number) => Math.round(value * FPS);

// Duration presets: simple questions target about 5 minutes; multi-concept questions use the hard 6-7 minute profile.
const PACING = {
  opening: { duration: 20, prompt: 7 },
  roles: { duration: 14 },
  local: { duration: 50, prompt: 6, declaration: 6, call: 10, recap: 8 },
  file: { duration: 32, prompt: 6, reveal: 7, test: 11, recap: 8 },
  member: { duration: 36, prompt: 6, explanation: 7, object: 9, recap: 14 },
  memory: { duration: 44, prompt: 6, basic: 7, data: 10, bss: 10, recap: 11 },
  followups: { duration: 56, each: 14, prompt: 5 },
  final: { duration: 29, each: 7.25, prompt: 5 },
} as const;

const SCENE = {
  opening: seconds(PACING.opening.duration),
  roles: seconds(PACING.roles.duration),
  local: seconds(PACING.local.duration),
  file: seconds(PACING.file.duration),
  member: seconds(PACING.member.duration),
  memory: seconds(PACING.memory.duration),
  followups: seconds(PACING.followups.duration),
  final: seconds(PACING.final.duration),
} as const;

const TOTAL_FRAMES = Object.values(SCENE).reduce(
  (sum, duration) => sum + duration,
  0,
);

const formatDuration = (frames: number) => {
  const totalSeconds = Math.ceil(frames / FPS);
  const minutes = Math.floor(totalSeconds / 60);
  const secondsPart = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${secondsPart}`;
};

const REVIEW_DURATION_LABEL = formatDuration(TOTAL_FRAMES);

const clamp = (
  value: number,
  inputRange: [number, number],
  outputRange: [number, number],
) =>
  interpolate(value, inputRange, outputRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const fadeSlide = (frame: number, start: number, distance = 18) => {
  const isImmediate = start <= 0;
  const inputStart = isImmediate ? 0 : start;
  const inputEnd = inputStart + 24;
  return {
    opacity: clamp(
      frame,
      [inputStart, inputEnd],
      isImmediate ? [0.88, 1] : [0, 1],
    ),
    translate: `0px ${clamp(
      frame,
      [inputStart, inputEnd],
      isImmediate ? [Math.min(distance, 4), 0] : [distance, 0],
    )}px`,
  };
};

const glassStyle: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.surface,
  boxShadow: COLORS.shadow,
};

const strongGlassStyle: CSSProperties = {
  ...glassStyle,
  backgroundColor: COLORS.surfaceStrong,
};

type GlassCardProps = {
  children: ReactNode;
  style?: CSSProperties;
  strong?: boolean;
};

const GlassCard: React.FC<GlassCardProps> = ({ children, style, strong }) => (
  <div
    style={{
      ...(strong ? strongGlassStyle : glassStyle),
      borderRadius: 8,
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
        left: -140,
        top: 120,
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
        right: -220,
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

type TopBarProps = {
  frame: number;
  section: string;
  title: string;
  tag?: string;
};

const TopBar: React.FC<TopBarProps> = ({
  frame,
  section,
  title,
  tag = `慢速复习 · ${REVIEW_DURATION_LABEL}`,
}) => (
  <GlassCard
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
      ...fadeSlide(frame, 0, 10),
    }}
  >
    <div
      style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}
    >
      <div
        style={{
          color: COLORS.accent,
          fontFamily: CODE_FONT,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 1,
        }}
      >
        C / C++ 基础
      </div>
      <div
        style={{ width: 1, height: 18, backgroundColor: COLORS.borderStrong }}
      />
      <div
        style={{
          color: COLORS.text,
          fontSize: 18,
          fontWeight: 760,
          whiteSpace: "nowrap",
        }}
      >
        {section}
      </div>
      <div
        style={{
          color: COLORS.muted,
          fontSize: 16,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
    </div>
    <div
      style={{
        flex: "0 0 auto",
        padding: "8px 11px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 6,
        backgroundColor: COLORS.surfaceSoft,
        color: COLORS.muted,
        fontFamily: CODE_FONT,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {tag}
    </div>
  </GlassCard>
);

type CaptionBarProps = {
  frame: number;
  label: string;
  title: string;
  body: string;
  color?: string;
};

const CaptionBar: React.FC<CaptionBarProps> = ({
  frame,
  label,
  title,
  body,
  color = COLORS.active,
}) => (
  <GlassCard
    strong
    style={{
      position: "absolute",
      left: 58,
      right: 58,
      bottom: 54,
      minHeight: 106,
      padding: "15px 20px 16px",
      borderTop: `3px solid ${color}`,
      ...fadeSlide(frame, 0, 8),
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        color: COLORS.muted,
        fontFamily: CODE_FONT,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      <span>{label}</span>
      <span>先理解，再记忆</span>
    </div>
    <div
      style={{
        marginTop: 8,
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 800,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 5,
        color: COLORS.muted,
        fontSize: 15,
        lineHeight: 1.45,
      }}
    >
      {body}
    </div>
  </GlassCard>
);

const SceneTitle: React.FC<{
  frame: number;
  eyebrow: string;
  title: string;
  detail: string;
}> = ({ frame, eyebrow, title, detail }) => (
  <div
    style={{
      position: "absolute",
      left: 72,
      top: 122,
      right: 72,
      ...fadeSlide(frame, 0, 12),
    }}
  >
    <div
      style={{
        color: COLORS.accent,
        fontFamily: CODE_FONT,
        fontSize: 14,
        fontWeight: 800,
        letterSpacing: 1.4,
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        marginTop: 10,
        color: COLORS.text,
        fontFamily: DISPLAY_FONT,
        fontSize: 44,
        fontWeight: 700,
        lineHeight: 1.16,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 9,
        color: COLORS.muted,
        fontSize: 18,
        lineHeight: 1.45,
      }}
    >
      {detail}
    </div>
  </div>
);

const Pill: React.FC<{
  children: ReactNode;
  color: string;
  style?: CSSProperties;
}> = ({ children, color, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 11px",
      border: `1px solid ${color}55`,
      borderRadius: 6,
      backgroundColor: `${color}12`,
      color,
      fontFamily: CODE_FONT,
      fontSize: 12,
      fontWeight: 750,
      ...style,
    }}
  >
    <span
      style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: color }}
    />
    {children}
  </div>
);

const RecallPrompt: React.FC<{
  frame: number;
  question: string;
  seconds: number;
  color?: string;
  hint?: string;
}> = ({
  frame,
  question,
  seconds,
  color = COLORS.active,
  hint = "不要急着看答案，先在脑中说一遍",
}) => {
  const remaining = Math.max(0, Math.ceil((seconds * FPS - frame) / FPS));
  const progress = clamp(frame, [0, seconds * FPS], [0, 1]);
  return (
    <GlassCard
      strong
      style={{
        width: 670,
        minHeight: 290,
        padding: "28px 32px",
        borderLeft: `4px solid ${color}`,
        ...fadeSlide(frame, 0, 20),
      }}
    >
      <div
        style={{
          color,
          fontFamily: CODE_FONT,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 1.2,
        }}
      >
        先暂停 · 主动回忆
      </div>
      <div
        style={{
          marginTop: 20,
          color: COLORS.text,
          fontFamily: DISPLAY_FONT,
          fontSize: 33,
          fontWeight: 700,
          lineHeight: 1.28,
        }}
      >
        {question}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 26,
        }}
      >
        <div
          style={{
            color,
            fontFamily: CODE_FONT,
            fontSize: 44,
            fontWeight: 800,
            minWidth: 54,
          }}
        >
          {remaining}
        </div>
        <div style={{ color: COLORS.muted, fontSize: 16, lineHeight: 1.45 }}>
          {hint}
        </div>
      </div>
      <div
        style={{
          height: 6,
          marginTop: 24,
          borderRadius: 999,
          backgroundColor: COLORS.border,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      </div>
    </GlassCard>
  );
};

type CodePanelProps = {
  title: string;
  lines: string[];
  activeLine?: number;
  width?: number | string;
  height?: number | string;
};

const CodePanel: React.FC<CodePanelProps> = ({
  title,
  lines,
  activeLine = -1,
  width = "100%",
  height = "100%",
}) => (
  <GlassCard
    strong
    style={{
      width,
      height,
      overflow: "hidden",
      backgroundColor: "rgba(247, 248, 249, 0.90)",
    }}
  >
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        borderBottom: `1px solid ${COLORS.border}`,
        color: COLORS.muted,
        fontFamily: CODE_FONT,
        fontSize: 12,
        fontWeight: 750,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: COLORS.danger,
        }}
      />
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: COLORS.compare,
        }}
      />
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: COLORS.result,
        }}
      />
      <span style={{ marginLeft: 8 }}>{title}</span>
    </div>
    <div
      style={{
        padding: "18px 18px",
        fontFamily: CODE_FONT,
        fontSize: 20,
        lineHeight: 1.75,
      }}
    >
      {lines.map((line, index) => {
        const active = index === activeLine;
        return (
          <div
            key={`${title}-${index}`}
            style={{
              display: "flex",
              minHeight: 34,
              padding: "0 10px",
              borderRadius: 5,
              backgroundColor: active ? `${COLORS.compare}16` : "transparent",
              color: active
                ? COLORS.text
                : index === 0
                  ? COLORS.muted
                  : COLORS.text,
              opacity: activeLine >= 0 && index > activeLine + 2 ? 0.44 : 1,
            }}
          >
            <span
              style={{
                width: 31,
                color: active ? COLORS.compare : COLORS.faint,
                fontSize: 14,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ whiteSpace: "pre" }}>{line}</span>
          </div>
        );
      })}
    </div>
  </GlassCard>
);

const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptDone = frame >= seconds(PACING.opening.prompt);
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题"
        title="static 关键字有哪些作用？"
      />
      <SceneTitle
        frame={frame}
        eyebrow="复习目标"
        title="先别背答案，先试着说出来"
        detail="这一题的核心不是记住一句话，而是建立三个稳定的判断入口。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 304,
          right: 72,
          display: "flex",
          gap: 26,
          alignItems: "stretch",
        }}
      >
        <RecallPrompt
          frame={frame}
          question="static 主要改变了什么？"
          seconds={PACING.opening.prompt}
          color={COLORS.active}
          hint="试着说出：生命周期、可见性、共享。"
        />
        <GlassCard
          strong
          style={{
            flex: 1,
            padding: "28px 30px",
            opacity: promptDone ? 1 : 0.42,
            translate: `${promptDone ? 0 : 18}px 0px`,
          }}
        >
          <div
            style={{
              color: COLORS.muted,
              fontFamily: CODE_FONT,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            本题路线
          </div>
          <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
            {[
              ["01", "局部变量", "寿命变长，作用域不变", COLORS.accent],
              ["02", "全局变量 / 函数", "限制为当前文件可见", COLORS.active],
              ["03", "C++ 类成员", "所有对象共享一份", COLORS.result],
            ].map(([number, label, detail, color]) => (
              <div
                key={number}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  backgroundColor: `${color}0b`,
                }}
              >
                <div
                  style={{
                    color,
                    fontFamily: CODE_FONT,
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {number}
                </div>
                <div>
                  <div
                    style={{
                      color: COLORS.text,
                      fontSize: 20,
                      fontWeight: 800,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{ marginTop: 4, color: COLORS.muted, fontSize: 14 }}
                  >
                    {detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
      <CaptionBar
        frame={frame}
        label="本题总纲"
        title="static 不是一个结论，而是三个问题的入口"
        body="先记住三句话，后面的代码、文件和内存图都只是把这三句话展开。"
      />
    </AbsoluteFill>
  );
};

const RolesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const roles = [
    ["生命周期", "函数结束后，局部 static 仍然存在", COLORS.accent],
    ["可见性", "全局 static 不导出到其他文件", COLORS.active],
    ["共享", "C++ static 成员属于类，不属于某个对象", COLORS.result],
  ] as const;
  return (
    <AbsoluteFill>
      <TopBar frame={frame} section="第 1 题" title="static 的三种语义" />
      <SceneTitle
        frame={frame}
        eyebrow="答案地图"
        title="先建立一张总地图，再进入代码"
        detail="三个作用彼此独立，但都可以用“谁拥有这份数据”来理解。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 310,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
        }}
      >
        {roles.map(([label, detail, color], index) => (
          <GlassCard
            key={label}
            strong
            style={{
              minHeight: 250,
              padding: "26px 24px",
              borderTop: `4px solid ${color}`,
              ...fadeSlide(frame, 20 + index * 30, 26),
            }}
          >
            <div
              style={{
                color,
                fontFamily: CODE_FONT,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              0{index + 1}
            </div>
            <div
              style={{
                marginTop: 28,
                color: COLORS.text,
                fontFamily: DISPLAY_FONT,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginTop: 18,
                color: COLORS.muted,
                fontSize: 18,
                lineHeight: 1.5,
              }}
            >
              {detail}
            </div>
            <div
              style={{
                marginTop: 28,
                height: 6,
                borderRadius: 999,
                backgroundColor: `${color}22`,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${clamp(frame, [72 + index * 30, 180 + index * 30], [0, 1]) * 100}%`,
                  borderRadius: 999,
                  backgroundColor: color,
                }}
              />
            </div>
          </GlassCard>
        ))}
      </div>
      <GlassCard
        strong
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 620,
          padding: "21px 24px",
          ...fadeSlide(frame, 155),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Pill color={COLORS.compare}>记忆句</Pill>
          <div style={{ color: COLORS.text, fontSize: 26, fontWeight: 800 }}>
            static = 活多久 / 谁能看见 / 是否共享
          </div>
        </div>
      </GlassCard>
      <CaptionBar
        frame={frame}
        label="回答框架"
        title="面试开口先说三大作用"
        body="说完再按场景展开：局部变量看生命周期，全局符号看链接属性，类成员看对象共享。"
        color={COLORS.compare}
      />
    </AbsoluteFill>
  );
};

const LocalStaticScene: React.FC = () => {
  const frame = useCurrentFrame();
  const codeLines = [
    "void counter(void) {",
    "    static int cnt = 0;",
    "    cnt++;",
    '    printf("%d\\n", cnt);',
    "}",
  ];
  const promptEnd = seconds(PACING.local.prompt);
  const declarationEnd = promptEnd + seconds(PACING.local.declaration);
  const firstCallEnd = declarationEnd + seconds(PACING.local.call);
  const secondCallEnd = firstCallEnd + seconds(PACING.local.call);
  const thirdCallEnd = secondCallEnd + seconds(PACING.local.call);
  const isRecall = frame < promptEnd;
  const phase = isRecall
    ? 0
    : frame < declarationEnd
      ? 1
      : frame < firstCallEnd
        ? 2
        : frame < secondCallEnd
          ? 3
          : frame < thirdCallEnd
            ? 4
            : 5;
  const activeLine = phase === 0 ? 0 : phase === 1 ? 1 : phase <= 4 ? 2 : 3;
  const callStep = phase <= 1 ? 0 : Math.min(3, phase - 1);
  const count = Math.min(3, callStep);
  const phaseTitle = isRecall
    ? "先预测：连续调用三次会输出什么？"
    : phase === 1
      ? "先看声明：static int cnt = 0"
      : phase === 2
        ? "第一次调用：初始化一次，然后 cnt++"
        : phase === 3
          ? "第二次调用：不会回到 0，而是从 1 继续"
          : phase === 4
            ? "第三次调用：同一份 cnt 继续累加"
            : "最后对比：寿命变长，但作用域没有变";
  const phaseBody = isRecall
    ? "想一想：函数退出时 cnt 会不会消失？"
    : phase === 1
      ? "初始化只发生第一次；先把这句话读熟，再看三次调用。"
      : phase === 5
        ? "普通局部变量离开函数就销毁；局部 static 在程序运行期间保留同一份值。"
        : `当前输出：${count}。函数返回后，cnt 的值仍然保留。`;
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题 / ①"
        title="局部变量：生命周期延长，作用域不变"
      />
      <SceneTitle
        frame={frame}
        eyebrow="局部 static"
        title="先看最容易混淆的一层：它仍然是函数内变量"
        detail="改变的是生命周期，不是作用域；关键证据是同一个 cnt 跨越了多次函数调用。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 294,
          bottom: 206,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.06fr) minmax(520px, 0.94fr)",
          gap: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateRows: "minmax(0, 1fr) auto",
            gap: 14,
          }}
        >
          <CodePanel
            title="counter.c"
            lines={codeLines}
            activeLine={activeLine}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <Pill color={COLORS.accent}>作用域：函数内</Pill>
            <Pill color={COLORS.active}>寿命：程序运行期间</Pill>
            <Pill color={COLORS.compare}>初始化：只一次</Pill>
          </div>
        </div>
        <GlassCard
          strong
          style={{
            padding: "22px 24px",
            display: "grid",
            gridTemplateRows: "auto auto 1fr",
            gap: 16,
          }}
        >
          {isRecall ? (
            <RecallPrompt
              frame={frame}
              question="counter() 连续调用三次，输出是什么？"
              seconds={PACING.local.prompt}
              color={COLORS.accent}
              hint="先说出 1、2、3，或者解释为什么不是 1、1、1。"
            />
          ) : (
            <div
              style={{
                padding: "6px 8px 0",
                color: COLORS.text,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {phaseTitle}
            </div>
          )}
          {!isRecall ? (
            <div
              style={{
                padding: "16px 18px",
                border: `1px solid ${COLORS.active}45`,
                borderRadius: 8,
                backgroundColor: `${COLORS.active}08`,
              }}
            >
              <div
                style={{
                  color: COLORS.active,
                  fontFamily: CODE_FONT,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                STATIC STORAGE
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    color: COLORS.text,
                    fontFamily: CODE_FONT,
                    fontSize: 23,
                  }}
                >
                  cnt =
                </div>
                <div
                  style={{
                    color: COLORS.active,
                    fontFamily: CODE_FONT,
                    fontSize: 52,
                    fontWeight: 800,
                  }}
                >
                  {count}
                </div>
                <div style={{ color: COLORS.muted, fontSize: 15 }}>
                  函数返回后仍保留
                </div>
              </div>
            </div>
          ) : (
            <div style={{ minHeight: 124 }} />
          )}
          <div style={{ display: "grid", alignContent: "start", gap: 9 }}>
            {[
              "第一次调用：输出 1",
              "第二次调用：输出 2",
              "第三次调用：输出 3",
            ].map((label, index) => {
              const active = callStep === index + 1;
              const passed = callStep > index + 1;
              return (
                <div
                  key={label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "34px 1fr auto",
                    alignItems: "center",
                    gap: 9,
                    minHeight: 42,
                    padding: "0 11px",
                    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                    borderRadius: 7,
                    backgroundColor: active
                      ? `${COLORS.accent}12`
                      : passed
                        ? `${COLORS.result}0b`
                        : COLORS.surfaceSoft,
                    opacity: callStep === 0 ? 0.56 : 1,
                  }}
                >
                  <div
                    style={{
                      color: active ? COLORS.accent : COLORS.faint,
                      fontFamily: CODE_FONT,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    0{index + 1}
                  </div>
                  <div
                    style={{
                      color: COLORS.text,
                      fontSize: 16,
                      fontWeight: 720,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      color: active
                        ? COLORS.accent
                        : passed
                          ? COLORS.result
                          : COLORS.muted,
                      fontFamily: CODE_FONT,
                      fontSize: 13,
                    }}
                  >
                    {active ? "现在" : passed ? "完成" : "等待"}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
      <CaptionBar
        frame={frame}
        label="局部 static · 重点"
        title={phaseTitle}
        body={phaseBody}
        color={COLORS.accent}
      />
    </AbsoluteFill>
  );
};

const FileScopeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptEnd = seconds(PACING.file.prompt);
  const revealStart = promptEnd + seconds(PACING.file.reveal) / 2;
  const testStart = promptEnd + seconds(PACING.file.reveal);
  const failStart = testStart + seconds(PACING.file.test) / 2;
  const prompt = frame < promptEnd;
  const wall = clamp(frame, [revealStart, testStart], [0, 1]);
  const fail = clamp(frame, [failStart, failStart + seconds(4)], [0, 1]);
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题 / ②"
        title="全局变量和函数：限制为当前文件"
      />
      <SceneTitle
        frame={frame}
        eyebrow="内部链接"
        title="static 把符号关在 module.c 里"
        detail="它不再向整个工程导出，其他编译单元即使写 extern，也无法链接到这份定义。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 294,
          bottom: 206,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
        }}
      >
        <GlassCard
          strong
          style={{
            padding: 20,
            opacity: prompt ? 0.45 : 1,
            translate: `${prompt ? -8 : 0}px 0px`,
          }}
        >
          <CodePanel
            title="module.c"
            width="100%"
            height={370}
            activeLine={frame < testStart ? 1 : 2}
            lines={[
              "// module.c",
              "static int g_state = 0;",
              "static void parse_frame(void) {}",
              "",
              "// 只有当前文件能访问",
            ]}
          />
          <div
            style={{
              marginTop: 15,
              color: COLORS.result,
              fontSize: 17,
              fontWeight: 750,
            }}
          >
            ✓ module.c：可以访问 g_state 和 parse_frame
          </div>
        </GlassCard>
        <GlassCard
          strong
          style={{
            padding: 20,
            opacity: prompt ? 0.45 : 1,
            translate: `${prompt ? 8 : 0}px 0px`,
          }}
        >
          <CodePanel
            title="main.c"
            width="100%"
            height={370}
            activeLine={frame < failStart ? 1 : 2}
            lines={[
              "// main.c",
              "extern int g_state;",
              "g_state = 1;",
              "",
              "// 链接阶段：找不到符号",
            ]}
          />
          <div
            style={{
              marginTop: 15,
              color: COLORS.danger,
              fontSize: 17,
              fontWeight: 750,
              opacity: fail,
            }}
          >
            × main.c：这个名字没有被导出
          </div>
        </GlassCard>
      </div>
      <div
        style={{
          position: "absolute",
          left: 880,
          top: 505,
          width: 160,
          height: 4,
          backgroundColor: COLORS.danger,
          transformOrigin: "left center",
          scale: `${wall} 1`,
          opacity: wall,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 858,
          top: 438,
          width: 204,
          padding: "14px 12px",
          border: `1px solid ${COLORS.danger}66`,
          borderRadius: 8,
          backgroundColor: COLORS.surfaceStrong,
          color: COLORS.danger,
          textAlign: "center",
          fontFamily: CODE_FONT,
          fontSize: 15,
          fontWeight: 800,
          opacity: wall,
          scale: `${0.88 + 0.12 * wall}`,
        }}
      >
        内部链接
        <div
          style={{
            marginTop: 5,
            color: COLORS.muted,
            fontFamily: BODY_FONT,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          只在 module.c 可见
        </div>
      </div>
      {prompt ? (
        <div style={{ position: "absolute", left: 590, top: 355 }}>
          <RecallPrompt
            frame={frame}
            question="为什么 extern 也拿不到 static 全局变量？"
            seconds={PACING.file.prompt}
            color={COLORS.active}
            hint="想想：这不是作用域问题，而是链接属性问题。"
          />
        </div>
      ) : null}
      <CaptionBar
        frame={frame}
        label="全局 static · 重点"
        title="static 全局变量不是“全局可见”，而是“文件内部可见”"
        body="它具有内部链接属性，链接器不会把这个符号导出给其他编译单元。"
        color={COLORS.active}
      />
    </AbsoluteFill>
  );
};

const MemberStaticScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptEnd = seconds(PACING.member.prompt);
  const explanationEnd = promptEnd + seconds(PACING.member.explanation);
  const objectAStart = explanationEnd;
  const objectBStart = objectAStart + seconds(PACING.member.object);
  const prompt = frame < promptEnd;
  const shared = clamp(frame, [promptEnd, explanationEnd], [0, 1]);
  const count = frame < objectAStart ? 0 : frame < objectBStart ? 1 : 2;
  const objectA = clamp(
    frame,
    [objectAStart, objectAStart + seconds(5)],
    [0, 1],
  );
  const objectB = clamp(
    frame,
    [objectBStart, objectBStart + seconds(5)],
    [0, 1],
  );
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题 / ③"
        title="C++ static 成员：所有对象共享一份"
      />
      <SceneTitle
        frame={frame}
        eyebrow="类成员 static"
        title="数据属于类，不属于某一个对象"
        detail="构造两个 Device 对象，只会得到一份 Device::count；对象只是共同访问它。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 294,
          width: 760,
          bottom: 206,
          opacity: prompt ? 0.44 : 1,
        }}
      >
        <CodePanel
          title="device.hpp"
          width="100%"
          height={420}
          activeLine={frame < explanationEnd ? 1 : 3}
          lines={[
            "class Device {",
            "    inline static int count = 0; // C++17",
            "public:",
            "    Device() { count++; }",
            "    ~Device() { count--; }",
            "};",
          ]}
        />
      </div>
      <GlassCard
        strong
        style={{
          position: "absolute",
          left: 1015,
          top: 315,
          width: 720,
          minHeight: 160,
          padding: "24px 28px",
          borderTop: `4px solid ${COLORS.compare}`,
          opacity: shared,
          scale: `${0.92 + 0.08 * shared}`,
        }}
      >
        <div
          style={{
            color: COLORS.compare,
            fontFamily: CODE_FONT,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          CLASS STORAGE · only one copy
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginTop: 12,
          }}
        >
          <div
            style={{ color: COLORS.text, fontFamily: CODE_FONT, fontSize: 24 }}
          >
            Device::count =
          </div>
          <div
            style={{
              color: COLORS.compare,
              fontFamily: CODE_FONT,
              fontSize: 56,
              fontWeight: 800,
            }}
          >
            {count}
          </div>
        </div>
      </GlassCard>
      <GlassCard
        strong
        style={{
          position: "absolute",
          left: 1005,
          top: 585,
          width: 270,
          height: 128,
          padding: "21px",
          borderLeft: `4px solid ${COLORS.active}`,
          opacity: objectA,
          translate: `${(1 - objectA) * 20}px 0px`,
        }}
      >
        <div
          style={{
            color: COLORS.active,
            fontFamily: CODE_FONT,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          OBJECT A
        </div>
        <div
          style={{
            marginTop: 15,
            color: COLORS.text,
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          deviceA
        </div>
        <div style={{ marginTop: 5, color: COLORS.muted, fontSize: 14 }}>
          构造 → count++
        </div>
      </GlassCard>
      <GlassCard
        strong
        style={{
          position: "absolute",
          left: 1455,
          top: 585,
          width: 270,
          height: 128,
          padding: "21px",
          borderLeft: `4px solid ${COLORS.active}`,
          opacity: objectB,
          translate: `${(1 - objectB) * 20}px 0px`,
        }}
      >
        <div
          style={{
            color: COLORS.active,
            fontFamily: CODE_FONT,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          OBJECT B
        </div>
        <div
          style={{
            marginTop: 15,
            color: COLORS.text,
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          deviceB
        </div>
        <div style={{ marginTop: 5, color: COLORS.muted, fontSize: 14 }}>
          构造 → count++
        </div>
      </GlassCard>
      <div
        style={{
          position: "absolute",
          left: 1140,
          top: 480,
          width: 4,
          height: 120,
          backgroundColor: COLORS.compare,
          transformOrigin: "top center",
          scale: `1 ${shared}`,
          opacity: shared,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1588,
          top: 480,
          width: 4,
          height: 120,
          backgroundColor: COLORS.compare,
          transformOrigin: "top center",
          scale: `1 ${shared}`,
          opacity: shared,
        }}
      />
      {prompt ? (
        <div style={{ position: "absolute", left: 590, top: 360 }}>
          <RecallPrompt
            frame={frame}
            question="两个对象的 static count 有几份？"
            seconds={PACING.member.prompt}
            color={COLORS.compare}
            hint="先回答“几份”，再回答“为什么”。"
          />
        </div>
      ) : null}
      <CaptionBar
        frame={frame}
        label="C++ static 成员 · 重点"
        title="对象可以有很多个，但静态成员只有一份"
        body="它属于类本身；可以通过类名调用静态成员函数，也可以被所有对象共同访问。"
        color={COLORS.compare}
      />
    </AbsoluteFill>
  );
};

type MemorySegmentProps = {
  label: string;
  note: string;
  color: string;
  active: boolean;
  height: number;
};

const MemorySegment: React.FC<MemorySegmentProps> = ({
  label,
  note,
  color,
  active,
  height,
}) => (
  <div
    style={{
      height,
      padding: "0 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: `1px solid ${COLORS.border}`,
      backgroundColor: active ? `${color}1a` : COLORS.surfaceSoft,
      boxShadow: active ? `inset 6px 0 0 ${color}` : "none",
    }}
  >
    <div>
      <div
        style={{
          color: active ? color : COLORS.text,
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 4, color: COLORS.muted, fontSize: 14 }}>
        {note}
      </div>
    </div>
    {active ? (
      <div
        style={{ color, fontFamily: CODE_FONT, fontSize: 12, fontWeight: 800 }}
      >
        static 在这里
      </div>
    ) : null}
  </div>
);

const MemoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const promptEnd = seconds(PACING.memory.prompt);
  const basicEnd = promptEnd + seconds(PACING.memory.basic);
  const dataEnd = basicEnd + seconds(PACING.memory.data);
  const bssEnd = dataEnd + seconds(PACING.memory.bss);
  const prompt = frame < promptEnd;
  const stackEnd = promptEnd + seconds(PACING.memory.basic * 0.45);
  const stackActive = frame >= promptEnd && frame < stackEnd;
  const heapActive = frame >= stackEnd && frame < basicEnd;
  const dataActive = frame >= basicEnd && frame < dataEnd;
  const bssActive = frame >= dataEnd && frame < bssEnd;
  const compareActive = frame >= bssEnd;
  const dataFocus = dataActive || compareActive;
  const bssFocus = bssActive || compareActive;
  const note = prompt
    ? "先在脑中画出：栈、堆、.bss、.data、.text。"
    : stackActive
      ? "普通局部变量在栈上；先把栈和 static 区分开。"
      : heapActive
        ? "malloc / new 从堆上申请；堆和 static 存储区也不是一回事。"
        : dataActive
          ? "已初始化的 static 变量进入 .data。"
          : bssActive
            ? "未初始化的 static 变量进入 .bss，并在启动时自动清零。"
            : "最后对比：.data 和 .bss 都是静态存储区，区别只在是否有初始值。";
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题 / ④"
        title="存储位置：看初始化方式"
      />
      <SceneTitle
        frame={frame}
        eyebrow="内存布局"
        title="static 变量不在栈上：它属于静态存储区"
        detail="记忆路径很简单：有初值看 .data，没有初值看 .bss；两者生命周期都贯穿程序运行。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 292,
          width: 720,
          bottom: 206,
        }}
      >
        <GlassCard
          strong
          style={{
            height: "100%",
            overflow: "hidden",
            opacity: prompt ? 0.45 : 1,
          }}
        >
          <MemorySegment
            label="栈区"
            note="普通局部变量 · 向下增长"
            color={COLORS.accent}
            active={stackActive}
            height={112}
          />
          <MemorySegment
            label="堆区"
            note="malloc / new · 向上增长"
            color={COLORS.violet}
            active={heapActive}
            height={112}
          />
          <MemorySegment
            label=".bss"
            note="未初始化 / 自动置零"
            color={COLORS.active}
            active={bssFocus}
            height={112}
          />
          <MemorySegment
            label=".data"
            note="已初始化的全局 / 静态变量"
            color={COLORS.compare}
            active={dataFocus}
            height={112}
          />
          <MemorySegment
            label=".text"
            note="程序代码"
            color="#5b7aa8"
            active={false}
            height={112}
          />
        </GlassCard>
      </div>
      <GlassCard
        strong
        style={{
          position: "absolute",
          left: 860,
          top: 310,
          width: 880,
          minHeight: 260,
          padding: "26px 28px",
          borderTop: `4px solid ${compareActive ? COLORS.result : dataActive ? COLORS.compare : bssActive ? COLORS.active : COLORS.accent}`,
        }}
      >
        <div
          style={{
            color: COLORS.muted,
            fontFamily: CODE_FONT,
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          CURRENT EXPLANATION
        </div>
        <div
          style={{
            marginTop: 20,
            color: COLORS.text,
            fontFamily: DISPLAY_FONT,
            fontSize: 31,
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {note}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 28,
          }}
        >
          <div
            style={{
              padding: "17px 18px",
              border: `1px solid ${COLORS.compare}55`,
              borderRadius: 8,
              backgroundColor: `${COLORS.compare}0d`,
              opacity: dataFocus ? 1 : 0.56,
            }}
          >
            <div
              style={{
                color: COLORS.compare,
                fontFamily: CODE_FONT,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              static int x = 10;
            </div>
            <div
              style={{
                marginTop: 9,
                color: COLORS.text,
                fontSize: 17,
                fontWeight: 750,
              }}
            >
              已初始化 → .data
            </div>
          </div>
          <div
            style={{
              padding: "17px 18px",
              border: `1px solid ${COLORS.active}55`,
              borderRadius: 8,
              backgroundColor: `${COLORS.active}0d`,
              opacity: bssFocus ? 1 : 0.56,
            }}
          >
            <div
              style={{
                color: COLORS.active,
                fontFamily: CODE_FONT,
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              static int y;
            </div>
            <div
              style={{
                marginTop: 9,
                color: COLORS.text,
                fontSize: 17,
                fontWeight: 750,
              }}
            >
              未初始化 → .bss
            </div>
          </div>
        </div>
      </GlassCard>
      {prompt ? (
        <div style={{ position: "absolute", left: 590, top: 355 }}>
          <RecallPrompt
            frame={frame}
            question="static int x = 10; 会放在哪里？"
            seconds={PACING.memory.prompt}
            color={COLORS.active}
            hint="先区分：初始化和未初始化。"
          />
        </div>
      ) : null}
      <CaptionBar
        frame={frame}
        label="静态存储区 · 重点"
        title=".data 和 .bss 都是静态存储区"
        body="局部 static 的作用域仍然在函数内，但它的存储位置已经不再是栈区。"
        color={COLORS.active}
      />
    </AbsoluteFill>
  );
};

const FOLLOWUPS = [
  [
    "static 局部变量存放在哪里？",
    "静态存储区，不在栈上；函数结束后值仍然保留。",
    COLORS.accent,
  ],
  [
    "static 全局变量为什么只文件可见？",
    "因为它具有内部链接属性，链接器不会把符号导出给其他编译单元。",
    COLORS.active,
  ],
  [
    "static 变量是否线程安全？",
    "不保证；多线程或中断共享时仍需要锁、临界区或原子操作。",
    COLORS.danger,
  ],
  [
    "static 成员变量能在类内初始化吗？",
    "要看标准和声明形式：传统静态成员通常需类外定义；C++17 可用 inline static 类内定义。",
    COLORS.compare,
  ],
] as const;

const FollowupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const eachFrames = seconds(PACING.followups.each);
  const block = Math.min(FOLLOWUPS.length - 1, Math.floor(frame / eachFrames));
  const localFrame = frame - block * eachFrames;
  const [question, answer, color] = FOLLOWUPS[block];
  const answerVisible = localFrame >= seconds(PACING.followups.prompt);
  const remaining = Math.max(
    0,
    Math.ceil((seconds(PACING.followups.prompt) - localFrame) / FPS),
  );
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题 / 追问"
        title="面试常问的四个追问"
        tag={`慢速复习 · ${formatDuration(SCENE.followups)}`}
      />
      <SceneTitle
        frame={frame}
        eyebrow={`追问 ${block + 1} / ${FOLLOWUPS.length}`}
        title="先回答，再看标准说法"
        detail={`每个追问先留出 ${PACING.followups.prompt} 秒，再读答案并复述。`}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 300,
          bottom: 206,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(420px, .8fr)",
          gap: 20,
        }}
      >
        <GlassCard
          strong
          style={{ padding: "34px 36px", borderLeft: `5px solid ${color}` }}
        >
          <div
            style={{
              color,
              fontFamily: CODE_FONT,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.1,
            }}
          >
            INTERVIEW FOLLOW-UP
          </div>
          <div
            style={{
              marginTop: 28,
              color: COLORS.text,
              fontFamily: DISPLAY_FONT,
              fontSize: 37,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {question}
          </div>
          {!answerVisible ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 15,
                marginTop: 35,
              }}
            >
              <div
                style={{
                  color,
                  fontFamily: CODE_FONT,
                  fontSize: 48,
                  fontWeight: 800,
                }}
              >
                {remaining}
              </div>
              <div style={{ color: COLORS.muted, fontSize: 16 }}>
                先自己回答，尽量不要只说一个词。
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 32,
                padding: "22px 24px",
                borderRadius: 8,
                backgroundColor: `${color}0d`,
                border: `1px solid ${color}55`,
                color: COLORS.text,
                fontSize: 22,
                lineHeight: 1.55,
                fontWeight: 720,
                ...fadeSlide(localFrame, seconds(PACING.followups.prompt)),
              }}
            >
              {answer}
            </div>
          )}
          <div
            style={{
              height: 6,
              marginTop: 40,
              borderRadius: 999,
              backgroundColor: COLORS.border,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${clamp(localFrame, [0, eachFrames], [0, 1]) * 100}%`,
                borderRadius: 999,
                backgroundColor: color,
              }}
            />
          </div>
        </GlassCard>
        <GlassCard strong style={{ padding: "24px" }}>
          <div
            style={{
              color: COLORS.muted,
              fontFamily: CODE_FONT,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            REVIEW QUEUE
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            {FOLLOWUPS.map(([item, , itemColor], index) => (
              <div
                key={item}
                style={{
                  padding: "13px 14px",
                  border: `1px solid ${index === block ? itemColor : COLORS.border}`,
                  borderRadius: 7,
                  backgroundColor:
                    index === block ? `${itemColor}0f` : COLORS.surfaceSoft,
                  opacity: index > block ? 0.55 : 1,
                }}
              >
                <div
                  style={{
                    color: index === block ? itemColor : COLORS.faint,
                    fontFamily: CODE_FONT,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  0{index + 1}
                </div>
                <div
                  style={{
                    marginTop: 7,
                    color: COLORS.text,
                    fontSize: 15,
                    lineHeight: 1.35,
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
      <CaptionBar
        frame={frame}
        label="面试追问 · 复述"
        title={
          answerVisible
            ? "把答案说完整，比只背关键词更重要"
            : "先在脑中组织一句完整回答"
        }
        body={
          answerVisible
            ? "答案结构：结论 + 原因 + 必要时补充工程注意事项。"
            : "停在这里几秒，模拟真正的面试现场。"
        }
        color={color}
      />
    </AbsoluteFill>
  );
};

const FinalRecallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phaseFrames = seconds(PACING.final.each);
  const phase = Math.min(3, Math.floor(frame / phaseFrames));
  const prompts = [
    "static 局部变量改变了什么？",
    "static 全局变量为什么不能被其他文件 extern？",
    "C++ static 成员属于对象还是类？",
    "static int x; 和 static int x = 10; 分别去哪？",
  ];
  const answers = [
    "生命周期变长，作用域仍在函数内。",
    "内部链接，只在当前编译单元可见。",
    "属于类，所有对象共享同一份。",
    "未初始化进 .bss，已初始化进 .data。",
  ];
  const reveal = frame % phaseFrames >= seconds(PACING.final.prompt);
  const current = phase === 3 ? 3 : phase;
  return (
    <AbsoluteFill>
      <TopBar
        frame={frame}
        section="第 1 题 / 收束"
        title="最后一次：不看答案，自己复述"
        tag={`慢速复习 · ${formatDuration(SCENE.final)}`}
      />
      <SceneTitle
        frame={frame}
        eyebrow="记忆收束"
        title="把 static 压缩成四个可复述的句子"
        detail="真正复习完成的标志，是你能在没有代码提示时把关系说清楚。"
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          top: 305,
          bottom: 206,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(440px, .85fr)",
          gap: 20,
        }}
      >
        <GlassCard
          strong
          style={{
            padding: "32px 34px",
            borderLeft: `5px solid ${COLORS.accent}`,
          }}
        >
          <div
            style={{
              color: COLORS.accent,
              fontFamily: CODE_FONT,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1.2,
            }}
          >
            FINAL RECALL · {current + 1}/4
          </div>
          <div
            style={{
              marginTop: 30,
              color: COLORS.text,
              fontFamily: DISPLAY_FONT,
              fontSize: 38,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {prompts[current]}
          </div>
          {reveal ? (
            <div
              style={{
                marginTop: 34,
                padding: "20px 24px",
                border: `1px solid ${COLORS.accent}55`,
                borderRadius: 8,
                backgroundColor: `${COLORS.accent}0d`,
                color: COLORS.text,
                fontSize: 22,
                lineHeight: 1.5,
                fontWeight: 750,
                ...fadeSlide(frame % phaseFrames, seconds(PACING.final.prompt)),
              }}
            >
              {answers[current]}
            </div>
          ) : (
            <div style={{ marginTop: 32, color: COLORS.muted, fontSize: 16 }}>
              先停 {PACING.final.prompt} 秒，再继续。
            </div>
          )}
        </GlassCard>
        <GlassCard strong style={{ padding: "26px" }}>
          <div
            style={{
              color: COLORS.muted,
              fontFamily: CODE_FONT,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            ONE-LINE SUMMARY
          </div>
          <div
            style={{
              marginTop: 25,
              color: COLORS.text,
              fontFamily: DISPLAY_FONT,
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.35,
            }}
          >
            static = 生命周期 / 可见性 / 共享
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 28 }}>
            {[
              ["生命周期", "局部 static 值保留", COLORS.accent],
              ["可见性", "全局 static 限制文件", COLORS.active],
              ["共享", "类成员 static 只有一份", COLORS.result],
            ].map(([label, detail, color]) => (
              <div
                key={label}
                style={{
                  padding: "12px 14px",
                  border: `1px solid ${color}44`,
                  borderRadius: 7,
                  backgroundColor: `${color}0b`,
                }}
              >
                <div
                  style={{
                    color,
                    fontFamily: CODE_FONT,
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    marginTop: 5,
                    color: COLORS.text,
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
      <CaptionBar
        frame={frame}
        label="复习完成"
        title="能说清这四句，第 1 题就真正过了一遍"
        body="下一次复习可以只看最后这张收束卡，再回到你答不完整的部分。"
        color={COLORS.result}
      />
    </AbsoluteFill>
  );
};

export const MyComposition = () => (
  <Composition
    id="StaticQ1"
    component={MyComponent}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);

export const MyComponent: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  let offset = 0;
  const openingStart = offset;
  offset += SCENE.opening;
  const rolesStart = offset;
  offset += SCENE.roles;
  const localStart = offset;
  offset += SCENE.local;
  const fileStart = offset;
  offset += SCENE.file;
  const memberStart = offset;
  offset += SCENE.member;
  const memoryStart = offset;
  offset += SCENE.memory;
  const followupsStart = offset;
  offset += SCENE.followups;
  const finalStart = offset;

  return (
    <AbsoluteFill
      style={{
        fontFamily: BODY_FONT,
        color: COLORS.text,
        overflow: "hidden",
      }}
    >
      <Background />
      <Sequence from={openingStart} durationInFrames={SCENE.opening}>
        <OpeningScene />
      </Sequence>
      <Sequence from={rolesStart} durationInFrames={SCENE.roles}>
        <RolesScene />
      </Sequence>
      <Sequence from={localStart} durationInFrames={SCENE.local}>
        <LocalStaticScene />
      </Sequence>
      <Sequence from={fileStart} durationInFrames={SCENE.file}>
        <FileScopeScene />
      </Sequence>
      <Sequence from={memberStart} durationInFrames={SCENE.member}>
        <MemberStaticScene />
      </Sequence>
      <Sequence from={memoryStart} durationInFrames={SCENE.memory}>
        <MemoryScene />
      </Sequence>
      <Sequence from={followupsStart} durationInFrames={SCENE.followups}>
        <FollowupScene />
      </Sequence>
      <Sequence from={finalStart} durationInFrames={SCENE.final}>
        <FinalRecallScene />
      </Sequence>
      <div
        style={{
          position: "absolute",
          left: 58,
          right: 58,
          bottom: 22,
          height: 4,
          borderRadius: 999,
          backgroundColor: COLORS.borderStrong,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            borderRadius: 999,
            backgroundColor: COLORS.accent,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 58,
          bottom: 31,
          color: COLORS.muted,
          fontFamily: CODE_FONT,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        Q01 · static · {REVIEW_DURATION_LABEL}
      </div>
    </AbsoluteFill>
  );
};
