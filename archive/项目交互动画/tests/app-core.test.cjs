const test = require('node:test');
const assert = require('node:assert/strict');

let core = {};
try {
  core = require('../app-core.js');
} catch (_) {
  core = {};
}

const call = (name, ...args) =>
  typeof core[name] === 'function' ? core[name](...args) : { missing: name };

test('initial state starts at the first guided pipeline frame', () => {
  assert.deepEqual(call('createInitialState'), {
    section: 'system',
    mode: 'guided',
    step: 0,
    frame: 1,
    playing: false,
    speed: 1,
    model: 'lstr',
    limeEnabled: true,
    answers: {}
  });
});

test('pipeline step navigation clamps to the eight real stages', () => {
  const base = call('createInitialState');
  assert.equal(call('reduceState', { ...base, step: 7 }, { type: 'NEXT_STEP' }).step, 7);
  assert.equal(call('reduceState', base, { type: 'PREV_STEP' }).step, 0);
  assert.equal(call('reduceState', base, { type: 'SET_STEP', value: 4 }).step, 4);
});

test('frame navigation clamps direct input and wraps playback', () => {
  const base = call('createInitialState');
  assert.equal(call('reduceState', base, { type: 'SET_FRAME', value: 500 }).frame, 100);
  assert.equal(call('reduceState', { ...base, frame: 100 }, { type: 'NEXT_FRAME' }).frame, 1);
});

test('reset preserves learning choices but returns animation to its start', () => {
  const state = {
    ...call('createInitialState'),
    step: 6,
    frame: 42,
    playing: true,
    model: 'unet',
    mode: 'challenge',
    answers: { q1: 2 }
  };
  assert.deepEqual(call('reduceState', state, { type: 'RESET' }), {
    ...state,
    step: 0,
    frame: 1,
    playing: false
  });
});

test('frame paths use zero-padded paired local assets', () => {
  assert.equal(call('framePath', 1, 'input'), 'assets/lstr/input/001.jpg');
  assert.equal(call('framePath', 100, 'result'), 'assets/lstr/result/100.jpg');
});

test('performance metrics are derived from measured seconds', () => {
  assert.deepEqual(call('calculateMetrics', 1.6305, 0.314), {
    seconds: 0.314,
    fps: 3.18,
    speedup: 5.19
  });
  assert.equal(call('calculateMetrics', 1.953, 0.182).fps, 5.49);
});

test('quiz score counts only exact keyed answers', () => {
  const quizzes = [
    { id: 'a', answer: 1 },
    { id: 'b', answer: 2 },
    { id: 'c', answer: 0 }
  ];
  assert.deepEqual(call('scoreQuiz', { a: 1, b: 0 }, quizzes), {
    correct: 1,
    total: 3,
    answered: 2,
    percent: 33
  });
});

test('saved progress restores valid state and rejects malformed payloads', () => {
  const state = { ...call('createInitialState'), frame: 25, model: 'unet' };
  const saved = call('serializeState', state);
  assert.equal(call('restoreState', saved).frame, 25);
  assert.equal(call('restoreState', saved).model, 'unet');
  assert.deepEqual(call('restoreState', '{bad json'), call('createInitialState'));
});

test('saved progress normalizes unknown sections and answer payloads', () => {
  const restored = call('restoreState', JSON.stringify({ section: 'missing', answers: 'wrong' }));
  assert.equal(restored.section, 'system');
  assert.deepEqual(restored.answers, {});
});
