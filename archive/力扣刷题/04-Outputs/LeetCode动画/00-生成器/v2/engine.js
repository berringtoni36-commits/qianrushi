(() => {
  'use strict';

  const trace = JSON.parse(document.getElementById('problem-trace').textContent);
  const root = document.getElementById('app');
  const timeline = trace.frames.flatMap((frame, frameIndex) => frame.beats.map((item, beatIndex) => ({
    frame,
    frameIndex,
    beat: item,
    beatIndex,
  })));
  const codeLines = trace.code.lines;
  let index = 0;
  let timer = null;
  let speed = 1;
  let density = readStored('density', 'learning');
  let themeMode = readStored('theme', queryValue('theme') || 'auto');

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function queryValue(key) {
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    return query.get(key) || hash.get(key);
  }

  function storageKey(name) { return `leetcode-v2-${trace.meta.problemId}-${name}`; }
  function readStored(name, fallback) {
    try { return localStorage.getItem(storageKey(name)) || fallback; } catch (_) { return fallback; }
  }
  function store(name, value) {
    try { localStorage.setItem(storageKey(name), value); } catch (_) {}
  }

  function hostTheme() {
    const documents = [document];
    try { if (window.parent && window.parent.document) documents.push(window.parent.document); } catch (_) {}
    for (const doc of documents) {
      const classes = `${doc.documentElement?.className || ''} ${doc.body?.className || ''}`;
      if (/\btheme-dark\b/.test(classes)) return 'dark';
      if (/\btheme-light\b/.test(classes)) return 'light';
    }
    return null;
  }

  function resolvedTheme() {
    if (themeMode !== 'auto') return themeMode;
    return hostTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function applyTheme() {
    document.documentElement.dataset.theme = resolvedTheme();
    const button = document.getElementById('theme-toggle');
    if (button) {
      const labels = {auto: '自动', light: '浅色', dark: '深色'};
      button.textContent = labels[themeMode];
      button.title = `主题：${labels[themeMode]}（点击切换）`;
    }
  }

  function cycleTheme() {
    themeMode = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto';
    store('theme', themeMode);
    applyTheme();
  }

  function highlightCpp(source) {
    const commentAt = source.indexOf('//');
    const code = commentAt >= 0 ? source.slice(0, commentAt) : source;
    const comment = commentAt >= 0 ? source.slice(commentAt) : '';
    let output = esc(code);
    output = output.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="tok-string">$1</span>');
    output = output.replace(/\b(class|public|return|if|else|for|while|auto|int|void|string|vector|struct|new|delete|NULL)\b/g, '<span class="tok-keyword">$1</span>');
    output = output.replace(/\b(\d+(?:e\d+)?)\b/gi, '<span class="tok-number">$1</span>');
    return output + (comment ? `<span class="tok-comment">${esc(comment)}</span>` : '');
  }

  function renderShell() {
    root.innerHTML = `
      <main class="app">
        <header class="topbar">
          <div class="identity">
            <div class="eyebrow">YXC TRACE LAB · LEETCODE ${esc(trace.meta.problemId)}</div>
            <h1>${esc(trace.meta.title)}</h1>
            <p class="subtitle">${esc(trace.meta.algorithm)} · ${esc(trace.meta.exampleText)}</p>
          </div>
          <div class="header-actions">
            <span class="badge"><strong>${esc(trace.meta.difficulty)}</strong></span>
            <span class="badge">${esc(trace.meta.time)}</span>
            <span class="badge">${esc(trace.meta.space)}</span>
            <div class="segmented" aria-label="讲解密度">
              <button id="mode-learning" type="button">学习</button>
              <button id="mode-review" type="button">复习</button>
            </div>
            <button class="theme-button" id="theme-toggle" type="button">自动</button>
          </div>
        </header>
        <section class="contract-strip">
          <div class="contract-item"><span class="contract-label">INVARIANT / 不变量</span><span class="contract-value">${esc(trace.meta.invariant)}</span></div>
          <div class="contract-item aha"><span class="contract-label">AHA / 关键顿悟</span><span class="contract-value">${esc(trace.meta.aha)}</span></div>
        </section>
        <section class="workspace">
          <section class="panel scene-panel">
            <div class="panel-head"><strong>EXECUTION STATE</strong><span id="phase-label"></span></div>
            <div class="stage-scroll"><div class="stage" id="stage"></div></div>
            <div class="caption">
              <div class="caption-meta"><span id="frame-label"></span><span id="beat-label"></span></div>
              <h2 id="caption-title"></h2>
              <p id="caption-copy"></p>
            </div>
          </section>
          <section class="panel code-panel">
            <div class="panel-head"><strong>YXC FINAL CODE / C++17</strong><span id="source-line"></span></div>
            <div class="code-scroll" id="code-scroll">${codeLines.map(codeLine => `
              <div class="code-line" data-line-id="${codeLine.id}" title="源 Markdown 第 ${codeLine.sourceLine} 行">
                <span class="ln">${codeLine.id.slice(1)}</span><code>${highlightCpp(codeLine.text) || ' '}</code>
              </div>`).join('')}</div>
            <div class="code-audit">
              <span class="hash-ok">YXC SOURCE LOCKED</span>
              <span>SHA-256 ${esc(trace.meta.sourceSha256)}</span>
              <span>TOKEN ${esc(trace.meta.semanticTokenHash)}</span>
            </div>
          </section>
        </section>
        <footer class="transport">
          <div class="transport-buttons">
            <button class="icon-button" id="reset" type="button" title="回到开始" aria-label="回到开始">↺</button>
            <button class="icon-button" id="prev" type="button" title="上一步" aria-label="上一步">←</button>
            <button class="icon-button" id="play" type="button" title="播放或暂停" aria-label="播放或暂停">▶</button>
            <button class="icon-button" id="next" type="button" title="下一步" aria-label="下一步">→</button>
          </div>
          <input class="timeline" id="timeline" type="range" min="0" max="${Math.max(timeline.length - 1, 0)}" value="0" aria-label="执行进度">
          <div class="transport-meta"><span id="counter"></span><select class="speed" id="speed" aria-label="播放速度"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div>
        </footer>
      </main>`;

    document.getElementById('theme-toggle').onclick = cycleTheme;
    document.getElementById('mode-learning').onclick = () => setDensity('learning');
    document.getElementById('mode-review').onclick = () => setDensity('review');
    document.getElementById('prev').onclick = () => goto(index - 1);
    document.getElementById('next').onclick = () => goto(index + 1);
    document.getElementById('reset').onclick = () => goto(0);
    document.getElementById('play').onclick = togglePlay;
    document.getElementById('timeline').oninput = event => goto(Number(event.target.value));
    document.getElementById('speed').onchange = event => { speed = Number(event.target.value); if (timer) { stop(); play(); } };
  }

  function setDensity(value) {
    density = value;
    store('density', value);
    render(false);
  }

  function variableGrid(variables) {
    const entries = Object.entries(variables || {});
    if (!entries.length) return '<div class="empty-state">当前步骤没有额外变量。</div>';
    return `<div class="kv-grid">${entries.map(([key, value]) => `<div class="kv ${value !== null && value !== '∅' ? 'active' : ''}"><span>${esc(key)}</span><strong>${esc(value === null ? 'NULL' : value)}</strong></div>`).join('')}</div>`;
  }

  function ledger(title, data, hitKeys = []) {
    const entries = Object.entries(data || {});
    return `<div class="state-box"><h3>${esc(title)}</h3><div class="ledger">${entries.length ? entries.map(([key, value]) => `<div class="ledger-row ${hitKeys.includes(String(key)) ? 'hit' : ''}"><span>${esc(key)}</span><span>→</span><strong>${esc(value)}</strong></div>`).join('') : '<div class="empty-state">空</div>'}</div></div>`;
  }

  function renderHashArray(state) {
    const result = new Set(state.result || []), compared = new Set(state.compared || []), active = new Set(state.active || []);
    const pointer = state.variables?.i;
    return `<div class="scene-layout"><div class="primary-visual"><div class="array-row">${state.values.map((value, i) => `<div class="array-cell ${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''} ${result.has(i) ? 'result' : ''}" style="view-transition-name: array-${i}">${pointer === i ? '<span class="pointer">i</span>' : ''}<span>${esc(value)}</span><span class="index">${i}</span></div>`).join('')}</div>${state.formula ? `<div class="relation-note">${esc(state.formula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>Variables</h3>${variableGrid(state.variables)}</div>${ledger('heap · value → index', state.hash, state.variables?.r === null ? [] : [String(state.variables?.r)])}</aside></div>`;
  }

  function renderWater(state) {
    const maxHeight = Math.max(...state.values) + Math.max(...state.water, 0);
    const scale = Math.min(62, 235 / Math.max(maxHeight, 1));
    const active = new Set(state.active || []), compared = new Set(state.compared || []);
    return `<div class="scene-layout"><div class="primary-visual"><div class="water-chart">${state.values.map((value, i) => {
      const water = state.water[i] || 0;
      return `<div class="water-col ${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''}" style="view-transition-name: water-${i}"><div class="water-fill" style="bottom:${value * scale}px;height:${water * scale}px"></div><div class="bar" style="height:${Math.max(value * scale, 2)}px"></div><span class="water-value" style="bottom:${value * scale + water * scale + 6}px">${value}${water ? ` +${water}` : ''}</span><span class="water-index">${i}</span></div>`;
    }).join('')}</div>${state.formula ? `<div class="relation-note">${esc(state.formula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>Variables</h3>${variableGrid(state.variables)}</div><div class="state-box"><h3>Monotonic stack · bottom → top</h3><div class="stack-list">${state.stack.length ? state.stack.map(i => `<div class="stack-item">${i} : h=${state.values[i]}</div>`).join('') : '<div class="empty-state">空栈</div>'}</div></div></aside></div>`;
  }

  function renderWindow(state) {
    const active = new Set(state.active || []), compared = new Set(state.compared || []), best = new Set(state.bestRange?.length ? Array.from({length: state.bestRange[1] - state.bestRange[0] + 1}, (_, k) => state.bestRange[0] + k) : []);
    const range = state.range?.length ? state.range : [-1, -2];
    return `<div class="scene-layout"><div class="primary-visual"><div class="window-strip">${state.values.map((value, i) => `<div class="char-cell ${i >= range[0] && i <= range[1] ? 'in-window' : ''} ${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''} ${best.has(i) ? 'best' : ''}" style="view-transition-name: char-${i}">${state.variables?.j === i ? '<span class="pointer">j</span>' : ''}<span>${esc(value)}</span><span class="index">${i}</span></div>`).join('')}</div><div class="maps">${ledger('ht · 需求', state.need)}${ledger('hs · 当前窗口', state.window)}</div>${state.formula ? `<div class="relation-note">${esc(state.formula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>Variables</h3>${variableGrid(state.variables)}</div><div class="state-box"><h3>Current range</h3><div class="empty-state">${state.range?.length ? `[${state.range[0]}, ${state.range[1]}] · ${esc(state.values.slice(state.range[0], state.range[1] + 1).join(''))}` : '空窗口'}</div></div></aside></div>`;
  }

  function renderLinked(state) {
    const nodeIndex = new Map(state.nodes.map((node, i) => [node.id, i]));
    const pointerGroups = {};
    Object.entries(state.pointers || {}).forEach(([name, target]) => { if (target) (pointerGroups[target] ||= []).push(name); });
    const result = new Set(state.result || []), active = new Set(state.active || []);
    const paths = state.edges.map((edge, edgeIndex) => {
      const from = nodeIndex.get(edge.from), to = nodeIndex.get(edge.to);
      if (from === undefined || to === undefined) return '';
      const x1 = 100 + from * 200, x2 = 100 + to * 200;
      const bend = to > from ? 36 : 205;
      return `<path class="${edge.status === 'active' ? 'edge-active' : 'edge-normal'}" d="M ${x1 + (to > from ? 36 : -36)} 120 Q ${(x1+x2)/2} ${bend} ${x2 + (to > from ? -36 : 36)} 120" style="view-transition-name: edge-${esc(edge.from)}-${esc(edge.to)}-${edgeIndex}"></path>`;
    }).join('');
    const nulls = Object.entries(state.pointers || {}).filter(([, target]) => !target).map(([name]) => `<span class="pointer-chip">${esc(name)} → NULL</span>`).join('');
    return `<div class="scene-layout"><div class="primary-visual"><div class="linked-canvas"><svg class="linked-svg" viewBox="0 0 1000 230" preserveAspectRatio="none"><defs><marker id="arrow-normal" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)"></path></marker><marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--compare)"></path></marker></defs>${paths}</svg><div class="node-track">${state.nodes.map(node => `<div class="node-wrap"><div class="node ${active.has(node.id) ? 'active' : ''} ${result.has(node.id) ? 'result' : ''}" style="view-transition-name: node-${esc(node.id)}">${esc(node.value)}</div>${pointerGroups[node.id]?.length ? `<div class="pointer-stack">${pointerGroups[node.id].map(name => `<span>${esc(name)} ↓</span>`).join('')}</div>` : ''}</div>`).join('')}</div><div class="null-pointers">${nulls}</div></div></div><aside class="side-state"><div class="state-box"><h3>Pointers</h3>${variableGrid(state.pointers)}</div><div class="state-box"><h3>Visible edges</h3><div class="ledger">${state.edges.length ? state.edges.map(edge => `<div class="ledger-row ${edge.status === 'active' ? 'hit' : ''}"><span>${esc(edge.from)}</span><span>→</span><strong>${esc(edge.to)}</strong></div>`).join('') : '<div class="empty-state">无边</div>'}</div></div></aside></div>`;
  }

  function renderLru(state) {
    const byId = new Map(state.nodes.map(node => [node.id, node]));
    const active = new Set(state.active || []), inOrder = new Set(state.order || []);
    const nodeHtml = node => `<div class="lru-node ${node.id === 'L' || node.id === 'R' ? 'sentinel' : ''} ${active.has(node.id) ? 'active' : ''}" style="view-transition-name: lru-${esc(node.id)}">${node.id === 'L' || node.id === 'R' ? esc(node.id) : `key ${esc(node.key)}<br>val ${esc(node.value)}`}</div>`;
    const chain = (state.order || []).map((id, i) => `${i ? '<span class="lru-arrow">⇄</span>' : ''}${nodeHtml(byId.get(id))}`).join('');
    const detached = state.nodes.filter(node => !inOrder.has(node.id));
    return `<div class="scene-layout"><div class="primary-visual"><div class="lru-chain">${chain || '<span class="empty-state">主链暂不可达</span>'}</div><div class="detached"><span class="empty-state">DETACHED</span>${detached.map(nodeHtml).join('') || '<span class="empty-state">无</span>'}</div><table class="pointer-table"><thead><tr><th>node</th><th>left</th><th>right</th></tr></thead><tbody>${state.nodes.map(node => `<tr><td>${esc(node.id)}</td><td>${esc(node.left ?? 'NULL')}</td><td>${esc(node.right ?? 'NULL')}</td></tr>`).join('')}</tbody></table></div><aside class="side-state"><div class="state-box"><h3>Operation</h3>${variableGrid(state.variables)}</div>${ledger('hash · key → node', state.hash)}</aside></div>`;
  }

  function renderDp(state) {
    const active = new Set(state.active || []), compared = new Set(state.compared || []), result = new Set(state.result || []);
    return `<div class="scene-layout"><div class="primary-visual"><div class="dp-grid">${state.values.map((value, i) => `<div class="dp-cell ${active.has(i) ? 'active' : ''} ${compared.has(i) && !active.has(i) ? 'dependency' : ''} ${result.has(i) ? 'result' : ''}" style="view-transition-name: dp-${i}"><span class="index">f[${i}]</span><span>${value >= 100000000 ? '∞' : esc(value)}</span></div>`).join('')}</div>${state.formula ? `<div class="relation-note">${esc(state.formula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>Variables</h3>${variableGrid(state.variables)}</div><div class="state-box"><h3>Dependency</h3><div class="empty-state">金色格是来源，青色格是当前写入位置。每个 beat 保存写入后的完整 f 数组。</div></div></aside></div>`;
  }

  function renderScene(state) {
    const renderers = {
      'hash-array': renderHashArray,
      'water-stack': renderWater,
      'sliding-window': renderWindow,
      'linked-list': renderLinked,
      'lru-cache': renderLru,
      'dp-table': renderDp,
    };
    const visual = (renderers[state.sceneKind] || renderHashArray)(state);
    return `<div class="action-row"><div class="action-title">${esc(state.action)}</div><div class="formula">${esc(state.formula || '')}</div></div>${visual}`;
  }

  function render(animate = true) {
    const item = timeline[index];
    if (!item) return;
    const update = () => {
      document.getElementById('stage').innerHTML = renderScene(item.beat.state);
      document.getElementById('phase-label').textContent = item.frame.phase.toUpperCase();
      document.getElementById('frame-label').textContent = `FRAME ${item.frameIndex + 1}/${trace.frames.length}`;
      document.getElementById('beat-label').textContent = `BEAT ${item.beatIndex + 1}/${item.frame.beats.length}`;
      document.getElementById('caption-title').textContent = density === 'learning' ? item.frame.captions.learning : item.frame.captions.review;
      document.getElementById('caption-copy').textContent = item.beat.caption;
      document.getElementById('counter').textContent = `${index + 1} / ${timeline.length}`;
      document.getElementById('timeline').value = String(index);
      document.getElementById('prev').disabled = index === 0;
      document.getElementById('next').disabled = index === timeline.length - 1;
      document.getElementById('play').textContent = timer ? 'Ⅱ' : '▶';
      document.getElementById('mode-learning').setAttribute('aria-pressed', String(density === 'learning'));
      document.getElementById('mode-review').setAttribute('aria-pressed', String(density === 'review'));
      document.querySelectorAll('.code-line').forEach(lineNode => lineNode.classList.remove('primary', 'secondary'));
      item.beat.lineIds.forEach((lineId, lineIndex) => document.querySelector(`[data-line-id="${lineId}"]`)?.classList.add(lineIndex === 0 ? 'primary' : 'secondary'));
      const primaryLine = document.querySelector(`[data-line-id="${item.beat.lineIds[0]}"]`);
      primaryLine?.scrollIntoView({block: 'center', behavior: animate ? 'smooth' : 'auto'});
      const source = codeLines.find(codeLine => codeLine.id === item.beat.lineIds[0]);
      document.getElementById('source-line').textContent = source ? `代码 ${source.id.slice(1)} · 源文 ${source.sourceLine}` : '';
    };
    if (animate && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(update);
    else update();
  }

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    render(false);
  }

  function play() {
    if (index >= timeline.length - 1) index = 0;
    const tick = () => {
      if (index >= timeline.length - 1) { stop(); return; }
      index += 1;
      render(true);
      const current = timeline[index];
      const duration = Math.max(380, current.frame.durationMs / Math.max(current.frame.beats.length, 1) / speed);
      timer = setTimeout(tick, duration);
    };
    render(false);
    const current = timeline[index];
    timer = setTimeout(tick, Math.max(380, current.frame.durationMs / Math.max(current.frame.beats.length, 1) / speed));
    render(false);
  }

  function togglePlay() { timer ? stop() : play(); }
  function goto(nextIndex) {
    if (timer) stop();
    index = Math.max(0, Math.min(timeline.length - 1, nextIndex));
    render(true);
  }

  renderShell();
  applyTheme();
  render(false);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (themeMode === 'auto') applyTheme(); });
  document.addEventListener('keydown', event => {
    if (['INPUT', 'SELECT', 'BUTTON'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goto(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goto(index - 1); }
    if (event.key === ' ') { event.preventDefault(); togglePlay(); }
    if (event.key.toLowerCase() === 'r') goto(0);
  });

  window.__leetcodeAnimationV2 = {
    trace,
    timeline,
    getState: () => ({index, ...timeline[index]}),
    goto,
    audit: () => ({
      problemId: trace.meta.problemId,
      frameCount: trace.frames.length,
      beatCount: timeline.length,
      finalPhase: trace.frames.at(-1)?.phase,
      finalDurationMs: trace.frames.at(-1)?.durationMs,
      validLineIds: timeline.every(item => item.beat.lineIds.every(id => codeLines.some(line => line.id === id))),
      sourceSha256: trace.meta.sourceSha256,
      semanticTokenHash: trace.meta.semanticTokenHash,
    }),
  };
})();
