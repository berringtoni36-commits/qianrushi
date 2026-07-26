(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MemoryLabCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_ORDER = 10;
  const SECTIONS = ['overview', 'buddy', 'hooks', 'metrics', 'terminal', 'challenge'];
  const MODES = ['guided', 'free', 'challenge'];
  const ROUTES = ['status', 'event'];

  function clamp(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, Math.trunc(number)));
  }

  function calculateFragmentation(nrFree, targetOrder) {
    const order = clamp(targetOrder, 0, MAX_ORDER);
    const counts = Array.from({ length: MAX_ORDER + 1 }, (_, index) => {
      const value = Array.isArray(nrFree) ? Number(nrFree[index]) : 0;
      return Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0;
    });
    let freePages = 0;
    let freeBlocksTotal = 0;
    let freeBlocksSuitable = 0;
    counts.forEach((blocks, currentOrder) => {
      freeBlocksTotal += blocks;
      freePages += blocks * (2 ** currentOrder);
      if (currentOrder >= order) freeBlocksSuitable += blocks * (2 ** (currentOrder - order));
    });
    const requestedPages = 2 ** order;
    const unusable = freePages === 0
      ? 1000
      : Math.floor(((freePages - freeBlocksSuitable * requestedPages) * 1000) / freePages);
    let extfrag = 0;
    if (freeBlocksTotal === 0) {
      extfrag = 0;
    } else if (freeBlocksSuitable > 0) {
      extfrag = -1000;
    } else {
      extfrag = 1000 - Math.floor((1000 + Math.floor((freePages * 1000) / requestedPages)) / freeBlocksTotal);
    }
    return {
      targetOrder: order,
      requestedPages,
      freePages,
      freeBlocksTotal,
      freeBlocksSuitable,
      unusable,
      extfrag
    };
  }

  function cloneBuddyState(state) {
    const freeBlocks = {};
    for (let order = 0; order <= state.maxOrder; order += 1) {
      freeBlocks[order] = [...(state.freeBlocks[order] || [])].sort((a, b) => a - b);
    }
    const allocations = {};
    Object.entries(state.allocations || {}).forEach(([key, value]) => {
      allocations[key] = { ...value };
    });
    return { maxOrder: state.maxOrder, freeBlocks, allocations, nextId: state.nextId };
  }

  function createBuddyState(maxOrder) {
    const top = clamp(maxOrder == null ? 6 : maxOrder, 1, MAX_ORDER);
    const freeBlocks = {};
    for (let order = 0; order <= top; order += 1) freeBlocks[order] = [];
    freeBlocks[top] = [0];
    return { maxOrder: top, freeBlocks, allocations: {}, nextId: 1 };
  }

  function allocateBuddy(state, requestedOrder) {
    const source = cloneBuddyState(state);
    const order = clamp(requestedOrder, 0, source.maxOrder);
    let foundOrder = order;
    while (foundOrder <= source.maxOrder && source.freeBlocks[foundOrder].length === 0) foundOrder += 1;
    if (foundOrder > source.maxOrder) {
      return { state: source, allocation: null, trace: [], error: `没有可拆分成 order-${order} 的连续页块` };
    }
    let start = source.freeBlocks[foundOrder].shift();
    const trace = [{ type: 'take', start, order: foundOrder }];
    while (foundOrder > order) {
      foundOrder -= 1;
      const buddyStart = start + (2 ** foundOrder);
      source.freeBlocks[foundOrder].push(buddyStart);
      source.freeBlocks[foundOrder].sort((a, b) => a - b);
      trace.push({ type: 'split', start, buddyStart, order: foundOrder });
    }
    const id = `A${source.nextId}`;
    source.nextId += 1;
    const allocation = { id, start, order, pages: 2 ** order };
    source.allocations[id] = allocation;
    trace.push({ type: 'allocate', ...allocation });
    return { state: source, allocation, trace, error: null };
  }

  function freeBuddy(state, allocationId) {
    const source = cloneBuddyState(state);
    const allocation = source.allocations[allocationId];
    if (!allocation) return { state: source, trace: [], error: '找不到要释放的分配块' };
    delete source.allocations[allocationId];
    let start = allocation.start;
    let order = allocation.order;
    const trace = [{ type: 'free', start, order, id: allocationId }];
    while (order < source.maxOrder) {
      const buddyStart = start ^ (2 ** order);
      const buddyIndex = source.freeBlocks[order].indexOf(buddyStart);
      if (buddyIndex === -1) break;
      source.freeBlocks[order].splice(buddyIndex, 1);
      const mergedStart = Math.min(start, buddyStart);
      trace.push({ type: 'merge', start, buddyStart, mergedStart, order: order + 1 });
      start = mergedStart;
      order += 1;
    }
    source.freeBlocks[order].push(start);
    source.freeBlocks[order].sort((a, b) => a - b);
    return { state: source, trace, error: null };
  }

  function buddyCounts(state, size) {
    const length = clamp(size == null ? MAX_ORDER + 1 : size, 1, MAX_ORDER + 1);
    return Array.from({ length }, (_, order) => (state.freeBlocks[order] || []).length);
  }

  function pageMap(state) {
    const total = 2 ** state.maxOrder;
    const pages = Array.from({ length: total }, (_, pfn) => ({ pfn, type: 'unknown', label: '' }));
    Object.entries(state.freeBlocks).forEach(([orderText, starts]) => {
      const order = Number(orderText);
      starts.forEach((start) => {
        for (let page = start; page < start + (2 ** order); page += 1) {
          pages[page] = { pfn: page, type: 'free', label: `free order-${order}`, order, start };
        }
      });
    });
    Object.values(state.allocations).forEach((allocation) => {
      for (let page = allocation.start; page < allocation.start + allocation.pages; page += 1) {
        pages[page] = { pfn: page, type: 'used', label: `${allocation.id} order-${allocation.order}`, allocationId: allocation.id };
      }
    });
    return pages;
  }

  function recordCountEvent(map, event) {
    const output = { ...(map || {}) };
    const key = String(Math.trunc(Number(event.pid)));
    const previous = output[key];
    output[key] = {
      pid: Math.trunc(Number(event.pid)),
      pcomm: String(event.pcomm || 'unknown'),
      pfn: Math.max(0, Math.trunc(Number(event.pfn) || 0)),
      allocOrder: Math.max(0, Math.trunc(Number(event.allocOrder) || 0)),
      fallbackOrder: Math.max(0, Math.trunc(Number(event.fallbackOrder) || 0)),
      count: previous ? previous.count + 1 : 1
    };
    return output;
  }

  function applyThrottle(lastByKey, now, delayNs, mode) {
    const timestamp = Math.max(0, Number(now) || 0);
    const delay = Math.max(0, Number(delayNs) || 0);
    const key = mode === 'current-time' ? String(timestamp) : '0';
    const output = { ...(lastByKey || {}) };
    const last = output[key];
    const allowed = last == null || timestamp - last >= delay;
    if (allowed) output[key] = timestamp;
    return { allowed, key, lastByKey: output, previous: last == null ? null : last };
  }

  function createInitialState() {
    return {
      section: 'overview',
      mode: 'guided',
      route: 'status',
      step: 0,
      playing: false,
      speed: 1,
      answers: {},
      completed: []
    };
  }

  function normalizeState(value) {
    const base = createInitialState();
    const input = value && typeof value === 'object' ? value : {};
    return {
      section: SECTIONS.includes(input.section) ? input.section : base.section,
      mode: MODES.includes(input.mode) ? input.mode : base.mode,
      route: ROUTES.includes(input.route) ? input.route : base.route,
      step: clamp(input.step, 0, 7),
      playing: Boolean(input.playing),
      speed: [0.5, 1, 1.5, 2].includes(Number(input.speed)) ? Number(input.speed) : 1,
      answers: input.answers && typeof input.answers === 'object' && !Array.isArray(input.answers) ? { ...input.answers } : {},
      completed: Array.isArray(input.completed) ? input.completed.filter((item) => SECTIONS.includes(item)) : []
    };
  }

  function reduceState(current, action) {
    const state = normalizeState(current);
    switch (action && action.type) {
      case 'SET_SECTION': return normalizeState({ ...state, section: action.value });
      case 'SET_MODE': return normalizeState({ ...state, mode: action.value });
      case 'SET_ROUTE': return normalizeState({ ...state, route: action.value, step: 0, playing: false });
      case 'SET_STEP': return normalizeState({ ...state, step: action.value });
      case 'NEXT_STEP': return normalizeState({ ...state, step: Math.min(7, state.step + 1) });
      case 'PREV_STEP': return normalizeState({ ...state, step: Math.max(0, state.step - 1) });
      case 'SET_PLAYING': return normalizeState({ ...state, playing: action.value });
      case 'SET_SPEED': return normalizeState({ ...state, speed: action.value });
      case 'ANSWER': return normalizeState({ ...state, answers: { ...state.answers, [action.id]: Number(action.value) } });
      case 'COMPLETE': return normalizeState({ ...state, completed: [...new Set([...state.completed, action.value])] });
      case 'RESET_FLOW': return normalizeState({ ...state, step: 0, playing: false });
      default: return state;
    }
  }

  function serializeState(state) {
    return JSON.stringify(normalizeState(state));
  }

  function restoreState(payload) {
    try {
      return normalizeState(JSON.parse(payload));
    } catch (_) {
      return createInitialState();
    }
  }

  function scoreQuiz(answers, quizzes) {
    const bank = Array.isArray(quizzes) ? quizzes : [];
    const keyed = answers && typeof answers === 'object' ? answers : {};
    let correct = 0;
    let answered = 0;
    bank.forEach((quiz) => {
      if (Object.prototype.hasOwnProperty.call(keyed, quiz.id)) {
        answered += 1;
        if (Number(keyed[quiz.id]) === Number(quiz.answer)) correct += 1;
      }
    });
    return { correct, total: bank.length, answered, percent: bank.length ? Math.round((correct / bank.length) * 100) : 0 };
  }

  function buildCommand(options) {
    const value = options || {};
    const args = ['sudo', 'python3', 'exfrag_user.py'];
    if (Number(value.delay) !== 2 && Number(value.delay) > 0) args.push('-d', String(Math.trunc(Number(value.delay))));
    if (value.nodeInfo) args.push('-n');
    if (value.nodeId !== '' && value.nodeId != null) args.push('-i', String(Math.trunc(Number(value.nodeId))));
    if (String(value.comm || '').trim()) args.push('-c', String(value.comm).trim());
    if (value.extfrag) args.push('-e');
    if (value.unusable) args.push('-u');
    if (value.count) args.push('-s');
    if (value.bar) args.push('-b');
    if (value.zoneInfo) args.push('-z');
    if (value.view) args.push('-v');
    return args.join(' ');
  }

  return {
    MAX_ORDER,
    calculateFragmentation,
    createBuddyState,
    allocateBuddy,
    freeBuddy,
    buddyCounts,
    pageMap,
    recordCountEvent,
    applyThrottle,
    createInitialState,
    reduceState,
    serializeState,
    restoreState,
    scoreQuiz,
    buildCommand
  };
});

