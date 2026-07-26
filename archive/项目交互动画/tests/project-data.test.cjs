const test = require('node:test');
const assert = require('node:assert/strict');

let data = {};
try {
  data = require('../project-data.js');
} catch (_) {
  data = {};
}

test('project data describes all eight end-to-end stages', () => {
  assert.equal(Array.isArray(data.pipelineSteps), true);
  assert.equal(data.pipelineSteps.length, 8);
  assert.deepEqual(data.pipelineSteps.map((step) => step.id), [
    'qt-event', 'capture', 'filesystem-in', 'lime',
    'inference', 'postprocess', 'filesystem-out', 'qt-monitor'
  ]);
  data.pipelineSteps.forEach((step) => {
    assert.ok(step.source.includes('Linux视觉感知处理系统源码'));
    assert.ok(step.code.length > 0);
  });
});

test('performance presets retain the recorded project measurements', () => {
  assert.deepEqual(data.limePerformance.map((item) => item.seconds), [1.6305, 1.031, 0.314]);
  assert.equal(data.modelPerformance.lstr.optimized, 0.182);
  assert.equal(data.modelPerformance.unet.optimized, 4.676);
});

test('quiz bank covers architecture, algorithms and failure analysis', () => {
  assert.ok(Array.isArray(data.quizzes));
  assert.ok(data.quizzes.length >= 6);
  assert.ok(data.quizzes.some((item) => item.topic === '系统'));
  assert.ok(data.quizzes.some((item) => item.topic === 'LIME'));
  assert.ok(data.quizzes.some((item) => item.topic === '模型'));
  assert.ok(data.quizzes.some((item) => item.topic === '故障'));
});

