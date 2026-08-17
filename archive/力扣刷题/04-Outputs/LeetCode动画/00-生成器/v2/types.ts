export type ThemeMode = "auto" | "light" | "dark";
export type ExplanationDensity = "learning" | "review";

export interface CodeLineV2 {
  id: string;
  sourceLine: number;
  text: string;
}

export interface SceneStateV2 {
  sceneKind: "hash-array" | "water-stack" | "sliding-window" | "linked-list" | "lru-cache" | "dp-table";
  action: string;
  formula: string;
  variables: Record<string, unknown>;
  values?: unknown[];
  hash?: Record<string, unknown>;
  need?: Record<string, number>;
  window?: Record<string, number>;
  water?: number[];
  stack?: number[];
  nodes?: Array<Record<string, unknown>>;
  edges?: Array<{from: string; to: string; kind?: string; status?: string}>;
  pointers?: Record<string, string | null>;
  order?: string[];
  active?: unknown[];
  compared?: unknown[];
  result?: unknown[];
  range?: number[];
  bestRange?: number[];
}

export interface TraceBeatV2 {
  lineIds: string[];
  state: SceneStateV2;
  caption: string;
  emphasis: string[];
}

export interface TraceFrameV2 {
  id: string;
  phase: string;
  durationMs: number;
  captions: {learning: string; review: string};
  beats: TraceBeatV2[];
}

export interface ProblemTraceV2 {
  meta: {
    problemId: number;
    title: string;
    sourceHeading: string;
    sourcePath: string;
    sourceSha256: string;
    semanticTokenHash: string;
    sceneKind: SceneStateV2["sceneKind"];
    input: unknown;
    expected: unknown;
    invariant: string;
    aha: string;
    time: string;
    space: string;
  };
  code: {language: "cpp"; text: string; lines: CodeLineV2[]};
  frames: TraceFrameV2[];
}

export interface AnimationAuditV2 {
  problemId: number;
  frameCount: number;
  beatCount: number;
  finalPhase: "return";
  finalDurationMs: number;
  validLineIds: boolean;
  sourceSha256: string;
  semanticTokenHash: string;
}
