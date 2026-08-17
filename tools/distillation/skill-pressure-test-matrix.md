# Skill 压力测试矩阵

## 统一门槛

- 每个 Skill：3 条应触发、2 条诱饵、1 条边界，共 6 条。
- 诱饵至少一条指向规范源中的兄弟 Skill。
- 静态路由结果：56/56 个 Skill 达到 6/6 结构门槛。
- 真实客户端新会话盲测：尚未完成；静态通过不等于实际触发率 100%。

| Skill | 域 | 正例 | 诱饵 | 边界 | 静态结果 | 客户端同步 |
|---|---|---:|---:|---:|---:|---|
| `embedded-interview-layered-answer` | embedded-core | 3 | 2 | 1 | 6/6 | 已有副本 |
| `embedded-bus-selection` | embedded-core | 3 | 2 | 1 | 6/6 | 已有副本 |
| `embedded-arm-linux-boot-chain` | embedded-core | 3 | 2 | 1 | 6/6 | 已有副本 |
| `embedded-memory-lifetime-and-pool-design` | embedded-core | 3 | 2 | 1 | 6/6 | 本轮新增已同步 |
| `embedded-cpp-resource-lifetime` | embedded-core | 3 | 2 | 1 | 6/6 | 本轮新增已同步 |
| `stm32-clock-and-sampling-timing` | embedded-core | 3 | 2 | 1 | 6/6 | 本轮新增已同步 |
| `linux-driver-device-tree-boundary` | embedded-core | 3 | 2 | 1 | 6/6 | 本轮新增已同步 |
| `embedded-c-storage-linkage-audit` | embedded-core | 3 | 2 | 1 | 6/6 | 本次新增已同步 |
| `linux-tcp-loss-path-diagnosis` | embedded-core | 3 | 2 | 1 | 6/6 | 本次新增已同步 |
| `linux-thread-sync-deadlock-diagnosis` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-process-signal-daemon-lifecycle` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-virtual-memory-reclaim-path` | embedded-core | 3 | 2 | 1 | 6/6 | 已同步 |
| `rtos-task-and-isr-design` | rtos-project | 3 | 2 | 1 | 6/6 | 已有副本 |
| `rtos-communication-debugging` | rtos-project | 3 | 2 | 1 | 6/6 | 已有副本 |
| `rtos-motor-pid-control` | rtos-project | 3 | 2 | 1 | 6/6 | 已有副本 |
| `rtos-project-storytelling` | rtos-project | 3 | 2 | 1 | 6/6 | 已有副本 |
| `rtos-freertos-config-and-boot` | rtos-project | 3 | 2 | 1 | 6/6 | 新增已同步 |
| `rtos-runtime-fault-diagnosis` | rtos-project | 3 | 2 | 1 | 6/6 | 新增已同步 |
| `rtos-iap-firmware-upgrade` | rtos-project | 3 | 2 | 1 | 6/6 | 新增已同步 |
| `rtos-sensor-acquisition-and-fusion` | rtos-project | 3 | 2 | 1 | 6/6 | 新增已同步 |
| `rtos-key-event-state-machine` | rtos-project | 3 | 2 | 1 | 6/6 | 新增已同步 |
| `rtos-auto-mode-state-machine` | rtos-project | 3 | 2 | 1 | 6/6 | 新增已同步 |
| `rtos-display-buzzer-feedback` | rtos-project | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-memory-ebpf-pipeline` | linux-memory-ebpf | 3 | 2 | 1 | 6/6 | 已有副本 |
| `linux-buddy-fragmentation-diagnosis` | linux-memory-ebpf | 3 | 2 | 1 | 6/6 | 已有副本 |
| `linux-memory-source-audit` | linux-memory-ebpf | 3 | 2 | 1 | 6/6 | 已有副本 |
| `linux-vision-pipeline-and-optimization` | linux-vision | 3 | 2 | 1 | 6/6 | 已有副本 |
| `linux-vision-project-storytelling` | linux-vision | 3 | 2 | 1 | 6/6 | 已有副本 |
| `vision-model-tensor-contract-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-vision-file-ipc-lifecycle-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-vision-build-provenance-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-build-debug-chain` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-fd-process-io-debugging` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-socket-multiplexing-design` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `rtos-software-timer-periodic-design` | rtos-project | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-udp-datagram-endpoint-routing` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-udp-broadcast-reachability-contract` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-udp-multicast-interface-membership-contract` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-file-persistence-crash-consistency` | embedded-core | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-userspace-timer-drift-audit` | embedded-core | 3 | 2 | 1 | 6/6 | 已同步 |
| `embedded-c-struct-binary-contract-audit` | embedded-core | 3 | 2 | 1 | 6/6 | 已同步 |
| `rtos-build-flash-runtime-provenance` | rtos-project | 3 | 2 | 1 | 6/6 | 本轮新增 |
| `algorithm-problem-framework-selection` | leetcode-algorithm-learning | 3 | 2 | 1 | 6/6 | 已同步 |
| `algorithm-state-and-invariant-derivation` | leetcode-algorithm-learning | 3 | 2 | 1 | 6/6 | 已同步 |
| `algorithm-active-recall-loop` | leetcode-algorithm-learning | 3 | 2 | 1 | 6/6 | 已同步 |
| `interactive-lab-fact-boundary-audit` | interactive-learning-labs | 3 | 2 | 1 | 6/6 | 已同步 |
| `vault-source-boundary-and-derived-artifact-audit` | vault-methodology-and-tools | 3 | 2 | 1 | 6/6 | 已同步 |
| `linux-rx-napi-path-diagnosis` | linux-systems-tutorial | 3 | 2 | 1 | 6/6 | 静态完成；不声称真实客户端命中 |
| `qt-event-loop-signal-slot-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已同步 |
| `cmake-source-discovery-incremental-build-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已同步 |
| `embedded-learning-state-and-active-recall` | workbench-learning-state | 3 | 2 | 1 | 6/6 | 已同步 |
| `embedded-numeric-contract-audit` | embedded-core | 3 | 2 | 1 | 6/6 | 已安全同步 |
| `linux-memory-fastpath-observation-contract` | linux-memory-ebpf | 3 | 2 | 1 | 6/6 | 已安全同步 |
| `linux-ebpf-map-counter-contract` | linux-memory-ebpf | 3 | 2 | 1 | 6/6 | 已安全同步 |
| `linux-vision-qt-image-buffer-adapter-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已安全同步 |
| `linux-vision-resource-telemetry-contract-audit` | linux-vision | 3 | 2 | 1 | 6/6 | 已安全同步 |

## 跨 Skill 混淆覆盖

| 用户表达 | 应优先命中 | 不能误命中 |
|---|---|---|
| “FreeRTOS 任务卡死，DMA 完成但任务没醒” | `rtos-communication-debugging` | Linux 构建、Socket、Linux 进程 fd |
| “FreeRTOS 启动后任务不跑，SysTick/PendSV 怎么查” | `rtos-freertos-config-and-boot` | 通信事件链、项目复盘 |
| “STM32 偶发 HardFault/栈溢出” | `rtos-runtime-fault-diagnosis` | 纯启动概念解释 |
| “IAP CRC 通过但 APP 不启动” | `rtos-iap-firmware-upgrade` | 纯 CRC 数学定义 |
| “epoll 可读但 TCP 半包” | `linux-socket-multiplexing-design` | Linux 构建、fd/管道生命周期 |
| “编译通过但找不到 `.so`” | `linux-build-debug-chain` | ARM Linux 启动链、Socket |
| “动画 extfrag 数字真实吗” | `interactive-lab-fact-boundary-audit` | 伙伴系统诊断本身 |
| “项目文档和源码不一致” | `linux-memory-source-audit` 或对应项目审计 | 普通项目介绍 |
| “我看过题解但不会写” | `algorithm-active-recall-loop` | 初始题型选择 |
| “malloc 失败但剩余内存不少” | `embedded-memory-lifetime-and-pool-design` | Linux 伙伴系统诊断、C++ RAII |
| “vector 扩容后 DMA 指针失效” | `embedded-cpp-resource-lifetime` | C 内存池、STM32 时钟 |
| “MQ2 ADC 读数异常/定时器频率差一倍” | `stm32-clock-and-sampling-timing` | 传感器融合、PID 调参 |
| “compatible 匹配了但 probe 没进” | `linux-driver-device-tree-boundary` | ARM Linux 启动链、Linux 构建链 |
| “extern 后链接失败、Map 显示 RAM 超限” | `embedded-c-storage-linkage-audit` | C++ 生命周期、单纯内存池策略 |
| “TCP ACK 了但业务没收到、accept 队列满” | `linux-tcp-loss-path-diagnosis` | TCP 半包/framing、通用 fd/IPC |
| “子进程变僵尸、SIGTERM 不退出、守护进程标准输出异常” | `linux-process-signal-daemon-lifecycle` | pthread 锁/线程池关闭、TCP framing |
| “线程池 shutdown 后 worker 还在访问已 free 的队列” | `linux-thread-sync-deadlock-diagnosis` | 进程信号/守护化、Socket 多路复用 |
| “malloc 首次触摸缺页、kswapd/direct reclaim 抖动” | `linux-virtual-memory-reclaim-path` | 高阶 buddy 碎片、RTOS 内存池 |
| “LSTR 两个输入的 shape/dtype 和 Qt 摄像头主链是否匹配” | `vision-model-tensor-contract-audit` | 全局 ARM 优化、项目面试表达 |
| “摄像头帧写入了但 LSTR 读不到、QProcess 退出后 UI 还在轮询” | `linux-vision-file-ipc-lifecycle-audit` | Tensor 契约、普通 fd 生命周期 |
| “优化版二进制到底由哪个 CMake target 编出来，5.19x 能否复现” | `linux-vision-build-provenance-audit` | 通用编译语法、Tensor shape |
| “UDP 收到请求但回包到错端口” | `linux-udp-datagram-endpoint-routing` | 广播、组播、TCP framing |
| “UDP 广播 Permission denied 或跨 VLAN 不可达” | `linux-udp-broadcast-reachability-contract` | 普通 UDP 回包、组播入组 |
| “UDP 组播加入错误网卡，IP_ADD_MEMBERSHIP 后仍收不到” | `linux-udp-multicast-interface-membership-contract` | 广播权限、普通 UDP 端点 |
| “write 成功后 kill -9/掉电，配置文件出现半文件” | `linux-file-persistence-crash-consistency` | fd 关闭、虚拟内存回收 |
| “sleep 周期任务越跑越慢，timerfd 有 overrun” | `linux-userspace-timer-drift-audit` | FreeRTOS 软件定时器、STM32 APB 时序 |
| “packed struct 映射 CAN/DMA/寄存器，sizeof 和端序不对” | `embedded-c-struct-binary-contract-audit` | C 存储/链接、总线选型 |
| “CMake 目录里有源文件但 target 没编，两个 lime 同名且 build 指向旧路径，运行时又加载错库” | `cmake-source-discovery-incremental-build-audit` | 通用编译/链接/GDB、视觉性能 provenance、Tensor shape |
| “get_page_from_freelist 入口触发很多次，能不能当成每个分配请求，怎么判断最终成功” | `linux-memory-fastpath-observation-contract` | eBPF 加载链、buddy 指标语义、通用源码审计 |
| “counts_map 按 PID 做 count++，多 CPU 下能不能说是精确事件数，应该换 per-CPU 还是 ring buffer” | `linux-ebpf-map-counter-contract` | eBPF 运行链、buddy 指标含义、普通 Map 定义 |
| “MatImageToQt 灰度全黑、BGR 红蓝反、ROI 行错位，Mat 复用后 QPixmap 花屏” | `linux-vision-qt-image-buffer-adapter-audit` | Tensor shape、Qt 事件循环/QProcess、文件 IPC |
| “CPU 曲线第一点异常、free -m 第六列是什么、51 点能不能说是 51 秒实时性能” | `linux-vision-resource-telemetry-contract-audit` | Qt 信号槽生命周期、视觉端到端 benchmark、构建 provenance |
| “把结果变量改成 REAL 还是报警不触发，如何查原始位、整数中间溢出、缩放、滤波和阈值回差” | `embedded-numeric-contract-audit` | IEEE 754 单点定义、struct/DMA 布局、ADC 采样时序、传感器标定、PID 调参 |
