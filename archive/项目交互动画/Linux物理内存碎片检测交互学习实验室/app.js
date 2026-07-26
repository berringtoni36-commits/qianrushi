(function () {
  'use strict';

  const core = window.MemoryLabCore;
  const data = window.MemoryLabData;
  const root = document.getElementById('memory-lab');
  if (!core || !data || !root) throw new Error('Memory lab dependencies are missing');

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = 'linux-memory-fragmentation-learning-lab-v1';
  const sectionOrder = ['overview', 'buddy', 'hooks', 'metrics', 'terminal', 'challenge'];
  const modeHints = {
    guided: '按依赖顺序理解完整链路',
    free: '自由切换模块并修改所有参数',
    challenge: '隐藏依赖提示，直接完成排障与验收'
  };

  let state = loadState();
  state = core.reduceState(state, { type: 'COMPLETE', value: state.section });
  let flowTimer = null;
  let buddyState = core.createBuddyState(6);
  let selectedAllocation = null;
  let buddyTargetOrder = 2;
  let hookRoute = 'status';
  let hookNow = 0;
  let hookTriggerCount = 0;
  let throttleState = {};
  let countMap = {};
  let hookLog = ['选择路线并触发一次分配。'];
  let metricScenario = 0;
  let metricOrder = data.scenarios[0].targetOrder;
  let metricCounts = [...data.scenarios[0].nrFree];
  let terminalTicks = 0;
  const cliState = Object.fromEntries(data.cliOptions.map((option) => [option.key, option.value ?? false]));

  function loadState() {
    try { return core.restoreState(localStorage.getItem(STORAGE_KEY) || ''); }
    catch (_) { return core.createInitialState(); }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, core.serializeState(state)); } catch (_) { /* file privacy mode */ }
  }

  function announce(message) {
    $('#app-announcer').textContent = message;
  }

  function dispatch(action) {
    state = core.reduceState(state, action);
    saveState();
    renderShell();
  }

  function renderShell() {
    $$('.mode-button').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('#mode-hint').textContent = modeHints[state.mode];
    const completed = new Set(state.completed);
    completed.add(state.section);
    $('#learning-progress').value = Math.max(1, completed.size);
    $('#progress-label').textContent = `${Math.max(1, completed.size)} / 6`;

    $$('.section-tabs button').forEach((button) => {
      const active = button.dataset.section === state.section;
      button.setAttribute('aria-selected', String(active));
    });
    $$('.lab-panel').forEach((panel) => {
      const active = panel.dataset.panel === state.section;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    renderOverview();
  }

  function stopFlow() {
    if (flowTimer) window.clearTimeout(flowTimer);
    flowTimer = null;
    if (state.playing) {
      state = core.reduceState(state, { type: 'SET_PLAYING', value: false });
      saveState();
    }
  }

  function scheduleFlow() {
    if (flowTimer) window.clearTimeout(flowTimer);
    if (!state.playing) return;
    const duration = Math.round(1500 / state.speed);
    flowTimer = window.setTimeout(() => {
      if (!state.playing) return;
      if (state.step >= 7) state = core.reduceState(state, { type: 'SET_STEP', value: 0 });
      else state = core.reduceState(state, { type: 'NEXT_STEP' });
      saveState();
      renderOverview();
      scheduleFlow();
    }, duration);
  }

  function renderOverview() {
    $$('.route-button').forEach((button) => {
      const active = button.dataset.route === state.route;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const steps = data.pipelineRoutes[state.route];
    const pipeline = $('#pipeline');
    pipeline.innerHTML = '';
    steps.forEach((step, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${index < state.step ? 'is-past ' : ''}${index === state.step ? 'is-current' : ''}`.trim();
      button.setAttribute('aria-current', index === state.step ? 'step' : 'false');
      button.innerHTML = `<span class="node-number">${String(index + 1).padStart(2, '0')}</span><span class="node-label">${step.label}</span>`;
      button.addEventListener('click', () => {
        stopFlow();
        dispatch({ type: 'SET_STEP', value: index });
      });
      item.appendChild(button);
      pipeline.appendChild(item);
    });
    const step = steps[state.step];
    $('#stage-number').textContent = String(state.step + 1).padStart(2, '0');
    $('#stage-route').textContent = state.route === 'status' ? '状态巡检 · kprobe' : '事件统计 · tracepoint';
    $('#stage-title').textContent = step.label;
    $('#stage-short').textContent = step.short;
    $('#stage-detail').textContent = step.detail;
    $('#stage-data').textContent = step.data;
    $('#stage-source').textContent = step.source;
    $('#stage-code').textContent = step.code;
    $('#stage-boundary').textContent = step.boundary;
    $('#play-flow').textContent = state.playing ? '暂停链路' : '播放链路';
    $('#play-flow').setAttribute('aria-pressed', String(state.playing));
    $('#flow-speed').value = String(state.speed);
  }

  function summarizeTrace(trace) {
    if (!trace.length) return '没有状态变化。';
    return trace.map((item) => {
      if (item.type === 'take') return `取出 order-${item.order} 块 @PFN ${item.start}`;
      if (item.type === 'split') return `拆成两个 order-${item.order} 块，伙伴 @PFN ${item.buddyStart} 回到 freelist`;
      if (item.type === 'allocate') return `${item.id} 获得 ${item.pages} 个连续页`;
      if (item.type === 'free') return `释放 ${item.id} @PFN ${item.start}`;
      if (item.type === 'merge') return `与伙伴 @PFN ${item.buddyStart} 合并为 order-${item.order}`;
      return item.type;
    }).join(' → ');
  }

  function renderBuddy() {
    $('#buddy-order').value = String(buddyTargetOrder);
    $('#buddy-order-value').textContent = `${buddyTargetOrder} · ${2 ** buddyTargetOrder}页 · ${(2 ** buddyTargetOrder) * 4}KB`;
    const pages = core.pageMap(buddyState);
    const grid = $('#page-grid');
    grid.innerHTML = '';
    pages.forEach((page) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `page-cell ${page.type}`;
      if (page.allocationId === selectedAllocation) button.classList.add('selected');
      const isStart = page.type === 'used'
        ? buddyState.allocations[page.allocationId]?.start === page.pfn
        : page.start === page.pfn;
      if (isStart) {
        button.classList.add('block-start');
        button.dataset.block = page.type === 'used' ? page.allocationId : `o${page.order}`;
      }
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-label', `PFN ${page.pfn}：${page.label}`);
      if (page.type === 'used') {
        button.addEventListener('click', () => {
          selectedAllocation = page.allocationId;
          $('#buddy-message').textContent = `已选中 ${page.allocationId}；释放后只有空闲伙伴同阶且相邻时才会合并。`;
          renderBuddy();
        });
      } else button.disabled = true;
      grid.appendChild(button);
    });
    const freePages = pages.filter((page) => page.type === 'free').length;
    let largest = -1;
    for (let order = 0; order <= buddyState.maxOrder; order += 1) if (buddyState.freeBlocks[order].length) largest = order;
    const counts = core.buddyCounts(buddyState, buddyState.maxOrder + 1);
    const suitable = counts.reduce((sum, blocks, order) => sum + (order >= buddyTargetOrder ? blocks * (2 ** (order - buddyTargetOrder)) : 0), 0);
    $('#buddy-free-pages').textContent = String(freePages);
    $('#buddy-largest').textContent = largest >= 0 ? `order-${largest}` : '无';
    $('#buddy-suitable').textContent = String(suitable);
    $('#free-selected').disabled = !selectedAllocation;

    const freeLists = $('#free-lists');
    freeLists.innerHTML = '';
    for (let order = buddyState.maxOrder; order >= 0; order -= 1) {
      const row = document.createElement('div');
      row.className = 'free-list-row';
      const blocks = buddyState.freeBlocks[order];
      row.innerHTML = `<b>order ${order}</b><div class="block-tokens">${blocks.length ? blocks.map((start) => `<span class="block-token">PFN ${start}</span>`).join('') : '<span>—</span>'}</div>`;
      freeLists.appendChild(row);
    }
  }

  function makeFragmentedMemory() {
    let next = core.createBuddyState(6);
    const allocations = [];
    for (let index = 0; index < 64; index += 1) {
      const result = core.allocateBuddy(next, 0);
      if (result.error) break;
      next = result.state;
      allocations.push(result.allocation);
    }
    allocations.filter((allocation) => allocation.start % 2 === 0).forEach((allocation) => {
      next = core.freeBuddy(next, allocation.id).state;
    });
    buddyState = next;
    selectedAllocation = null;
    $('#buddy-message').textContent = '已交替释放偶数 PFN：共有 32 个空闲页，但最大块只有 order-0。尝试申请 order-2。';
    renderBuddy();
  }

  function hookDescription() {
    if (hookRoute === 'status') return {
      name: 'get_page_from_freelist', kind: 'kprobe 入口', program: 'fraginfo.c', maps: 'pgdat_map / zone_map',
      boundary: 'kprobe 看到的是分配前状态；内部函数签名不稳定，且当前时间节流 key 错误。'
    };
    return {
      name: 'mm_page_alloc_extfrag', kind: 'tracepoint 事件', program: 'extfraginfo.c', maps: 'counts_map',
      boundary: 'fallback_order 是找到的块阶，通常 ≥ alloc_order；当前源码没有采集迁移类型，也不是完整事件历史。'
    };
  }

  function renderHookHeader() {
    $$('.hook-route').forEach((button) => {
      const active = button.dataset.hook === hookRoute;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const description = hookDescription();
    $('#hook-name').textContent = description.name;
    $('#hook-kind').textContent = description.kind;
    $('#hook-program').textContent = description.program;
    $('#hook-maps').textContent = description.maps;
    $('#hook-boundary').textContent = `事实边界：${description.boundary}`;
    renderMaps();
  }

  function renderMaps(throttleResult) {
    const entries = [];
    const delay = Number($('#hook-delay').value || 500);
    entries.push(['delay_map[0]', `${delay} ms（用户态写 → eBPF 读）`]);
    entries.push(['last_time keys', Object.keys(throttleState).length ? Object.keys(throttleState).join(', ') : '∅']);
    if (hookRoute === 'status') {
      const scenario = data.scenarios[hookTriggerCount % data.scenarios.length];
      const metrics = core.calculateFragmentation(scenario.nrFree, scenario.targetOrder);
      entries.push(['pgdat_map[node0]', '{ node_id: 0, nr_zones: 1 }']);
      entries.push(['zone_map[Normal+2]', `{ free_pages: ${metrics.freePages}, suitable: ${metrics.freeBlocksSuitable}, score_a: ${metrics.extfrag}, score_b: ${metrics.unusable} }`]);
    } else {
      const records = Object.values(countMap).sort((a, b) => b.count - a.count);
      if (!records.length) entries.push(['counts_map', '∅']);
      records.forEach((record) => entries.push([`counts_map[${record.pid}]`, `{ ${record.pcomm}, pfn:${record.pfn}, ${record.allocOrder}→${record.fallbackOrder}, count:${record.count} }`]));
    }
    $('#map-entries').innerHTML = entries.map(([key, value]) => `<div class="map-entry"><b>${key}</b><span>${value}</span></div>`).join('');
    if (throttleResult) {
      const status = $('#throttle-result');
      status.textContent = throttleResult.allowed ? `允许采样 · key=${throttleResult.key}` : `窗口内跳过 · key=${throttleResult.key}`;
      status.className = `status-pill ${throttleResult.allowed ? 'allowed' : 'blocked'}`;
    }
    $('#hook-log').innerHTML = hookLog.slice(-10).map((line) => `<li>${line}</li>`).join('');
  }

  function triggerHook() {
    hookTriggerCount += 1;
    hookNow += 200;
    const delay = Number($('#hook-delay').value);
    const mode = $('#throttle-mode').value;
    const throttle = core.applyThrottle(throttleState, hookNow, delay, mode);
    throttleState = throttle.lastByKey;
    hookLog.push(`t=${hookNow}ms · lookup last_time_map[${throttle.key}] → ${throttle.previous == null ? 'MISS' : throttle.previous}`);
    if (throttle.allowed) {
      if (hookRoute === 'event') {
        const events = [
          { pid: 2184, pcomm: 'postgres', pfn: 48192, allocOrder: 2, fallbackOrder: 4 },
          { pid: 761, pcomm: 'kworker/0:2', pfn: 9280, allocOrder: 1, fallbackOrder: 3 },
          { pid: 2184, pcomm: 'postgres', pfn: 48208, allocOrder: 2, fallbackOrder: 5 }
        ];
        const event = events[(hookTriggerCount - 1) % events.length];
        countMap = core.recordCountEvent(countMap, event);
        hookLog.push(`tracepoint → PID ${event.pid} ${event.pcomm} · order ${event.allocOrder} 从 order ${event.fallbackOrder} 块拆分`);
        hookLog.push(`counts_map[${event.pid}] update`);
      } else {
        const scenario = data.scenarios[hookTriggerCount % data.scenarios.length];
        hookLog.push(`kprobe → ac.preferred_zoneref → node0/Normal`);
        hookLog.push(`扫描 order 0..10 → zone_map 更新为“${scenario.name}”快照`);
      }
    } else hookLog.push('采样窗口尚未到：本次不扫描 zone，也不更新结果 map');
    $('#hook-flow').classList.remove('is-triggered');
    void $('#hook-flow').offsetWidth;
    $('#hook-flow').classList.add('is-triggered');
    renderMaps(throttle);
  }

  function renderScenarioButtons() {
    $('#scenario-buttons').innerHTML = '';
    data.scenarios.forEach((scenario, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `scenario-button${index === metricScenario ? ' is-active' : ''}`;
      button.textContent = scenario.name;
      button.addEventListener('click', () => {
        metricScenario = index;
        metricOrder = scenario.targetOrder;
        metricCounts = [...scenario.nrFree];
        renderMetrics();
      });
      $('#scenario-buttons').appendChild(button);
    });
  }

  function formatScore(raw) {
    return `${raw < 0 ? '-' : ''}${(Math.abs(raw) / 1000).toFixed(3)}`;
  }

  function renderMetrics() {
    renderScenarioButtons();
    $('#target-order').value = String(metricOrder);
    $('#target-order-value').textContent = `${metricOrder} · 请求${2 ** metricOrder}页`;
    const tbody = $('#order-inputs');
    tbody.innerHTML = '';
    metricCounts.forEach((blocks, order) => {
      const row = document.createElement('tr');
      if (order >= metricOrder) row.classList.add('is-suitable');
      const targetBlocks = order >= metricOrder ? blocks * (2 ** (order - metricOrder)) : 0;
      row.innerHTML = `<td>order-${order}</td><td>${2 ** order} 页</td><td><input type="number" min="0" max="9999" value="${blocks}" aria-label="order ${order} 空闲块数量"></td><td>${blocks * (2 ** order)}</td><td>${targetBlocks}</td>`;
      row.querySelector('input').addEventListener('input', (event) => {
        metricScenario = -1;
        metricCounts[order] = Math.max(0, Math.trunc(Number(event.target.value) || 0));
        renderMetricResults();
        row.children[3].textContent = String(metricCounts[order] * (2 ** order));
        row.children[4].textContent = String(order >= metricOrder ? metricCounts[order] * (2 ** (order - metricOrder)) : 0);
      });
      tbody.appendChild(row);
    });
    renderMetricResults();
  }

  function renderMetricResults() {
    const result = core.calculateFragmentation(metricCounts, metricOrder);
    $('#metric-free-pages').textContent = String(result.freePages);
    $('#metric-total').textContent = String(result.freeBlocksTotal);
    $('#metric-suitable').textContent = String(result.freeBlocksSuitable);
    $('#metric-unusable').textContent = formatScore(result.unusable);
    $('#metric-extfrag').textContent = formatScore(result.extfrag);
    $('#unusable-raw').textContent = `源码整数 ${result.unusable}`;
    $('#extfrag-raw').textContent = `源码整数 ${result.extfrag}`;
    const unusableFormula = result.freePages === 0
      ? 'free_pages == 0 → unusable = 1000'
      : `unusable = floor((${result.freePages} - (${result.freeBlocksSuitable} << ${result.targetOrder})) × 1000 / ${result.freePages})\n         = ${result.unusable}`;
    let extfragFormula;
    if (result.freeBlocksTotal === 0) extfragFormula = 'free_blocks_total == 0 → extfrag = 0';
    else if (result.freeBlocksSuitable > 0) extfragFormula = 'free_blocks_suitable > 0 → extfrag = -1000';
    else extfragFormula = `requested = 1 << ${result.targetOrder} = ${result.requestedPages}\nextfrag = 1000 - floor((1000 + floor(${result.freePages} × 1000 / ${result.requestedPages})) / ${result.freeBlocksTotal})\n        = ${result.extfrag}`;
    $('#formula-trace').textContent = `free_pages = ${result.freePages}\nfree_blocks_total = ${result.freeBlocksTotal}\nfree_blocks_suitable = ${result.freeBlocksSuitable}\n\n${unusableFormula}\n\n${extfragFormula}`;
    let verdict;
    let explanation;
    if (result.freeBlocksSuitable > 0) {
      verdict = '仍有合适连续块';
      explanation = `目标 order-${result.targetOrder} 目前至少有 ${result.freeBlocksSuitable} 个折算块；unusable 仍可大于 0，因为部分小阶空闲页不能直接服务该请求。`;
    } else if (result.freePages < result.requestedPages || result.extfrag < 500) {
      verdict = '更接近总量不足';
      explanation = `没有 suitable block，且 extfrag=${formatScore(result.extfrag)} 较低；即使 compaction 也不能凭空增加空闲页。`;
    } else {
      verdict = '更接近外部碎片';
      explanation = `总空闲页不少却没有 suitable block，extfrag=${formatScore(result.extfrag)}；连续空间被小块状态打散。`;
    }
    $('#metric-verdict').textContent = verdict;
    $('#metric-explanation').textContent = explanation;
  }

  function createCliControls() {
    const host = $('#cli-controls');
    host.innerHTML = '';
    data.cliOptions.forEach((option) => {
      const row = document.createElement('div');
      row.className = 'cli-control';
      const label = document.createElement('label');
      label.htmlFor = `cli-${option.key}`;
      label.innerHTML = `${option.label}<code>${option.short}, ${option.long}</code>`;
      const input = document.createElement('input');
      input.id = `cli-${option.key}`;
      if (option.type === 'check') {
        input.type = 'checkbox';
        input.checked = Boolean(cliState[option.key]);
        input.addEventListener('change', () => { cliState[option.key] = input.checked; renderTerminal(); });
      } else {
        input.type = option.type;
        if (option.type === 'number') input.min = option.key === 'delay' ? '1' : '0';
        input.value = cliState[option.key];
        input.addEventListener('input', () => { cliState[option.key] = input.value; renderTerminal(); });
      }
      row.append(label, input);
      host.appendChild(row);
    });
  }

  function bar(value, width) {
    const length = Math.max(0, Math.min(width, Math.round(value * width)));
    return `${'█'.repeat(length)}${'░'.repeat(width - length)}`;
  }

  function renderTerminal() {
    const command = core.buildCommand(cliState);
    $('#command-preview').textContent = command;
    $('#terminal-clock').textContent = `t+${terminalTicks * Number(cliState.delay || 2)}s`;
    const scenario = data.scenarios[terminalTicks % data.scenarios.length];
    const metrics = core.calculateFragmentation(scenario.nrFree, scenario.targetOrder);
    let lines = [];
    if (cliState.count) {
      lines = [
        'PCOMM              PID        PFN   ALLOC_ORDER  FALLBACK_ORDER   COUNT',
        '────────────────────────────────────────────────────────────────────────',
        `postgres          2184      ${48192 + terminalTicks * 16}             2               4       ${3 + terminalTicks}`,
        `kworker/0:2        761       ${9280 + terminalTicks * 8}             1               3       ${1 + terminalTicks}`,
        '',
        '注意：每行是“最近字段 + PID累计次数”，不是完整事件历史。'
      ];
    } else if (cliState.nodeInfo) {
      lines = [
        'NODE_ID       PGDAT_PTR         NR_ZONES',
        '────────────────────────────────────────',
        '      0       0x00001000                1',
        '',
        '当前源码通过记录数 / 11 推导 NR_ZONES；这是待修复的硬编码假设。'
      ];
    } else if (cliState.view) {
      lines = [
        'Node 0 / Normal — unusable index by order',
        '────────────────────────────────────────',
        ...Array.from({ length: 8 }, (_, order) => {
          const value = Math.min(1, Math.max(0, (order + terminalTicks % 3) / 8));
          return `order ${order.toString().padStart(2)}  ${bar(value, 24)}  ${value.toFixed(3)}`;
        }),
        '',
        '教学回放：不是本机实时内存。'
      ];
    } else {
      const base = [
        'ZONE       ORDER   TOTAL   SUITABLE   FREE   NODE   EXTFRAG   UNUSABLE',
        '────────────────────────────────────────────────────────────────────────',
        `Normal         2      ${String(metrics.freeBlocksTotal).padStart(3)}         ${String(metrics.freeBlocksSuitable).padStart(3)}     ${String(metrics.freePages).padStart(4)}      0    ${formatScore(metrics.extfrag).padStart(7)}      ${formatScore(metrics.unusable).padStart(7)}`
      ];
      if (cliState.bar) base.push(`risk        ${bar(metrics.unusable / 1000, 28)}  ${formatScore(metrics.unusable)}`);
      if (cliState.zoneInfo) base.push('zone_pfn=4096  spanned_pages=262144  present_pages=258048');
      base.push('', `场景：${scenario.name} · refresh interval=${cliState.delay || 2}s`);
      lines = base;
    }
    $('#terminal-output').textContent = lines.join('\n');
  }

  function renderFaults() {
    const host = $('#fault-grid');
    host.innerHTML = '';
    data.faults.forEach((fault, index) => {
      const card = document.createElement('article');
      card.className = 'fault-card';
      card.innerHTML = `<button type="button" aria-expanded="false"><span>FAULT ${String(index + 1).padStart(2, '0')} · 先预测现象</span><b>${fault.title}</b></button><div class="fault-answer"><b>现象</b><p>${fault.symptom}</p><b>根因</b><p>${fault.cause}</p><b>修正</b><p>${fault.fix}</p><code>${fault.source}</code></div>`;
      const button = card.querySelector('button');
      button.addEventListener('click', () => {
        const open = !card.classList.contains('is-open');
        card.classList.toggle('is-open', open);
        button.setAttribute('aria-expanded', String(open));
      });
      host.appendChild(card);
    });
  }

  function renderQuiz() {
    const host = $('#quiz-list');
    host.innerHTML = '';
    data.quizzes.forEach((quiz, index) => {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'quiz-card';
      fieldset.innerHTML = `<legend><span class="topic-tag">${quiz.topic}</span>${index + 1}. ${quiz.prompt}</legend>`;
      quiz.options.forEach((option, optionIndex) => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = quiz.id;
        input.value = String(optionIndex);
        input.checked = state.answers[quiz.id] === optionIndex;
        input.addEventListener('change', () => {
          dispatch({ type: 'ANSWER', id: quiz.id, value: optionIndex });
          renderQuiz();
        });
        label.append(input, document.createTextNode(option));
        fieldset.appendChild(label);
      });
      if (Object.prototype.hasOwnProperty.call(state.answers, quiz.id)) {
        const correct = state.answers[quiz.id] === quiz.answer;
        const feedback = document.createElement('p');
        feedback.className = `quiz-feedback${correct ? '' : ' incorrect'}`;
        feedback.textContent = `${correct ? '正确。' : `未命中，正确答案：${quiz.options[quiz.answer]}。`} ${quiz.explanation}`;
        fieldset.appendChild(feedback);
      }
      host.appendChild(fieldset);
    });
    const score = core.scoreQuiz(state.answers, data.quizzes);
    $('#quiz-score').textContent = `${score.correct} / ${score.total}`;
    $('#quiz-progress').textContent = score.answered ? `已答 ${score.answered} 题 · ${score.percent}%` : '尚未作答';
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = '已复制';
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      button.textContent = '已复制';
    }
    window.setTimeout(() => { button.textContent = '复制口述提示'; }, 1600);
  }

  function bindEvents() {
    $$('.mode-button').forEach((button) => button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      stopFlow();
      state = core.reduceState(state, { type: 'SET_MODE', value: mode });
      if (mode === 'challenge') state = core.reduceState(state, { type: 'SET_SECTION', value: 'challenge' });
      state = core.reduceState(state, { type: 'COMPLETE', value: state.section });
      saveState();
      renderShell();
      renderQuiz();
    }));
    $$('.section-tabs button').forEach((button) => button.addEventListener('click', () => {
      stopFlow();
      state = core.reduceState(state, { type: 'SET_SECTION', value: button.dataset.section });
      state = core.reduceState(state, { type: 'COMPLETE', value: button.dataset.section });
      saveState();
      renderShell();
      announce(`进入${button.textContent.trim()}`);
    }));
    $$('.route-button').forEach((button) => button.addEventListener('click', () => {
      stopFlow();
      dispatch({ type: 'SET_ROUTE', value: button.dataset.route });
    }));
    $('#prev-step').addEventListener('click', () => { stopFlow(); dispatch({ type: 'PREV_STEP' }); });
    $('#next-step').addEventListener('click', () => { stopFlow(); dispatch({ type: 'NEXT_STEP' }); });
    $('#reset-flow').addEventListener('click', () => { stopFlow(); dispatch({ type: 'RESET_FLOW' }); });
    $('#play-flow').addEventListener('click', () => {
      const playing = !state.playing;
      state = core.reduceState(state, { type: 'SET_PLAYING', value: playing });
      saveState();
      renderOverview();
      if (playing) scheduleFlow(); else stopFlow();
    });
    $('#flow-speed').addEventListener('change', (event) => {
      state = core.reduceState(state, { type: 'SET_SPEED', value: event.target.value });
      saveState();
      renderOverview();
      if (state.playing) scheduleFlow();
    });

    $('#buddy-order').addEventListener('input', (event) => { buddyTargetOrder = Number(event.target.value); renderBuddy(); });
    $('#allocate-block').addEventListener('click', () => {
      const result = core.allocateBuddy(buddyState, buddyTargetOrder);
      buddyState = result.state;
      selectedAllocation = result.allocation ? result.allocation.id : null;
      $('#buddy-message').textContent = result.error || summarizeTrace(result.trace);
      renderBuddy();
    });
    $('#free-selected').addEventListener('click', () => {
      const result = core.freeBuddy(buddyState, selectedAllocation);
      buddyState = result.state;
      selectedAllocation = null;
      $('#buddy-message').textContent = result.error || summarizeTrace(result.trace);
      renderBuddy();
    });
    $('#fragment-memory').addEventListener('click', makeFragmentedMemory);
    $('#reset-buddy').addEventListener('click', () => {
      buddyState = core.createBuddyState(6); selectedAllocation = null;
      $('#buddy-message').textContent = '已恢复为一个 order-6 的完整 64 页块。'; renderBuddy();
    });

    $$('.hook-route').forEach((button) => button.addEventListener('click', () => {
      hookRoute = button.dataset.hook; hookLog = [`切换到 ${hookDescription().kind} 路线。`]; renderHookHeader();
    }));
    $('#trigger-hook').addEventListener('click', triggerHook);
    $('#throttle-mode').addEventListener('change', () => {
      throttleState = {}; hookNow = 0; hookLog.push('节流模型切换，last_time_map 已清空。'); renderMaps();
    });
    $('#hook-delay').addEventListener('input', (event) => { $('#hook-delay-value').textContent = `${event.target.value}ms`; renderMaps(); });

    $('#target-order').addEventListener('input', (event) => { metricScenario = -1; metricOrder = Number(event.target.value); renderMetrics(); });
    $('#refresh-terminal').addEventListener('click', () => { terminalTicks += 1; renderTerminal(); });
    $('#copy-oral').addEventListener('click', (event) => copyText('请闭卷用两分钟讲清 Linux 物理内存碎片检测项目：1.工具解决的痛点；2.伙伴系统/order/zone/node；3.Python与BCC加载链；4.kprobe和tracepoint分工；5.BPF map数据方向；6.两个指数的输入与区别；7.curses展示；8.当前源码的路径、节流、兼容和聚合边界。', event.currentTarget));
    $('#clear-progress').addEventListener('click', () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
      state = core.createInitialState();
      state = core.reduceState(state, { type: 'SET_SECTION', value: 'challenge' });
      saveState(); renderShell(); renderQuiz(); announce('学习记录已清空');
    });
  }

  function init() {
    createCliControls();
    renderFaults();
    bindEvents();
    renderShell();
    renderBuddy();
    renderHookHeader();
    renderMetrics();
    renderTerminal();
    renderQuiz();
  }

  init();
})();
