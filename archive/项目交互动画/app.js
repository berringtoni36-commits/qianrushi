(function () {
  'use strict';

  const core = window.VisionDemoCore;
  const data = window.VisionProjectData;
  if (!core || !data) {
    document.body.textContent = '学习实验室初始化失败：核心脚本未加载。';
    return;
  }

  const STORAGE_KEY = 'linux-vision-learning-lab-v1';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const pad = (value) => String(value).padStart(3, '0');

  let state = loadState();
  let flowTimer = null;
  let limeStageIndex = 0;
  let performanceIndex = 0;
  let events = [`进入 ${data.pipelineSteps[state.step].label}`];

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? core.restoreState(saved) : core.createInitialState();
    } catch (_) {
      return core.createInitialState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, core.serializeState(state));
    } catch (_) {
      // file:// environments may disable storage; the lab remains fully usable.
    }
  }

  function recordEvent(message) {
    if (!message || events[events.length - 1] === message) return;
    events.push(message);
    events = events.slice(-6);
  }

  function dispatch(action, eventMessage) {
    const previousStep = state.step;
    state = core.reduceState(state, action);
    if (state.step !== previousStep) recordEvent(`进入 ${data.pipelineSteps[state.step].label}`);
    if (eventMessage) recordEvent(eventMessage);
    saveState();
    renderAll();
  }

  function renderAll() {
    renderModes();
    renderSections();
    renderPipeline();
    renderSystemDetail();
    renderFrameViewer();
    renderEventLog();
    renderModelRoute();
    renderPerformance();
    renderQuiz();
  }

  function renderModes() {
    const hints = {
      guided: '跟随流水线逐站理解项目',
      free: '自由切换模块、路线和参数',
      challenge: '用费曼题与故障题寻找理解漏洞'
    };
    $$('.mode-button').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('#mode-hint').textContent = hints[state.mode];
    $('#learning-progress').value = state.step + 1;
    $('#progress-label').textContent = `${state.step + 1} / 8`;
  }

  function renderSections() {
    $$('.section-tabs button').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset.section === state.section));
    });
    $$('.lab-panel').forEach((panel) => {
      const active = panel.dataset.panel === state.section;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
  }

  function renderPipeline() {
    const pipeline = $('#pipeline');
    pipeline.replaceChildren();
    data.pipelineSteps.forEach((step, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pipeline-node';
      button.classList.toggle('is-active', index === state.step);
      button.classList.toggle('is-past', index < state.step);
      button.setAttribute('aria-current', index === state.step ? 'step' : 'false');
      button.innerHTML = `<span class="node-number">${String(index + 1).padStart(2, '0')}</span><span class="node-label">${step.label}</span><span class="node-data">${step.data}</span>`;
      button.addEventListener('click', () => {
        stopFlow();
        dispatch({ type: 'SET_STEP', value: index });
      });
      item.appendChild(button);
      pipeline.appendChild(item);
    });
  }

  function modelAwareStep(step) {
    if (state.model !== 'unet' || !['inference', 'postprocess'].includes(step.id)) return step;
    return {
      ...step,
      source: `${data.sourceRoot}/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp:60-121`,
      code: step.unetCode || step.code,
      data: step.id === 'inference' ? 'CHW 720×720 → NCNN mask' : '逐像素 argmax → 去 padding → mask'
    };
  }

  function renderSystemDetail() {
    const step = modelAwareStep(data.pipelineSteps[state.step]);
    $('#active-stage-number').textContent = String(state.step + 1).padStart(2, '0');
    $('#active-stage-title').textContent = step.label;
    $('#stage-short').textContent = step.short;
    $('#stage-detail').textContent = step.detail;
    $('#stage-data').textContent = step.data;
    $('#stage-source').textContent = step.source;
    $('#stage-code').textContent = step.code;
    $('#stage-risk').textContent = step.risk;
    $('#stage-model-badge').textContent = state.model === 'lstr' ? 'LSTR 路线' : 'Unet 路线';
    $('#play-flow').textContent = state.playing ? '暂停流水线' : '播放流水线';
    $('#play-flow').setAttribute('aria-pressed', String(state.playing));
    $('#flow-speed').value = String(state.speed);
    $('#toggle-lime').textContent = `LIME：${state.limeEnabled ? '启用' : '跳过'}`;
    $('#toggle-lime').classList.toggle('is-on', state.limeEnabled);
    $('#toggle-lime').setAttribute('aria-pressed', String(state.limeEnabled));
  }

  function renderFrameViewer() {
    const input = $('#input-frame');
    const result = $('#result-frame');
    const slider = $('#frame-slider');
    const isLstr = state.model === 'lstr';
    if (isLstr) {
      input.src = core.framePath(state.frame, 'input');
      result.src = core.framePath(state.frame, 'result');
      input.alt = `项目 LSTR 输入帧 ${state.frame}`;
      result.alt = `项目 LSTR 结果帧 ${state.frame}`;
      $('#input-frame-label').textContent = pad(state.frame);
      $('#result-frame-label').textContent = pad(state.frame);
      slider.disabled = false;
    } else {
      input.src = 'assets/unet/input.jpg';
      result.src = 'assets/unet/output.jpg';
      input.alt = '项目 Unet 输入示例';
      result.alt = '项目 Unet 分割结果示例';
      $('#input-frame-label').textContent = 'Unet';
      $('#result-frame-label').textContent = 'mask';
      slider.disabled = true;
    }
    slider.value = String(state.frame);
    $('#frame-output').textContent = isLstr ? `${state.frame} / 100` : '单图示例';
    $$('.route-button').forEach((button) => {
      const active = button.dataset.model === state.model;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function renderEventLog() {
    const log = $('#event-log');
    log.replaceChildren();
    events.forEach((message) => {
      const item = document.createElement('li');
      item.textContent = message;
      log.appendChild(item);
    });
  }

  function renderLimeStages() {
    const holder = $('#lime-stage-buttons');
    holder.replaceChildren();
    data.limeStages.forEach((stage, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `step-button${index === limeStageIndex ? ' is-active' : ''}`;
      button.textContent = stage.label;
      button.setAttribute('aria-pressed', String(index === limeStageIndex));
      button.addEventListener('click', () => {
        limeStageIndex = index;
        renderLimeStages();
      });
      holder.appendChild(button);
    });
    const active = data.limeStages[limeStageIndex];
    $('#lime-stage-key').textContent = active.label;
    $('#lime-stage-title').textContent = active.key === 'that' ? '初始光照图' : active.label;
    $('#lime-stage-text').textContent = active.text;
    $('#lime-stage-equation').textContent = active.equation;
  }

  function renderPixelLab() {
    const input = Number($('#pixel-input').value) / 100;
    const light = Number($('#pixel-light').value) / 100;
    const floor = Number($('#pixel-floor').value) / 100;
    const raw = input / Math.max(light, floor);
    const result = Math.min(1, raw);
    $('#pixel-input-value').textContent = input.toFixed(2);
    $('#pixel-light-value').textContent = light.toFixed(2);
    $('#pixel-floor-value').textContent = floor.toFixed(2);
    $('#pixel-result').textContent = result.toFixed(2);
    $('#pixel-warning').textContent = light < floor
      ? 'T 低于 ε，已启用安全护栏'
      : raw > 1
        ? '计算结果超过显示范围，已裁剪到 1.00'
        : '当前 T 高于 ε，直接使用估计光照';
  }

  function renderModelRoute() {
    const flow = $('#model-flow');
    flow.replaceChildren();
    data.modelFlows[state.model].forEach(([title, description]) => {
      const node = document.createElement('div');
      node.className = 'model-step';
      const strong = document.createElement('strong');
      const span = document.createElement('span');
      strong.textContent = title;
      span.textContent = description;
      node.append(strong, span);
      flow.appendChild(node);
    });
    if (state.model === 'lstr') {
      $('#model-input').src = core.framePath(state.frame, 'input');
      $('#model-output').src = core.framePath(state.frame, 'result');
      $('#model-input').alt = 'LSTR 输入道路图像';
      $('#model-output').alt = 'LSTR 曲线恢复与绘制结果';
      $('#model-input-caption').textContent = '输入：图像 + 全零 mask_tensor';
      $('#model-output-caption').textContent = '后处理：曲线与行驶区域';
    } else {
      $('#model-input').src = 'assets/unet/input.jpg';
      $('#model-output').src = 'assets/unet/output.jpg';
      $('#model-input').alt = 'Unet 输入道路图像';
      $('#model-output').alt = 'Unet 像素分割结果';
      $('#model-input-caption').textContent = '输入：补边并转为 CHW 720×720';
      $('#model-output-caption').textContent = '后处理：argmax 与去 padding';
    }
  }

  function renderPerformance() {
    const controls = $('#perf-preset-buttons');
    const chart = $('#performance-chart');
    controls.replaceChildren();
    chart.replaceChildren();
    const baseline = data.limePerformance[0].seconds;
    data.limePerformance.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `step-button${index === performanceIndex ? ' is-active' : ''}`;
      button.textContent = entry.label;
      button.setAttribute('aria-pressed', String(index === performanceIndex));
      button.addEventListener('click', () => {
        performanceIndex = index;
        renderPerformance();
      });
      controls.appendChild(button);

      const row = document.createElement('div');
      row.className = `perf-row${index === performanceIndex ? ' is-selected' : ''}`;
      const label = document.createElement('span');
      const track = document.createElement('div');
      const fill = document.createElement('div');
      const value = document.createElement('strong');
      label.textContent = entry.label;
      track.className = 'bar-track';
      fill.className = 'bar-fill';
      fill.style.width = `${Math.max(7, (entry.seconds / baseline) * 100)}%`;
      fill.setAttribute('aria-hidden', 'true');
      value.textContent = `${entry.seconds} s`;
      track.appendChild(fill);
      row.append(label, track, value);
      chart.appendChild(row);
    });

    const selected = data.limePerformance[performanceIndex];
    const metrics = core.calculateMetrics(baseline, selected.seconds);
    $('#metric-seconds').textContent = `${selected.seconds} s`;
    $('#metric-fps').textContent = `${metrics.fps.toFixed(2)} FPS`;
    $('#metric-speedup').textContent = `${metrics.speedup.toFixed(2)}×`;

    const laneCopy = [
      ['标量：一个像素接一个像素', '单个 CPU 核顺序处理，每次循环只完成一个 float 数据。'],
      ['函数重构：先减少无效工作', '预计算和重排让数据访问更连续，避免把优化只理解成“加线程”。'],
      ['NEON + OpenMP：每核四路，四核分区', 'NEON 在单核一次处理 4 个 float；OpenMP 再把独立区域分给多个 CPU 核。']
    ][performanceIndex];
    $('#lane-title').textContent = laneCopy[0];
    $('#lane-description').textContent = laneCopy[1];
    renderLaneDemo();
    renderMonitorChart();
  }

  function renderLaneDemo() {
    const lane = $('#lane-demo');
    lane.className = `lane-demo mode-${['baseline', 'fft', 'neon'][performanceIndex]}`;
    lane.replaceChildren();
    for (let index = 0; index < 64; index += 1) {
      const pixel = document.createElement('span');
      pixel.className = `lane-pixel core-${Math.floor(index / 16)}`;
      pixel.style.setProperty('--i', index);
      pixel.style.setProperty('--col', index % 16);
      pixel.setAttribute('aria-hidden', 'true');
      lane.appendChild(pixel);
    }
  }

  function renderMonitorChart() {
    const cpuBase = [86, 67, 43][performanceIndex];
    const memBase = [58, 54, 49][performanceIndex];
    const cpu = [];
    const mem = [];
    for (let index = 0; index < 51; index += 1) {
      const x = 42 + (538 * index) / 50;
      const cpuValue = Math.max(5, Math.min(98, cpuBase + Math.sin((index + state.frame) / 3.4) * 8 + Math.cos(index / 2.5) * 3));
      const memValue = Math.max(5, Math.min(95, memBase + Math.sin((index + 5) / 6.2) * 5));
      cpu.push(`${x.toFixed(1)},${(160 - cpuValue * 1.4).toFixed(1)}`);
      mem.push(`${x.toFixed(1)},${(160 - memValue * 1.4).toFixed(1)}`);
    }
    $('#cpu-line').setAttribute('points', cpu.join(' '));
    $('#mem-line').setAttribute('points', mem.join(' '));
  }

  function renderQuiz() {
    const list = $('#quiz-list');
    list.replaceChildren();
    data.quizzes.forEach((quiz, questionIndex) => {
      const card = document.createElement('fieldset');
      card.className = 'quiz-card';
      const legend = document.createElement('legend');
      legend.innerHTML = `<span class="topic-tag">${quiz.topic}</span>${questionIndex + 1}. ${quiz.prompt}`;
      card.appendChild(legend);
      quiz.options.forEach((option, optionIndex) => {
        const label = document.createElement('label');
        label.className = 'quiz-option';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = quiz.id;
        radio.value = String(optionIndex);
        radio.checked = state.answers[quiz.id] === optionIndex;
        radio.addEventListener('change', () => dispatch({ type: 'ANSWER', id: quiz.id, value: optionIndex }, `完成题目 ${questionIndex + 1}`));
        const span = document.createElement('span');
        span.textContent = option;
        label.append(radio, span);
        card.appendChild(label);
      });
      if (Object.prototype.hasOwnProperty.call(state.answers, quiz.id)) {
        const correct = state.answers[quiz.id] === quiz.answer;
        const feedback = document.createElement('p');
        feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
        feedback.textContent = `${correct ? '正确。' : `未命中。正确答案：${quiz.options[quiz.answer]}。`} ${quiz.explanation}`;
        card.appendChild(feedback);
      }
      list.appendChild(card);
    });
    const score = core.scoreQuiz(state.answers, data.quizzes);
    $('#quiz-score').textContent = `${score.correct} / ${score.total}`;
    $('#quiz-progress').textContent = score.answered ? `已答 ${score.answered} 题 · ${score.percent}%` : '尚未作答';
  }

  function stopFlow() {
    if (flowTimer) clearTimeout(flowTimer);
    flowTimer = null;
    if (state.playing) {
      state = core.reduceState(state, { type: 'SET_PLAYING', value: false });
      saveState();
    }
  }

  function scheduleFlow() {
    if (flowTimer) clearTimeout(flowTimer);
    if (!state.playing) return;
    flowTimer = setTimeout(() => {
      if (!state.playing) return;
      if (state.step >= core.MAX_STEP) {
        state = core.reduceState(state, { type: 'SET_STEP', value: 0 });
        state = core.reduceState(state, { type: 'NEXT_FRAME' });
        recordEvent(`下一组真实帧 ${pad(state.frame)}`);
      } else {
        state = core.reduceState(state, { type: 'NEXT_STEP' });
      }
      recordEvent(`进入 ${data.pipelineSteps[state.step].label}`);
      saveState();
      renderAll();
      scheduleFlow();
    }, 900 / state.speed);
  }

  function toggleFlow() {
    if (state.playing) {
      stopFlow();
      recordEvent('暂停流水线');
      renderAll();
      return;
    }
    state = core.reduceState(state, { type: 'SET_PLAYING', value: true });
    recordEvent('播放流水线');
    renderAll();
    scheduleFlow();
  }

  function bindEvents() {
    $$('.mode-button').forEach((button) => button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      state = core.reduceState(state, { type: 'SET_MODE', value: mode });
      if (mode === 'challenge') state = core.reduceState(state, { type: 'SET_SECTION', value: 'quiz' });
      if (mode === 'guided') state = core.reduceState(state, { type: 'SET_SECTION', value: 'system' });
      recordEvent(`切换到${button.textContent}`);
      saveState();
      renderAll();
    }));
    $$('.section-tabs button').forEach((button) => button.addEventListener('click', () => {
      dispatch({ type: 'SET_SECTION', value: button.dataset.section }, `打开${button.textContent}`);
    }));
    $('#prev-step').addEventListener('click', () => { stopFlow(); dispatch({ type: 'PREV_STEP' }); });
    $('#next-step').addEventListener('click', () => { stopFlow(); dispatch({ type: 'NEXT_STEP' }); });
    $('#reset-flow').addEventListener('click', () => { stopFlow(); dispatch({ type: 'RESET' }, '流水线复位'); });
    $('#play-flow').addEventListener('click', toggleFlow);
    $('#flow-speed').addEventListener('change', (event) => {
      const wasPlaying = state.playing;
      dispatch({ type: 'SET_SPEED', value: event.target.value }, `播放速度 ${event.target.value}×`);
      if (wasPlaying) scheduleFlow();
    });
    $('#frame-slider').addEventListener('input', (event) => dispatch({ type: 'SET_FRAME', value: event.target.value }));
    $('#toggle-lime').addEventListener('click', () => dispatch({ type: 'TOGGLE_LIME' }, state.limeEnabled ? '跳过 LIME' : '启用 LIME'));
    $$('.route-button').forEach((button) => button.addEventListener('click', () => dispatch({ type: 'SET_MODEL', value: button.dataset.model }, `切换到 ${button.dataset.model.toUpperCase()}`)));

    $('#compare-slider').addEventListener('input', (event) => {
      const value = `${event.target.value}%`;
      $('#lime-compare').style.setProperty('--reveal', value);
      $('#compare-output').textContent = value;
    });
    ['#pixel-input', '#pixel-light', '#pixel-floor'].forEach((selector) => $(selector).addEventListener('input', renderPixelLab));

    $('#copy-prompt').addEventListener('click', async (event) => {
      const prompt = '请闭卷用两分钟介绍 Linux 视觉感知项目：先说 FT2000/4 无 GPU 的约束，再说 Qt→帧文件→LIME→LSTR/Unet→Qt 显示与监控，接着解释 NEON/OpenMP 优化，最后给出 1.6305→0.314s、LSTR 0.182s、Unet 4.676s 的取舍。';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(prompt);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = prompt;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        }
        event.currentTarget.textContent = '已复制';
        setTimeout(() => { event.currentTarget.textContent = '复制练习提示'; }, 1200);
      } catch (_) {
        event.currentTarget.textContent = '复制失败，请手动记录';
      }
    });

    $('#clear-progress').addEventListener('click', () => {
      if (!window.confirm('确定清空本应用保存的答题与学习进度吗？')) return;
      stopFlow();
      state = core.createInitialState();
      events = ['学习记录已清空'];
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
      renderAll();
    });
  }

  bindEvents();
  renderLimeStages();
  renderPixelLab();
  renderAll();
})();

