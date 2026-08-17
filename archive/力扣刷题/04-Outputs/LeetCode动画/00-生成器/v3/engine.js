(() => {
  'use strict';

  const trace = JSON.parse(document.getElementById('problem-trace').textContent);
  const root = document.getElementById('app');
  const codeLines = trace.code.lines;
  const timeline = trace.frames.flatMap((frame, frameIndex) => frame.beats.map((beat, beatIndex) => ({frame, frameIndex, beat, beatIndex})));
  const frameStarts = [];
  let cursor = 0;
  trace.frames.forEach((frame, i) => { frameStarts[i] = cursor; cursor += frame.beats.length; });
  let index = 0;
  let timer = null;
  let density = readStored('density', 'learning');
  let themeMode = readStored('theme', queryValue('theme') || 'auto');
  let speed = Number(readStored('speed', '1')) || 1;

  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function queryValue(key) { const q = new URLSearchParams(location.search); const h = new URLSearchParams(location.hash.replace(/^#/, '')); return q.get(key) || h.get(key); }
  function storageKey(name) { return `leetcode-v3-${trace.meta.problemId}-${name}`; }
  function readStored(name, fallback) { try { return localStorage.getItem(storageKey(name)) || fallback; } catch (_) { return fallback; } }
  function store(name, value) { try { localStorage.setItem(storageKey(name), String(value)); } catch (_) {} }
  function hostTheme() {
    const docs = [document];
    try { if (window.parent && window.parent.document) docs.push(window.parent.document); } catch (_) {}
    for (const doc of docs) { const classes = `${doc.documentElement?.className || ''} ${doc.body?.className || ''}`; if (/\btheme-dark\b/.test(classes)) return 'dark'; if (/\btheme-light\b/.test(classes)) return 'light'; }
    return null;
  }
  function resolvedTheme() { return themeMode === 'auto' ? (hostTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) : themeMode; }
  function applyTheme() {
    document.documentElement.dataset.theme = resolvedTheme();
    const button = document.getElementById('theme-toggle');
    if (button) { const labels = {auto: '自动', light: '浅色', dark: '深色'}; button.textContent = labels[themeMode]; button.title = `主题：${labels[themeMode]}（点击切换）`; }
  }
  function cycleTheme() { themeMode = themeMode === 'auto' ? 'light' : themeMode === 'light' ? 'dark' : 'auto'; store('theme', themeMode); applyTheme(); }
  function highlightCpp(source) {
    const at = source.indexOf('//'); const code = at >= 0 ? source.slice(0, at) : source; const comment = at >= 0 ? source.slice(at) : '';
    let output = esc(code);
    output = output.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, '<span class="tok-string">$1</span>');
    output = output.replace(/\b(class|public|return|if|else|for|while|auto|int|void|string|vector|struct|new|delete|NULL)\b/g, '<span class="tok-keyword">$1</span>');
    output = output.replace(/\b(\d+(?:e\d+)?)\b/gi, '<span class="tok-number">$1</span>');
    return output + (comment ? `<span class="tok-comment">${esc(comment)}</span>` : '');
  }

  function renderShell() {
    const options = trace.frames.map((frame, i) => `<option value="${i}">${i + 1}. ${esc(frame.id)} · ${esc(frame.captions.review)}</option>`).join('');
    root.innerHTML = `<main class="app">
      <header class="topbar"><div class="identity"><div class="eyebrow">YXC TRACE LAB · LEETCODE ${esc(trace.meta.problemId)} · V3 SERIES</div><h1>${esc(trace.meta.title)}</h1><p class="subtitle">${esc(trace.meta.algorithm)} · ${esc(trace.meta.exampleText)}</p></div><div class="header-actions"><span class="badge"><strong>${esc(trace.meta.difficulty)}</strong></span><span class="badge">${esc(trace.meta.time)}</span><span class="badge">${esc(trace.meta.space)}</span><div class="segmented" aria-label="讲解模式"><button id="mode-learning" type="button">学习</button><button id="mode-review" type="button">复习</button></div><button class="theme-button" id="theme-toggle" type="button">自动</button></div></header>
      <details class="problem-details"><summary>题面与算法契约 · 点击展开</summary><div class="problem-copy"><p><strong>输入：</strong>${esc(trace.meta.exampleText)}</p><p><strong>输出：</strong>${esc(trace.meta.expectedText)}</p><p><strong>不变量：</strong>${esc(trace.meta.invariant)}</p><p><strong>顿悟：</strong>${esc(trace.meta.aha)}</p></div></details>
      <section class="workspace"><section class="panel scene-panel"><div class="panel-head"><strong>动画与讲解</strong><span id="phase-label"></span></div><div class="stage-scroll"><div class="chapter-rail" id="chapter-rail" aria-label="教学章节"></div><div class="stage" id="stage"></div></div><div class="caption"><div class="caption-meta"><span id="frame-label"></span><span id="beat-label"></span></div><h2 id="caption-title"></h2><p id="caption-copy"></p><details class="caption-extra"><summary>展开本步的完整解释</summary><p id="caption-detail"></p></details></div></section>
      <section class="panel code-panel"><div class="panel-head"><strong>YXC FINAL CODE / C++17</strong><span id="source-line"></span></div><div class="code-scroll" id="code-scroll">${codeLines.map(line => `<div class="code-line" data-line-id="${line.id}" title="源 Markdown 第 ${line.sourceLine} 行"><span class="ln">${line.id.slice(1)}</span><code>${highlightCpp(line.text) || ' '}</code></div>`).join('')}</div><div class="code-action"><span>当前代码动作</span><strong id="code-action-title"></strong><p id="code-action-copy"></p></div><details class="code-audit"><summary class="hash-ok">YXC SOURCE LOCKED · TRACE READ-ONLY</summary><span>SHA-256 ${esc(trace.meta.sourceSha256)}</span><span>TOKEN ${esc(trace.meta.semanticTokenHash)}</span></details></section></section>
      <footer class="transport"><div class="transport-buttons"><button class="icon-button" id="reset" type="button" title="回到开始" aria-label="回到开始">↺</button><button class="icon-button" id="prev" type="button" title="上一个 beat" aria-label="上一个 beat">←</button><button class="icon-button" id="play" type="button" title="播放或暂停" aria-label="播放或暂停">▶</button><button class="icon-button" id="next" type="button" title="下一个 beat" aria-label="下一个 beat">→</button></div><input class="timeline" id="timeline" type="range" min="0" max="${Math.max(timeline.length - 1, 0)}" value="0" aria-label="执行进度"><div class="transport-meta"><span class="beat-progress" id="counter"></span><span class="frame-jump">章节<select class="frame-select" id="frame-select" aria-label="跳转章节">${options}</select></span><select class="speed" id="speed" aria-label="播放速度"><option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></div></footer>
    </main>`;
    document.getElementById('chapter-rail').innerHTML = trace.frames.map((frame, i) => `<button class="chapter-button" data-frame-index="${i}" type="button" title="${esc(frame.captions.review)}">${i + 1}</button>`).join('');
    document.getElementById('theme-toggle').onclick = cycleTheme;
    document.getElementById('mode-learning').onclick = () => setDensity('learning');
    document.getElementById('mode-review').onclick = () => setDensity('review');
    document.getElementById('prev').onclick = () => goto(index - 1);
    document.getElementById('next').onclick = () => goto(index + 1);
    document.getElementById('reset').onclick = () => goto(0);
    document.getElementById('play').onclick = togglePlay;
    document.getElementById('timeline').oninput = event => goto(Number(event.target.value));
    document.getElementById('frame-select').onchange = event => goto(frameStarts[Number(event.target.value)] || 0);
    document.querySelectorAll('.chapter-button').forEach(button => button.onclick = () => goto(frameStarts[Number(button.dataset.frameIndex)] || 0));
    const speedSelect = document.getElementById('speed'); speedSelect.value = String(speed); speedSelect.onchange = event => { speed = Number(event.target.value); store('speed', speed); if (timer) { stop(); play(); } };
  }
  function setDensity(value) { density = value; store('density', value); render(false); }
  function variableGrid(vars) { return `<div class="kv-grid">${Object.entries(vars || {}).map(([key, value]) => `<div class="kv ${value !== null && value !== '∅' ? 'active' : ''}"><span>${esc(key)}</span><strong>${esc(value === null ? 'NULL' : value)}</strong></div>`).join('')}</div>`; }
  function previousState() { return index > 0 ? timeline[index - 1].beat.state : null; }
  function changedState(item) {
    const current = item.beat.state, before = previousState(), changes = [];
    const keys = new Set([...Object.keys(before?.variables || {}), ...Object.keys(current.variables || {})]);
    keys.forEach(key => {
      const oldValue = before?.variables?.[key] ?? null;
      const newValue = current.variables?.[key] ?? null;
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) changes.push(`${key}: ${oldValue ?? 'NULL'} → ${newValue ?? 'NULL'}`);
    });
    const pointerKeys = new Set([...Object.keys(before?.pointers || {}), ...Object.keys(current.pointers || {})]);
    pointerKeys.forEach(key => {
      const oldValue = before?.pointers?.[key] ?? null, newValue = current.pointers?.[key] ?? null;
      if (oldValue !== newValue) changes.push(`${key}: ${oldValue ?? 'NULL'} → ${newValue ?? 'NULL'}`);
    });
    [['stk', 'stack'], ['queue', 'queue'], ['range', 'range'], ['result', 'result'], ['hash', 'hash'], ['edges', 'edges'], ['values', 'values']].forEach(([label, key]) => {
      const oldValue = JSON.stringify(before?.[key] ?? null), newValue = JSON.stringify(current[key] ?? null);
      if (oldValue !== newValue) changes.push(`${label} 已更新`);
    });
    return changes.length ? changes.slice(0, 5).join('；') : '状态只被读取，没有写入变化';
  }
  function formulaBreakdown(item) {
    const state = item.beat.state, raw = state.formula || '';
    if (!raw) return item.frame.phase === 'return' ? (state.action || item.beat.caption) : '';
    if (state.sceneKind !== 'water-stack') return raw;
    const currentRes = Number(state.variables?.res || 0);
    const oldRes = Number(previousState()?.variables?.res || 0);
    const added = currentRes - oldRes;
    const parts = raw.match(/^\(([^)]+)\)×\(([^)]+)\)=(-?\d+)$/);
    if (!parts || !item.beat.lineIds.some(id => id === 'L9' || id === 'L14')) return raw;
    const isPopFormula = item.beat.lineIds.includes('L9');
    const height = isPopFormula ? parts[1] : parts[2];
    const width = isPopFormula ? parts[2] : parts[1];
    return `高度 ${height} · 宽度 ${width} · 旧 res ${oldRes} + 新增 ${added} = 新 res ${currentRes}`;
  }
  function conditionSummary(item) {
    const action = item.beat.state.action || '';
    if (/≤|≥|<|>|==|!=|true|false|为空|命中|未找到|满足|不满足|右边界|停止|比较|检查/.test(action)) return action;
    return '本步不是条件分支，按当前代码行执行状态变更';
  }
  function invariantSummary(state) {
    if (state.sceneKind !== 'water-stack') return trace.meta.invariant || '当前可见状态继续满足本题的核心不变量';
    const heights = (state.stack || []).map(i => state.values[i]);
    const valid = heights.every((value, i) => i === 0 || heights[i - 1] > value);
    return valid ? '栈底到栈顶柱高保持严格递减，不变量成立' : '当前 beat 正在弹栈或处理等高柱，下一次入栈后恢复递减不变量';
  }
  function resultSummary(item) {
    if (item.beat.state.sceneKind !== 'water-stack') {
      if (item.frame.phase === 'return') return `最终状态已经由返回代码确认：${item.beat.caption}`;
      if (item.beat.state.formula) return `本步按公式更新：${item.beat.state.formula}`;
      return '当前只展示 trace 中已经由代码确认的状态，不提前显示后续结果';
    }
    const currentRes = Number(item.beat.state.variables?.res || 0);
    const oldRes = Number(previousState()?.variables?.res || 0);
    if (currentRes > oldRes) return `右边界 i=${item.beat.state.variables?.i} 已确认本层，water[] 此时才增加 ${currentRes - oldRes} 格`;
    return '没有新的左右边界同时成立，因此 water[] 不提前增加';
  }
  function ledger(title, data, hitKeys = []) {
    const entries = Object.entries(data || {});
    return `<div class="state-box"><h3>${esc(title)}</h3><div class="ledger">${entries.length ? entries.map(([key, value]) => `<div class="ledger-row ${hitKeys.includes(String(key)) ? 'hit' : ''}"><span>${esc(key)}</span><span>→</span><strong>${esc(value)}</strong></div>`).join('') : '<div class="empty-state">空</div>'}</div></div>`;
  }
  function renderHashArray(state, displayFormula) {
    const result = new Set(state.result || []), compared = new Set(state.compared || []), active = new Set(state.active || []), pointer = state.variables?.i;
    return `<div class="scene-layout"><div class="primary-visual"><div class="array-row">${(state.values || []).map((value, i) => `<div class="array-cell ${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''} ${result.has(i) ? 'result' : ''}" style="view-transition-name: array-${i}">${pointer === i ? '<span class="pointer">i</span>' : ''}<span>${esc(value)}</span><span class="index">${i}</span></div>`).join('')}</div>${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>本步变量</h3>${variableGrid(state.variables)}</div>${ledger('映射 · key → value', state.hash, state.variables?.r === null ? [] : [String(state.variables?.r)])}<div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function renderWindow(state, displayFormula) {
    const active = new Set(state.active || []), compared = new Set(state.compared || []), best = new Set(state.bestRange?.length ? Array.from({length: state.bestRange[1] - state.bestRange[0] + 1}, (_, k) => state.bestRange[0] + k) : []), range = state.range?.length ? state.range : [-1, -2];
    return `<div class="scene-layout"><div class="primary-visual"><div class="window-strip">${(state.values || []).map((value, i) => `<div class="char-cell ${i >= range[0] && i <= range[1] ? 'in-window' : ''} ${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''} ${best.has(i) ? 'best' : ''}" style="view-transition-name: char-${i}">${state.variables?.j === i ? '<span class="pointer">j</span>' : ''}<span>${esc(value)}</span><span class="index">${i}</span></div>`).join('')}</div><div class="maps">${ledger('需求 / target', state.need)}${ledger('当前窗口', state.window)}</div>${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>本步变量</h3>${variableGrid(state.variables)}</div><div class="state-box"><h3>当前区间</h3><div class="empty-state">${state.range?.length ? `[${state.range[0]}, ${state.range[1]}]` : '空窗口'}</div></div><div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function renderLinked(state, displayFormula) {
    const nodes = state.nodes || [], nodeIndex = new Map(nodes.map((node, i) => [node.id, i])), pointerGroups = {};
    Object.entries(state.pointers || {}).forEach(([name, target]) => { if (target) (pointerGroups[target] ||= []).push(name); });
    const result = new Set(state.result || []), active = new Set(state.active || []);
    const paths = (state.edges || []).map((edge, edgeIndex) => { const from = nodeIndex.get(edge.from), to = nodeIndex.get(edge.to); if (from === undefined || to === undefined) return ''; const x1 = 100 + from * 200, x2 = 100 + to * 200, bend = to > from ? 36 : 205; return `<path class="${edge.status === 'active' ? 'edge-active' : edge.status === 'result' ? 'edge-result' : 'edge-normal'}" d="M ${x1 + (to > from ? 36 : -36)} 120 Q ${(x1+x2)/2} ${bend} ${x2 + (to > from ? -36 : 36)} 120" style="view-transition-name: edge-${esc(edge.from)}-${esc(edge.to)}-${edgeIndex}"></path>`; }).join('');
    const nulls = Object.entries(state.pointers || {}).filter(([, target]) => !target).map(([name]) => `<span class="pointer-chip">${esc(name)} → NULL</span>`).join('');
    return `<div class="scene-layout"><div class="primary-visual"><div class="linked-canvas"><svg class="linked-svg" viewBox="0 0 1000 230" preserveAspectRatio="none"><defs><marker id="arrow-normal" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)"></path></marker><marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--compare)"></path></marker></defs>${paths}</svg><div class="node-track">${nodes.map(node => `<div class="node-wrap"><div class="node ${active.has(node.id) ? 'active' : ''} ${result.has(node.id) ? 'result' : ''}" style="view-transition-name: node-${esc(node.id)}">${esc(node.value)}</div>${pointerGroups[node.id]?.length ? `<div class="pointer-stack">${pointerGroups[node.id].map(name => `<span>${esc(name)} ↓</span>`).join('')}</div>` : ''}</div>`).join('')}</div><div class="null-pointers">${nulls}</div></div>${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>指针</h3>${variableGrid(state.pointers)}</div><div class="state-box"><h3>当前边</h3><div class="ledger">${(state.edges || []).length ? state.edges.map(edge => `<div class="ledger-row ${edge.status === 'active' ? 'hit' : ''}"><span>${esc(edge.from)}</span><span>→</span><strong>${esc(edge.to)}</strong></div>`).join('') : '<div class="empty-state">无边</div>'}</div></div><div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function renderLru(state, displayFormula) {
    const nodes = state.nodes || [], byId = new Map(nodes.map(node => [node.id, node])), active = new Set(state.active || []), inOrder = new Set(state.order || []);
    const nodeHtml = node => node ? `<div class="lru-node ${node.id === 'L' || node.id === 'R' ? 'sentinel' : ''} ${active.has(node.id) ? 'active' : ''}" style="view-transition-name: lru-${esc(node.id)}">${node.id === 'L' || node.id === 'R' ? esc(node.id) : `key ${esc(node.key)}<br>val ${esc(node.value)}`}</div>` : '';
    const chain = (state.order || []).map((id, i) => `${i ? '<span class="lru-arrow">⇄</span>' : ''}${nodeHtml(byId.get(id))}`).join(''), detached = nodes.filter(node => !inOrder.has(node.id));
    return `<div class="scene-layout"><div class="primary-visual"><div class="lru-chain">${chain || '<span class="empty-state">主链暂不可达</span>'}</div><div class="detached"><span class="empty-state">DETACHED</span>${detached.map(nodeHtml).join('') || '<span class="empty-state">无</span>'}</div><table class="pointer-table"><thead><tr><th>node</th><th>left</th><th>right</th></tr></thead><tbody>${nodes.map(node => `<tr><td>${esc(node.id)}</td><td>${esc(node.left ?? 'NULL')}</td><td>${esc(node.right ?? 'NULL')}</td></tr>`).join('')}</tbody></table>${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>操作变量</h3>${variableGrid(state.variables)}</div>${ledger('hash · key → node', state.hash)}<div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function renderDp(state, displayFormula) {
    const active = new Set(state.active || []), compared = new Set(state.compared || []), result = new Set(state.result || []);
    if (state.matrix?.length) return renderStateBoard(state, displayFormula);
    return `<div class="scene-layout"><div class="primary-visual"><div class="dp-grid">${(state.values || []).map((value, i) => `<div class="dp-cell ${active.has(i) ? 'active' : ''} ${compared.has(i) && !active.has(i) ? 'dependency' : ''} ${result.has(i) ? 'result' : ''}" style="view-transition-name: dp-${i}"><span class="index">f[${i}]</span><span>${value >= 100000000 ? '∞' : esc(value)}</span></div>`).join('')}</div>${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>本步变量</h3>${variableGrid(state.variables)}</div><div class="state-box"><h3>依赖</h3><div class="empty-state">金色格是依赖，主色格是当前写入位置；每个 beat 保存写入后的完整状态。</div></div><div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function sequenceBox(title, values, activeValues = []) {
    const active = new Set((activeValues || []).map(String));
    return `<div class="structure-box"><h3>${esc(title)}</h3><div class="structure-strip">${values?.length ? values.map((value, i) => `<span class="structure-chip ${active.has(String(value)) || active.has(String(i)) ? 'active' : ''}">${esc(value)}</span>`).join('') : '<span class="empty-state">空</span>'}</div></div>`;
  }
  function renderMatrix(state) {
    const active = new Set((state.activeCells || []).map(String)), compared = new Set((state.comparedCells || []).map(String)), result = new Set((state.resultCells || []).map(String));
    const cols = Math.max(...(state.matrix || [[]]).map(row => row.length), 1);
    return `<div class="matrix-grid" style="--matrix-cols:${cols}">${(state.matrix || []).flatMap((row, r) => row.map((value, c) => { const key = `${r},${c}`; return `<div class="matrix-cell ${active.has(key) ? 'active' : ''} ${compared.has(key) ? 'compared' : ''} ${result.has(key) ? 'result' : ''}"><span>${esc(value)}</span><small>${r},${c}</small></div>`; })).join('')}</div>`;
  }
  function renderTree(state) {
    const active = new Set((state.active || []).map(String)), result = new Set((state.result || []).map(String));
    const levels = new Map();
    (state.nodes || []).forEach((node, i) => { const level = Number(node.level ?? 0); if (!levels.has(level)) levels.set(level, []); levels.get(level).push({...node, order: node.order ?? i}); });
    const rows = [...levels.entries()].sort((a, b) => a[0] - b[0]).map(([level, nodes]) => `<div class="tree-level" data-level="${level}">${nodes.sort((a,b)=>a.order-b.order).map(node => `<div class="tree-node ${active.has(String(node.id)) ? 'active' : ''} ${result.has(String(node.id)) ? 'result' : ''}"><strong>${esc(node.value)}</strong><span>${esc(node.id)}</span></div>`).join('')}</div>`).join('');
    return `<div class="tree-board">${rows || '<div class="empty-state">空结构</div>'}<div class="edge-ledger">${(state.edges || []).map(edge => `<span class="edge-chip ${edge.status === 'active' ? 'active' : ''}">${esc(edge.from)} → ${esc(edge.to)}</span>`).join('')}</div></div>`;
  }
  function renderArrayBoard(state) {
    const active = new Set(state.active || []), compared = new Set(state.compared || []), result = new Set(state.result || []), labels = {};
    Object.entries(state.pointers || {}).forEach(([name, value]) => { if (Number.isInteger(value)) (labels[value] ||= []).push(name); });
    Object.entries(state.variables || {}).forEach(([name, value]) => { if (['i','j','l','r','left','right','slow','fast','mid','k','u'].includes(name) && Number.isInteger(value) && value >= 0 && value < (state.values || []).length) (labels[value] ||= []).push(name); });
    return `<div class="universal-array">${(state.values || []).map((value, i) => `<div class="array-cell ${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''} ${result.has(i) ? 'result' : ''}">${labels[i]?.length ? `<span class="pointer multi">${esc([...new Set(labels[i])].join(' · '))}</span>` : ''}<span>${esc(value)}</span><span class="index">${i}</span></div>`).join('')}</div>`;
  }
  function renderStateBoard(state, displayFormula) {
    const isTree = ['tree-graph', 'trie'].includes(state.sceneKind) || (state.nodes?.length && state.nodes.some(node => node.level !== undefined));
    const primary = state.matrix?.length ? renderMatrix(state) : isTree ? renderTree(state) : renderArrayBoard(state);
    const structures = [
      state.stack !== undefined ? sequenceBox('栈 · 底 → 顶', state.stack, state.activeStack) : '',
      state.queue !== undefined ? sequenceBox('队列 · 头 → 尾', state.queue, state.activeQueue) : '',
      state.heap !== undefined ? sequenceBox('堆 / 有序候选', state.heap, state.activeHeap) : '',
      state.path !== undefined ? sequenceBox('当前路径', state.path, state.activePath) : '',
      state.output !== undefined ? sequenceBox('已确认输出', Array.isArray(state.output) ? state.output : [state.output]) : ''
    ].filter(Boolean).join('');
    const maps = state.hash || state.counts || state.groups;
    return `<div class="scene-layout"><div class="primary-visual state-board"><div class="visual-label-row"><span>${esc(state.label || '完整可见状态')}</span><span>${esc(state.status || '')}</span></div>${primary}${structures ? `<div class="structure-grid">${structures}</div>` : ''}${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>本步变量</h3>${variableGrid(state.variables || state.pointers)}</div>${maps ? ledger('映射 / 计数', maps, state.hitKeys || []) : ''}<div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function renderWater(state, displayFormula) {
    const maxHeight = Math.max(...state.values, 1) + 1; const scale = Math.min(52, 206 / maxHeight); const active = new Set(state.active || []), compared = new Set(state.compared || []), result = new Set(state.result || []); const pointer = state.variables?.i;
    const columns = state.values.map((value, i) => { const water = state.water[i] || 0; const classes = `${active.has(i) ? 'active' : ''} ${compared.has(i) ? 'compared' : ''} ${result.has(i) ? 'settled' : ''}`; const pointerLabel = pointer === i ? '<span class="scan-pointer">i ↓</span>' : ''; return `<div class="water-col ${classes}" style="view-transition-name: water-${i}">${pointerLabel}<div class="water-fill" style="bottom:${value * scale}px;height:${water * scale}px"></div><div class="bar" style="height:${Math.max(value * scale, 2)}px"></div><span class="water-value" style="bottom:${value * scale + water * scale + 5}px">${value}${water ? ` +${water}` : ''}</span><span class="water-index">${i}</span></div>`; }).join('');
    const v = state.variables || {};
    return `<div class="scene-layout"><div class="primary-visual"><div class="visual-label-row"><span>height[] · water[] 完整状态</span><span>${pointer === null || pointer === undefined ? '扫描器待命' : `当前 i = ${pointer}`}</span></div><div class="water-chart">${columns}</div><div class="water-legend"><span><i class="legend-bar height-key"></i>柱高</span><span><i class="legend-bar water-key"></i>已结算水层</span><span><i class="legend-dot scan-key"></i>当前扫描</span></div>${displayFormula ? `<div class="relation-note">${esc(displayFormula)}</div>` : ''}</div><aside class="side-state"><div class="state-box"><h3>本步变量</h3>${variableGrid(v)}</div><div class="state-box"><h3>单调栈 · 栈底 → 栈顶</h3><div class="stack-list">${state.stack?.length ? state.stack.map(i => `<div class="stack-item ${i === v.top ? 'top' : ''}">${i} : h=${state.values[i]}</div>`).join('') : '<div class="empty-state">空栈</div>'}</div></div><div class="state-box state-callout"><h3>本步发生了什么</h3><p>${esc(state.action || '')}</p></div></aside></div>`;
  }
  function renderScene(item) {
    const displayFormula = formulaBreakdown(item), state = item.beat.state;
    const renderers = {'water-stack': renderWater, 'hash-array': renderHashArray, 'sliding-window': renderWindow, 'linked-list': renderLinked, 'lru-cache': renderLru, 'dp-table': renderDp};
    const renderer = renderers[state.sceneKind] || renderStateBoard;
    return `<div class="action-row"><div class="action-title">${esc(state.action || '')}</div><div class="formula">${esc(displayFormula)}</div></div>${renderer(state, displayFormula)}`;
  }
  function detailedCaption(item) {
    const lines = item.beat.lineIds.map(id => codeLines.find(line => line.id === id)?.text.trim()).filter(Boolean).join(' / ');
    const pitfall = item.beat.state.sceneKind === 'water-stack' ? 'water[] 和 res 只在对应加法代码已经执行后更新' : '只展示 trace 已经确认的状态，不能让渲染器自行推测下一步';
    return `当前代码：${lines}。判断：${conditionSummary(item)}。变化：${changedState(item)}。不变量：${invariantSummary(item.beat.state)}。结果：${resultSummary(item)}。易错点：${pitfall}。`;
  }
  function reviewCaption(item) { const formula = formulaBreakdown(item); return `${item.beat.lineIds.join('+')} · ${conditionSummary(item)} · ${changedState(item)}${formula ? ` · ${formula}` : ''}`; }
  function render(animate = true) {
    const item = timeline[index]; if (!item) return;
    const update = () => { document.getElementById('stage').innerHTML = renderScene(item); document.getElementById('phase-label').textContent = item.frame.phase.toUpperCase(); document.getElementById('frame-label').textContent = `章节 ${item.frameIndex + 1}/${trace.frames.length}`; document.getElementById('beat-label').textContent = `本章 beat ${item.beatIndex + 1}/${item.frame.beats.length}`; document.getElementById('caption-title').textContent = density === 'learning' ? item.frame.captions.learning : item.frame.captions.review; document.getElementById('caption-copy').textContent = density === 'learning' ? item.beat.caption : reviewCaption(item); document.getElementById('caption-detail').textContent = detailedCaption(item); document.getElementById('code-action-title').textContent = item.beat.state.action || ''; document.getElementById('code-action-copy').textContent = density === 'learning' ? detailedCaption(item) : reviewCaption(item); document.getElementById('counter').textContent = `执行 ${index + 1}/${timeline.length}`; document.getElementById('timeline').value = String(index); document.getElementById('prev').disabled = index === 0; document.getElementById('next').disabled = index === timeline.length - 1; document.getElementById('play').textContent = timer ? 'Ⅱ' : '▶'; document.getElementById('frame-select').value = String(item.frameIndex); document.querySelectorAll('.chapter-button').forEach((button, i) => button.setAttribute('aria-current', String(i === item.frameIndex))); document.getElementById('mode-learning').setAttribute('aria-pressed', String(density === 'learning')); document.getElementById('mode-review').setAttribute('aria-pressed', String(density === 'review')); document.querySelectorAll('.code-line').forEach(line => line.classList.remove('primary', 'secondary')); item.beat.lineIds.forEach((lineId, lineIndex) => document.querySelector(`[data-line-id="${lineId}"]`)?.classList.add(lineIndex === 0 ? 'primary' : 'secondary')); document.querySelector(`[data-line-id="${item.beat.lineIds[0]}"]`)?.scrollIntoView({block: 'center', behavior: animate ? 'smooth' : 'auto'}); const source = codeLines.find(line => line.id === item.beat.lineIds[0]); document.getElementById('source-line').textContent = source ? `代码 ${source.id.slice(1)} · 源文 ${source.sourceLine}` : ''; };
    if (animate && document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const transition = document.startViewTransition(update);
      transition.finished.catch(() => {});
    } else update();
  }
  function stop() { if (timer) clearTimeout(timer); timer = null; render(false); }
  function beatDuration(item) { const action = item.beat.state.action || ''; if (item.frame.phase === 'return') return 1400; if (/结算|面积|res/.test(action) && item.beat.state.formula) return 1000; if (/弹出|last 更新/.test(action)) return 880; if (/入栈/.test(action)) return 720; return 620; }
  function play() { if (index >= timeline.length - 1) index = 0; const tick = () => { if (index >= timeline.length - 1) { stop(); return; } index += 1; render(true); timer = setTimeout(tick, beatDuration(timeline[index]) / speed); }; timer = setTimeout(tick, beatDuration(timeline[index]) / speed); render(false); }
  function togglePlay() { timer ? stop() : play(); }
  function goto(nextIndex) { if (timer) stop(); index = Math.max(0, Math.min(timeline.length - 1, nextIndex)); render(true); }
  function gotoFrame(delta) { const target = Math.max(0, Math.min(trace.frames.length - 1, timeline[index].frameIndex + delta)); goto(frameStarts[target]); }

  renderShell(); applyTheme(); render(false); matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (themeMode === 'auto') applyTheme(); });
  document.addEventListener('keydown', event => { if (['INPUT', 'SELECT', 'BUTTON', 'SUMMARY'].includes(event.target.tagName)) return; if (event.key === 'ArrowRight') { event.preventDefault(); event.shiftKey ? gotoFrame(1) : goto(index + 1); } if (event.key === 'ArrowLeft') { event.preventDefault(); event.shiftKey ? gotoFrame(-1) : goto(index - 1); } if (event.key === ' ') { event.preventDefault(); togglePlay(); } if (event.key.toLowerCase() === 'r') goto(0); });
  window.__leetcodeAnimationV3 = { trace, timeline, getState: () => ({index, ...timeline[index]}), goto, gotoFrame, audit: () => ({problemId: trace.meta.problemId, frameCount: trace.frames.length, beatCount: timeline.length, finalPhase: trace.frames.at(-1)?.phase, finalDurationMs: trace.frames.at(-1)?.durationMs, validLineIds: timeline.every(item => item.beat.lineIds.every(id => codeLines.some(line => line.id === id))), dualColumn: getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns, sourceSha256: trace.meta.sourceSha256, semanticTokenHash: trace.meta.semanticTokenHash}) };
})();
