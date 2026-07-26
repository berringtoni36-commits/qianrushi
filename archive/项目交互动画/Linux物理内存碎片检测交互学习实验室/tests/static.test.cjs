const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('offline lab packages all required local files', () => {
  ['index.html', 'styles.css', 'app.js', 'app-core.js', 'project-data.js'].forEach((file) => {
    assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
  });
});

test('runtime has no remote dependency and clearly labels the simulation', () => {
  ['index.html', 'styles.css', 'app.js', 'app-core.js', 'project-data.js'].forEach((file) => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /(?:src|href)=["']https?:\/\//i, `${file} loads a remote resource`);
  });
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /离线教学仿真/);
});

test('HTML exposes all six laboratories and accessible primary controls', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['overview', 'buddy', 'hooks', 'metrics', 'terminal', 'challenge'].forEach((section) => {
    assert.match(html, new RegExp(`data-section=["']${section}["']`), `missing ${section}`);
  });
  assert.match(html, /aria-live=/);
  assert.match(html, /prefers-reduced-motion/);
});

test('answering a quiz immediately refreshes feedback and score', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /dispatch\(\{ type: 'ANSWER',[\s\S]{0,180}renderQuiz\(\)/);
});
