(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.VisionDemoCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_STEP = 7;
  const MAX_FRAME = 100;

  function createInitialState() {
    return {
      section: 'system',
      mode: 'guided',
      step: 0,
      frame: 1,
      playing: false,
      speed: 1,
      model: 'lstr',
      limeEnabled: true,
      answers: {}
    };
  }

  function clamp(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, Math.round(numeric)));
  }

  function reduceState(state, action) {
    const current = { ...createInitialState(), ...state };
    switch (action.type) {
      case 'NEXT_STEP':
        return { ...current, step: clamp(current.step + 1, 0, MAX_STEP) };
      case 'PREV_STEP':
        return { ...current, step: clamp(current.step - 1, 0, MAX_STEP) };
      case 'SET_STEP':
        return { ...current, step: clamp(action.value, 0, MAX_STEP) };
      case 'SET_FRAME':
        return { ...current, frame: clamp(action.value, 1, MAX_FRAME) };
      case 'NEXT_FRAME':
        return { ...current, frame: current.frame >= MAX_FRAME ? 1 : current.frame + 1 };
      case 'SET_PLAYING':
        return { ...current, playing: Boolean(action.value) };
      case 'SET_SPEED':
        return { ...current, speed: [0.5, 1, 2].includes(Number(action.value)) ? Number(action.value) : 1 };
      case 'SET_MODEL':
        return { ...current, model: action.value === 'unet' ? 'unet' : 'lstr' };
      case 'SET_SECTION':
        return {
          ...current,
          section: ['system', 'lime', 'models', 'performance', 'quiz'].includes(action.value)
            ? action.value
            : 'system'
        };
      case 'SET_MODE':
        return { ...current, mode: ['guided', 'free', 'challenge'].includes(action.value) ? action.value : 'guided' };
      case 'TOGGLE_LIME':
        return { ...current, limeEnabled: !current.limeEnabled };
      case 'ANSWER':
        return { ...current, answers: { ...current.answers, [action.id]: Number(action.value) } };
      case 'RESET':
        return { ...current, step: 0, frame: 1, playing: false };
      default:
        return current;
    }
  }

  function framePath(frame, kind) {
    const safeFrame = clamp(frame, 1, MAX_FRAME);
    const folder = kind === 'result' ? 'result' : 'input';
    return `assets/lstr/${folder}/${String(safeFrame).padStart(3, '0')}.jpg`;
  }

  function calculateMetrics(baseline, seconds) {
    const base = Number(baseline);
    const duration = Number(seconds);
    if (!(base > 0) || !(duration > 0)) return { seconds: 0, fps: 0, speedup: 0 };
    return {
      seconds: duration,
      fps: Number((1 / duration).toFixed(2)),
      speedup: Number((base / duration).toFixed(2))
    };
  }

  function scoreQuiz(answers, quizzes) {
    const list = Array.isArray(quizzes) ? quizzes : [];
    const map = answers && typeof answers === 'object' ? answers : {};
    const answered = list.filter((item) => Object.prototype.hasOwnProperty.call(map, item.id)).length;
    const correct = list.filter((item) => map[item.id] === item.answer).length;
    return {
      correct,
      total: list.length,
      answered,
      percent: list.length ? Math.round((correct / list.length) * 100) : 0
    };
  }

  function serializeState(state) {
    return JSON.stringify({ ...createInitialState(), ...state, playing: false });
  }

  function restoreState(payload) {
    try {
      const parsed = JSON.parse(payload);
      if (!parsed || typeof parsed !== 'object') return createInitialState();
      let state = { ...createInitialState(), ...parsed, playing: false };
      if (!state.answers || typeof state.answers !== 'object' || Array.isArray(state.answers)) state.answers = {};
      state = reduceState(state, { type: 'SET_FRAME', value: state.frame });
      state = reduceState(state, { type: 'SET_STEP', value: state.step });
      state = reduceState(state, { type: 'SET_MODEL', value: state.model });
      state = reduceState(state, { type: 'SET_MODE', value: state.mode });
      state = reduceState(state, { type: 'SET_SECTION', value: state.section });
      return state;
    } catch (_) {
      return createInitialState();
    }
  }

  return {
    MAX_STEP,
    MAX_FRAME,
    createInitialState,
    reduceState,
    framePath,
    calculateMetrics,
    scoreQuiz,
    serializeState,
    restoreState
  };
});
