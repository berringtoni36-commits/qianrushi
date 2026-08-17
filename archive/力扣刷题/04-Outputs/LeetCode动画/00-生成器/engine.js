
(() => {
  const data = JSON.parse(document.getElementById('problem-data').textContent);
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modeText = data.modeCopy || '每一步都只保留决定正确性的状态。';
  const themeKey = `leetcode-animation-theme-${data.id}`;
  const queryMode = new URLSearchParams(location.search).get('theme') || new URLSearchParams(location.hash.replace(/^#/, '')).get('theme');
  const valid = ['auto','light','dark'];
  const media = matchMedia('(prefers-color-scheme: light)');
  function detectHostTheme() {
    try {
      const roots = [window.parent?.document?.documentElement, window.parent?.document?.body].filter(Boolean);
      const classes = roots.map(node => String(node.className || '')).join(' ');
      if (/\btheme-dark\b|\bdark-mode\b/i.test(classes)) return 'dark';
      if (/\btheme-light\b|\blight-mode\b/i.test(classes)) return 'light';
      const raw = getComputedStyle(roots[0]).getPropertyValue('--background-primary').trim();
      const rgb = raw.match(/rgba?\(([^)]+)\)/i);
      if (rgb) {
        const values = rgb[1].split(',').slice(0, 3).map(Number);
        if (values.length === 3 && values.every(Number.isFinite)) {
          const luminance = (0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]) / 255;
          return luminance < 0.48 ? 'dark' : 'light';
        }
      }
    } catch (_) {}
    return null;
  }
  let savedTheme = ''; try { savedTheme = localStorage.getItem(themeKey) || ''; } catch (_) {}
  let themeMode = valid.includes(queryMode) ? queryMode : (valid.includes(savedTheme) ? savedTheme : 'auto');
  function setTheme(mode, persist = true) {
    themeMode = mode; document.documentElement.dataset.theme = mode === 'auto' ? (detectHostTheme() || (media.matches ? 'light' : 'dark')) : mode;
    const labels = {auto:['◌ 自动','切换主题（当前自动，跟随系统/宿主）'],light:['☀ 浅色','切换到暗色主题'],dark:['◐ 暗色','切换到自动主题']};
    const btn = $('theme-toggle'); if (btn) { btn.textContent = labels[mode][0]; btn.title = labels[mode][1]; btn.setAttribute('aria-label', labels[mode][1]); }
    if (persist && !valid.includes(queryMode)) { try { localStorage.setItem(themeKey, mode); } catch (_) {} }
  }
  document.body.innerHTML = `<main class="shell"><header class="top"><div><div class="eyebrow">C++ TRACE LAB · LEETCODE ${data.id}</div><h1 class="title">${esc(data.title)}</h1><p class="subtitle">每一步只追踪帮助理解 YXC 思路的关键状态：比较/选择什么、哪条指针或状态改变、为什么可以继续。</p></div><div class="top-meta"><span class="pill">${esc(data.difficulty)}</span><span class="pill">${esc(data.mode)}</span><span class="pill">${esc(data.day.replace(/^## /,''))}</span><button id="theme-toggle" type="button">◌ 自动</button></div></header><section class="grid"><section class="panel"><div class="panel-head"><span>解法动画 / TRACE</span><small id="step-kind">准备</small></div><div class="trace"><div class="lesson"><strong>先记住这一句</strong><p id="mode-copy"></p></div><div class="visual" id="visual"></div><div class="step-card"><div class="step-top"><span class="phase" id="phase"></span><span class="phase" id="step-index"></span></div><div class="step-title" id="step-title"></div><p class="step-body" id="step-body"></p></div><div class="controls"><button id="prev" type="button">← 上一步</button><button id="play" class="primary" type="button">▶ 播放</button><button id="next" type="button">下一步 →</button><input id="slider" aria-label="动画步骤" type="range" min="0" max="0" step="1" value="0"><span class="counter" id="counter"></span><button id="reset" type="button">重置</button></div></div><div class="details"><details><summary>完整题解中的易错点</summary><p id="pitfalls"></p></details></div></section><section class="panel code"><div class="panel-head"><span>YXC FINAL CODE / C++17</span><small>当前高亮：第 <span id="line-no">—</span> 行</small></div><div class="code-toolbar"><span>输入示例：<strong id="example"></strong></span><span>期望：<strong class="accent" id="expected"></strong></span></div><div class="code-scroll" id="code"></div></section></section><p class="foot">原始题解只读 · 关键状态优先 · 主题可自动跟随 Obsidian / 系统</p></main>`;
  $('mode-copy').textContent = modeText; $('example').textContent = data.example; $('expected').textContent = data.expected; $('pitfalls').textContent = data.pitfalls || '本题没有额外的易错点记录。';
  const codeLines = data.code.split('\n');
  const problemDrawer = document.createElement('details');
  problemDrawer.className = 'problem-drawer';
  problemDrawer.setAttribute('aria-label', '力扣官方题目');
  problemDrawer.innerHTML = `<summary>力扣官方题目（展开查看，不影响动画操作） <a class="problem-link" href="${esc(data.leetcodeUrl)}" target="_blank" rel="noreferrer">打开力扣原题 ↗</a></summary><div class="problem-copy">${data.officialHtml || '<p>题面暂未归档，请打开官方链接查看。</p>'}</div>`;
  document.querySelector('header.top').insertAdjacentElement('afterend', problemDrawer);
  const codeEl = $('code');
  const codeHtml = codeLines.map((line, i) => `<div class="code-line" data-line="${i+1}"><span class="no">${i+1}</span><span>${esc(line)}</span></div>`).join(''); codeEl.innerHTML = codeHtml;
  const steps = data.steps; let index = 0, timer = null;
  function renderVisual(v) {
    v = v || {kind:'tokens',label:'状态'}; let inner = '';
    if (v.kind === 'tokens') inner = `<div class="tokens">${(v.items||[]).map((x,i)=>`<div class="token ${i===v.pointer?'active':''}">${esc(x)}${i===v.pointer?'<span class="tag">当前</span>':''}</div>`).join('<span class="arrow">→</span>')}</div>`;
    else if (v.kind === 'list') inner = `<div class="list-row">${(v.items||[]).map((x,i)=>`<div class="node ${i===v.active?'active':''}">${esc(x)}</div>${i<v.items.length-1?'<span class="arrow">→</span>':''}`).join('')}</div><p class="step-body">slow = ${esc(v.pointers?.slow)} · fast = ${esc(v.pointers?.fast)}</p>`;
    else if (v.kind === 'stack') inner = `<div class="stack-vis">${(v.items||[]).map(x=>`<div class="stack-item">${esc(x)}</div>`).join('')}</div>`;
    else if (v.kind === 'grid') inner = `<div class="grid-vis">${(v.rows||[]).flat().map((x,i)=>`<div class="cell ${x==='●'||x==='✓'?'active':''}">${esc(x)}</div>`).join('')}</div>`;
    else if (v.kind === 'dp') inner = `<div class="dp-vis">${(v.rows||[]).flat().map((x,i)=>`<div class="dp-cell ${String(x).startsWith('当前')?'active':''}">${esc(x)}</div>`).join('')}</div>`;
    else if (v.kind === 'tree') inner = `<div class="tree-vis"><div class="tree-root">${esc(v.root)}</div><div class="tree-children"><div class="tree-child">${esc(v.children?.[0])}</div><div class="tree-child">${esc(v.children?.[1])}</div></div></div>`;
    else if (v.kind === 'path') inner = `<div class="tokens">${(v.items||[]).map(x=>`<div class="token">${esc(x)}</div>`).join('<span class="arrow">→</span>')}</div>`;
    return `<div class="visual-label">${esc(v.label||'状态')}</div>${inner}`;
  }
  function render() {
    const s = steps[index]; $('step-kind').textContent = s.kind; $('phase').textContent = s.phase; $('step-index').textContent = `${String(index+1).padStart(2,'0')} / ${steps.length}`; $('step-title').textContent = s.title; $('step-body').textContent = s.body; $('visual').innerHTML = renderVisual(s.visual); $('counter').textContent = `${index+1} / ${steps.length}`; $('slider').value = index; $('slider').max = steps.length-1; $('prev').disabled = index===0; $('next').disabled = index===steps.length-1; $('play').textContent = timer ? '⏸ 暂停' : '▶ 播放'; $('line-no').textContent = s.line;
    codeEl.querySelectorAll('.code-line').forEach(el => el.classList.toggle('active', Number(el.dataset.line)===s.line));
    const active = codeEl.querySelector('.active'); if (active) active.scrollIntoView({block:'nearest'});
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}render();}
  function next(){if(index<steps.length-1){index++;render();}else stop();}
  $('prev').onclick=()=>{stop();index=Math.max(0,index-1);render()}; $('next').onclick=()=>{stop();next()}; $('reset').onclick=()=>{stop();index=0;render()}; $('slider').oninput=e=>{stop();index=Number(e.target.value);render()}; $('play').onclick=()=>{if(timer){stop();return;}if(index===steps.length-1){index=0;}timer=setInterval(next,900);render()}; $('theme-toggle').onclick=()=>setTheme(themeMode==='auto'?'light':themeMode==='light'?'dark':'auto'); document.addEventListener('keydown',e=>{if(['INPUT','SELECT','BUTTON'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();stop();next()}if(e.key==='ArrowLeft'){e.preventDefault();stop();index=Math.max(0,index-1);render()}if(e.key===' '){e.preventDefault();$('play').click()}}); media.addEventListener('change',()=>{if(themeMode==='auto')setTheme('auto',false)}); setTheme(themeMode, false); render();
  window.__leetcodeAnimation = {data, audit:()=>({id:data.id, steps:steps.length, lineRange:steps.every(s=>s.line>=1&&s.line<=codeLines.length), expected:data.expected, finalStep:steps.at(-1)?.phase==='返回'})};
})();
