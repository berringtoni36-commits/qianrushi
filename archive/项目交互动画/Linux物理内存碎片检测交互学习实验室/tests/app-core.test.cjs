const test = require('node:test');
const assert = require('node:assert/strict');

let core = {};
try {
  core = require('../app-core.js');
} catch (_) {
  core = {};
}

const call = (name, ...args) => {
  assert.equal(typeof core[name], 'function', `missing export: ${name}`);
  return core[name](...args);
};

test('fragmentation calculator matches the documented suitable-block example', () => {
  const nrFree = [8, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0];
  assert.deepEqual(call('calculateFragmentation', nrFree, 2), {
    targetOrder: 2,
    requestedPages: 4,
    freePages: 20,
    freeBlocksTotal: 11,
    freeBlocksSuitable: 2,
    unusable: 600,
    extfrag: -1000
  });
});

test('fragmentation calculator distinguishes fragmentation from total shortage', () => {
  assert.deepEqual(call('calculateFragmentation', [8, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0], 2), {
    targetOrder: 2,
    requestedPages: 4,
    freePages: 16,
    freeBlocksTotal: 12,
    freeBlocksSuitable: 0,
    unusable: 1000,
    extfrag: 584
  });
  assert.equal(call('calculateFragmentation', [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 2).extfrag, 250);
});

test('fragmentation calculator preserves source edge cases and sanitizes input', () => {
  const empty = call('calculateFragmentation', [], 99);
  assert.equal(empty.targetOrder, 10);
  assert.equal(empty.freePages, 0);
  assert.equal(empty.unusable, 1000);
  assert.equal(empty.extfrag, 0);
  assert.equal(call('calculateFragmentation', [-2, 1.9], 1).freePages, 2);
});

test('buddy allocation splits a larger block and free merges buddies back', () => {
  const initial = call('createBuddyState', 4);
  const allocated = call('allocateBuddy', initial, 2);
  assert.equal(allocated.error, null);
  assert.equal(allocated.allocation.start, 0);
  assert.equal(allocated.allocation.order, 2);
  assert.deepEqual(allocated.state.freeBlocks[2], [4]);
  assert.deepEqual(allocated.state.freeBlocks[3], [8]);
  assert.ok(allocated.trace.some((item) => item.type === 'split'));

  const released = call('freeBuddy', allocated.state, allocated.allocation.id);
  assert.equal(released.error, null);
  assert.deepEqual(released.state.freeBlocks[4], [0]);
  assert.equal(Object.keys(released.state.allocations).length, 0);
  assert.ok(released.trace.filter((item) => item.type === 'merge').length >= 2);
});

test('buddy allocation fails without mutating state when no suitable block exists', () => {
  const first = call('allocateBuddy', call('createBuddyState', 3), 3);
  const before = JSON.stringify(first.state);
  const second = call('allocateBuddy', first.state, 0);
  assert.match(second.error, /连续页块/);
  assert.equal(JSON.stringify(first.state), before);
});

test('counts map model aggregates by PID and keeps only the latest event fields', () => {
  let map = {};
  map = call('recordCountEvent', map, { pid: 42, pcomm: 'worker', pfn: 100, allocOrder: 2, fallbackOrder: 4 });
  map = call('recordCountEvent', map, { pid: 42, pcomm: 'worker', pfn: 220, allocOrder: 1, fallbackOrder: 3 });
  assert.deepEqual(map['42'], {
    pid: 42,
    pcomm: 'worker',
    pfn: 220,
    allocOrder: 1,
    fallbackOrder: 3,
    count: 2
  });
});

test('fixed-key throttle closes the state loop while current-time key does not', () => {
  let fixed = call('applyThrottle', {}, 1_000, 500, 'fixed');
  assert.equal(fixed.allowed, true);
  fixed = call('applyThrottle', fixed.lastByKey, 1_200, 500, 'fixed');
  assert.equal(fixed.allowed, false);
  fixed = call('applyThrottle', fixed.lastByKey, 1_600, 500, 'fixed');
  assert.equal(fixed.allowed, true);

  let broken = call('applyThrottle', {}, 1_000, 500, 'current-time');
  broken = call('applyThrottle', broken.lastByKey, 1_200, 500, 'current-time');
  assert.equal(broken.allowed, true);
  assert.equal(Object.keys(broken.lastByKey).length, 2);
});

test('learning state clamps navigation and safely restores saved progress', () => {
  const initial = call('createInitialState');
  assert.equal(initial.section, 'overview');
  assert.equal(initial.route, 'status');
  assert.equal(call('reduceState', { ...initial, step: 7 }, { type: 'NEXT_STEP' }).step, 7);
  assert.equal(call('reduceState', initial, { type: 'PREV_STEP' }).step, 0);
  assert.equal(call('restoreState', '{bad json').section, 'overview');
  assert.equal(call('restoreState', JSON.stringify({ section: 'missing', route: 'event' })).section, 'overview');
  assert.equal(call('restoreState', JSON.stringify({ section: 'missing', route: 'event' })).route, 'event');
});

test('quiz scoring counts only exact answers', () => {
  const questions = [{ id: 'a', answer: 1 }, { id: 'b', answer: 0 }];
  assert.deepEqual(call('scoreQuiz', { a: 1, b: 2 }, questions), {
    correct: 1,
    total: 2,
    answered: 2,
    percent: 50
  });
});

