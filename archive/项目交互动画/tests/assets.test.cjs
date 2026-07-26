const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('all 100 LSTR input and result frames are packaged as matching pairs', () => {
  for (let frame = 1; frame <= 100; frame += 1) {
    const name = `${String(frame).padStart(3, '0')}.jpg`;
    assert.ok(fs.existsSync(path.join(root, 'assets', 'lstr', 'input', name)), `missing input ${name}`);
    assert.ok(fs.existsSync(path.join(root, 'assets', 'lstr', 'result', name)), `missing result ${name}`);
  }
});

test('LIME and Unet real before/output examples are packaged', () => {
  ['lime/input.jpg', 'lime/output.jpg', 'unet/input.jpg', 'unet/output.jpg'].forEach((relative) => {
    const target = path.join(root, 'assets', ...relative.split('/'));
    assert.ok(fs.existsSync(target), `missing ${relative}`);
    assert.ok(fs.statSync(target).size > 1000, `${relative} is unexpectedly small`);
  });
});

test('the learning app has no remote runtime dependency', () => {
  ['index.html', 'styles.css', 'app.js', 'app-core.js', 'project-data.js'].forEach((file) => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(content, /https?:\/\//i, `${file} contains a remote URL`);
  });
});

