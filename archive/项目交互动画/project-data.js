(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  root.VisionProjectData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const sourceRoot = 'projects/Linux视觉感知项目/Linux视觉感知处理系统源码';

  const pipelineSteps = [
    {
      id: 'qt-event',
      label: 'Qt 事件入口',
      short: '点击按钮，信号槽接管流程',
      detail: 'QApplication 的事件循环把按钮点击交给槽函数；Qt 在这里负责控制、展示和监控，而不是执行神经网络计算。',
      data: 'clicked() → on_Open_triggered() / yolop_process()',
      source: `${sourceRoot}/上位机程序/Lane_Detection/mainwindow.cpp:65-72,124-141`,
      code: 'timer->start(3);\nprocess2->write("./LSTR ../videos/frames/\\n");',
      risk: '把推理直接塞进 UI 主线程会阻塞事件循环，窗口表现为卡死。'
    },
    {
      id: 'capture',
      label: '采集与显示',
      short: '摄像头或 FFmpeg 产生图像帧',
      detail: '摄像头由 QTimer 周期触发 readFrame()；本地视频则由 FFmpeg 按 10 fps 拆成序列帧。原始画面先在 Qt 中显示。',
      data: 'cv::Mat / JPEG · 摄像头定时器 / FFmpeg 10 fps',
      source: `${sourceRoot}/上位机程序/Lane_Detection/mainwindow.cpp:88-120,152-166`,
      code: 'cap.read(src_image);\ncv::resize(src_image, re, cv::Size(320,240));',
      risk: '定时器间隔并不等于真实帧率，真实速度仍受摄像头、解码和 I/O 限制。'
    },
    {
      id: 'filesystem-in',
      label: '输入文件队列',
      short: '帧写入 frames 目录实现进程解耦',
      detail: 'Qt 与推理程序没有共享同一块内存，而是通过编号 JPEG 文件交换数据，开发调试简单，但会引入磁盘 I/O 和同步等待。',
      data: 'frames/1.jpg … frames/100.jpg',
      source: `${sourceRoot}/上位机程序/Lane_Detection/mainwindow.cpp:160-164`,
      code: 'imwrite(".../frames/" + to_string(count) + ".jpg", re);',
      risk: '生产者写入和消费者读取缺少明确协议时，可能读到未完成文件或积压大量帧。'
    },
    {
      id: 'lime',
      label: 'LIME 低照度增强',
      short: '估计光照图，再按光照补偿暗部',
      detail: '先以 RGB 最大通道估计初始光照图 T_hat，再通过 ADMM 交替更新 T/G/Z/u，最后执行通道除法得到增强图。正常光照可跳过。',
      data: 'I → T_hat → T/G/Z/u → R',
      source: `${sourceRoot}/图像预处理（加速前+加速后）/Lime/lime.cpp`,
      code: '_init_IllumMap(img);\noptIllumMap();\nenhance(img_out);',
      risk: 'T 接近 0 会放大噪声甚至导致数值爆炸，必须设置安全下限。'
    },
    {
      id: 'inference',
      label: '模型推理',
      short: 'LSTR 曲线检测或 Unet 像素分割',
      detail: 'LSTR 使用 ONNX Runtime 和双输入张量，直接预测车道存在性与曲线参数；Unet 使用 NCNN 输出逐像素类别。',
      data: 'LSTR [1,3,H,W]+[1,1,H,W] / Unet CHW 720×720',
      source: `${sourceRoot}/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp:109-168`,
      code: 'ort_session->Run(...);\npred_logits = outputs[0];\npred_curves = outputs[1];',
      unetCode: 'ex.input("in0", in);\nex.extract("out0", mask);',
      risk: 'OpenCV 通常是 HWC，模型输入是 CHW；布局转换错误会让结果完全失真。'
    },
    {
      id: 'postprocess',
      label: '结果后处理',
      short: '把模型数值输出恢复为可见车道线',
      detail: 'LSTR 先用 pred_logits 筛有效车道，再结合 pred_curves 与 log_space 还原曲线点；Unet 对各类别通道做 argmax 并去掉 padding。',
      data: '曲线点 / 像素类别 mask → 可视化叠加',
      source: `${sourceRoot}/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp:131-168`,
      code: 'if (max_id == 1) { /* restore lane points */ }',
      unetCode: 'data[i*INPUT_WIDTH + j] = maxk; // argmax',
      risk: '绿色车道区域是后处理绘制结果，不是 LSTR 网络直接输出的绿色 mask。'
    },
    {
      id: 'filesystem-out',
      label: '结果文件队列',
      short: '推理结果写入 result 目录',
      detail: '推理进程保存编号结果，Qt 顺序读取并显示。文件系统使进程隔离，但 waitKey 和轮询会拉高端到端延迟。',
      data: 'result/1.jpg … result/100.jpg',
      source: `${sourceRoot}/上位机程序/Lane_Detection/mainwindow.cpp:124-139`,
      code: 'Mat r = imread(".../LSTR/result/" + to_string(i) + ".jpg");',
      risk: '固定等待 10 秒不能保证所有硬件都完成推理，应使用完成信号、文件原子改名或消息队列。'
    },
    {
      id: 'qt-monitor',
      label: 'Qt 显示与监控',
      short: '显示结果并刷新 CPU/内存曲线',
      detail: '结果 Mat 转成 QImage 后呈现在界面；另一个 QTimer 每秒读取 CPU 和内存数据，维护最多 51 个点的滑动窗口。',
      data: 'QImage + CPU% + MEM% · 1 Hz',
      source: `${sourceRoot}/上位机程序/Lane_Detection/mainwindow.cpp:134-138,291-345`,
      code: 'receivedData_cpu(cpuLoadAverage);\nreceivedDate_mem(mem_used);',
      risk: '监控采样和耗时工作都应避免阻塞 UI 线程；图表也不应无限积累数据点。'
    }
  ];

  const limeStages = [
    { key: 'that', label: 'T_hat', text: '取每个像素 RGB 三通道最大值，得到粗糙的初始光照图。', equation: 'T_hat(x) = max(R, G, B)' },
    { key: 'weight', label: '权重', text: '由光照图梯度构造平滑权重：边缘处少平滑，平坦处多平滑。', equation: 'W ← gradient(T_hat)' },
    { key: 't', label: 'T', text: 'solveT() 更新精细光照图，兼顾接近 T_hat 与空间平滑。', equation: 'T ← solveT(G, Z, u)' },
    { key: 'g', label: 'G', text: 'solveG() 更新梯度辅助变量，把不可直接求解的问题拆开。', equation: 'G ← solveG(T, Z, u)' },
    { key: 'zu', label: 'Z / u', text: 'solveZ() 与 solveU() 更新约束变量和拉格朗日乘子，推动迭代收敛。', equation: 'Z,u ← ADMM update' },
    { key: 'enhance', label: '增强', text: '将 T 约束到安全范围后逐通道相除，暗部提升更明显。', equation: 'R(x) = I(x) / max(T(x), ε)' }
  ];

  const modelFlows = {
    lstr: [
      ['Resize + normalize', 'OpenCV 图像转 CHW float'],
      ['双输入', 'image [1,3,H,W] + 全零 mask [1,1,H,W]'],
      ['ONNX Runtime', '一次 Run() 得到两个输出'],
      ['pred_logits', '筛选存在的车道候选'],
      ['pred_curves', '结合 50 个 log_space 采样点恢复曲线'],
      ['绘制结果', '曲线和绿色行驶区域由后处理生成']
    ],
    unet: [
      ['等比例补边', '保持原图宽高比'],
      ['Resize', '统一到 720×720'],
      ['HWC → CHW', '匹配 NCNN 的通道布局'],
      ['NCNN', '4 线程 Extractor 输出 mask'],
      ['逐像素 argmax', '从类别通道选择最大概率'],
      ['去 padding', '清零补边区域后显示绿色分割']
    ]
  };

  const limePerformance = [
    { id: 'baseline', label: '原始 LIME', seconds: 1.6305, note: 'OpenCV 标量流程' },
    { id: 'fft', label: '傅里叶重构', seconds: 1.031, note: '减少冗余并预计算' },
    { id: 'neon', label: 'NEON + OpenMP', seconds: 0.314, note: 'SIMD 与四核并行' }
  ];

  const modelPerformance = {
    lstr: { baseline: 1.953, optimized: 0.182, runtime: 'ONNX Runtime', output: '参数化曲线' },
    unet: { baseline: 17.386, optimized: 4.676, runtime: 'NCNN', output: '像素级 mask' }
  };

  const quizzes = [
    {
      id: 'q-system-role', topic: '系统', prompt: 'Qt 在这个项目中的准确定位是什么？',
      options: ['负责训练神经网络', '控制、展示、监控与外部进程调度', '只负责读取摄像头'], answer: 1,
      explanation: 'Qt 是系统总控和界面层，重算法由独立程序执行。'
    },
    {
      id: 'q-system-fs', topic: '系统', prompt: '为什么项目使用 frames/result 目录交换图像？',
      options: ['提高内存带宽', '让所有模块运行在同一线程', '降低模块耦合并便于调试复现'], answer: 2,
      explanation: '文件系统方案简单、隔离且自然持久化，代价是 I/O 和同步延迟。'
    },
    {
      id: 'q-lime-t', topic: 'LIME', prompt: 'LIME 中为什么不能直接用很小的 T 做通道除法？',
      options: ['会放大噪声并造成数值爆炸', '会把 HWC 变成 CHW', '会让 QTimer 停止'], answer: 0,
      explanation: 'R=I/T，T 越接近 0，放大越失控，因此需要 ε 或归一化下限。'
    },
    {
      id: 'q-neon-openmp', topic: 'LIME', prompt: 'NEON 与 OpenMP 的核心区别是什么？',
      options: ['NEON 管文件，OpenMP 管模型', 'NEON 单核 SIMD，OpenMP 多核线程并行', '两者都是 GPU API'], answer: 1,
      explanation: 'NEON 是寄存器级单指令多数据；OpenMP 将工作分配给多个 CPU 核。'
    },
    {
      id: 'q-model-layout', topic: '模型', prompt: 'Unet 部署前为什么要做 HWC→CHW？',
      options: ['NCNN 输入按通道连续存放', '为了把图片转为 JPEG', '为了生成 log_space'], answer: 0,
      explanation: 'OpenCV 的像素通道交错，而网络张量通常要求每个通道为连续平面。'
    },
    {
      id: 'q-model-output', topic: '模型', prompt: 'LSTR 网络直接输出的是什么？',
      options: ['绿色车道区域', 'pred_logits 与 pred_curves', '完整语义分割 mask'], answer: 1,
      explanation: '绿色区域由后处理根据筛选并恢复出的曲线绘制。'
    },
    {
      id: 'q-fault-ui', topic: '故障', prompt: '把完整推理直接放进 Qt UI 线程，最可能出现什么？',
      options: ['界面失去响应', '模型自动量化', '文件系统变成共享内存'], answer: 0,
      explanation: '耗时工作阻塞事件循环，按钮、绘制和窗口消息无法及时处理。'
    },
    {
      id: 'q-fault-wait', topic: '故障', prompt: '固定 waitKey(10000) 用于同步推理的主要问题是什么？',
      options: ['永远只等待 10 毫秒', '无法适应不同负载，可能过早或白等', '会改变模型权重'], answer: 1,
      explanation: '固定等待不是完成协议，应改为进程完成信号或可靠的生产者—消费者通知。'
    }
  ];

  return {
    sourceRoot,
    pipelineSteps,
    limeStages,
    modelFlows,
    limePerformance,
    modelPerformance,
    quizzes
  };
});

