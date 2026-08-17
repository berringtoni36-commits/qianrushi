# Test Results — linux-vision-qt-image-buffer-adapter-audit

- 日期：2026-08-14
- 方法：静态路由与结构自检；3 条应触发、2 条兄弟 Skill 诱饵、1 条通用 Qt 边界。
- 结果：6/6（100%）。
- 覆盖：`CV_8UC1/3/4` 格式分派、BGR/RGB、`src.step`/`bytesPerLine`、`memcmp` 灰度缺陷、外部缓冲所有权、`rgbSwapped()`/`copy()`、`cameraView`/`resultView` 消费者映射。
- 边界：正例要求输出“文档声称—源码事实—待验证”分层；诱饵分别转交 `vision-model-tensor-contract-audit` 与 `qt-event-loop-signal-slot-audit`；通用 Qt API 例不触发项目审计。
- 真实性：仅完成静态 6/6；未运行目标 Qt/OpenCV、摄像头、模型或真实客户端，未把静态结果写成运行命中或性能结论。
