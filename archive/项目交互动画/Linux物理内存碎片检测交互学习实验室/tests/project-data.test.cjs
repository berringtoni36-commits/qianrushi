const test = require('node:test');
const assert = require('node:assert/strict');

let data = {};
try {
  data = require('../project-data.js');
} catch (_) {
  data = {};
}

test('both source-grounded execution routes contain eight complete stages', () => {
  assert.deepEqual(Object.keys(data.pipelineRoutes || {}).sort(), ['event', 'status']);
  for (const route of Object.values(data.pipelineRoutes)) {
    assert.equal(route.length, 8);
    route.forEach((step) => {
      assert.ok(step.label);
      assert.ok(step.source);
      assert.ok(step.code);
      assert.ok(step.detail);
      assert.ok(step.boundary);
    });
  }
});

test('scenario presets reproduce all three documented hand calculations', () => {
  assert.equal(data.scenarios.length, 3);
  assert.deepEqual(data.scenarios.map((item) => item.expected), [
    { unusable: 600, extfrag: -1000 },
    { unusable: 1000, extfrag: 584 },
    { unusable: 1000, extfrag: 250 }
  ]);
});

test('CLI data covers every flag implemented by exfrag_user.py', () => {
  const flags = data.cliOptions.map((item) => item.short);
  ['-d', '-n', '-i', '-c', '-e', '-u', '-s', '-b', '-z', '-v'].forEach((flag) => assert.ok(flags.includes(flag), flag));
});

test('fault lab and quiz cover architecture, maps, metrics and source boundaries', () => {
  assert.ok(data.faults.length >= 5);
  assert.ok(data.quizzes.length >= 8);
  ['架构', '伙伴系统', '探针', 'BPF map', '指数', '故障'].forEach((topic) => {
    assert.ok(data.quizzes.some((item) => item.topic === topic), `missing topic ${topic}`);
  });
});

