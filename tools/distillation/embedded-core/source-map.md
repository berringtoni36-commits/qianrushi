# 嵌入式核心来源映射

| 结论/Skill | 文档来源 | 代码/符号核对与事实边界 |
|---|---|---|
| 分层回答 / `embedded-interview-layered-answer` | `projects/嵌入式八股/1. 项目八股/RTOS高频面试题.md`；`projects/嵌入式八股/1. 项目八股/linux视觉感知面试题.md`；`projects/嵌入式八股/嵌入式高频八股150题.md` | 以项目复习文档中的函数表和面试问答核对；不把通用知识冒充个人贡献 |
| 总线选择 / `embedded-bus-selection` | `projects/嵌入式八股/3. 杂七杂八/1.【图解】5种总线协议：UART、RS232、RS485、I²C、SPI.md`；`projects/嵌入式八股/3. 杂七杂八/2. 从 0 和 1 一步步推导 MCU 通信- 吃透 UART-SPI-I²C-CAN 底层原理.md`；`projects/嵌入式八股/糯叽叽八股/08 通讯协议.md` | RTOS 源码 `projects/RTOS项目/源码/SYSTEM/usart/usart.c`、`projects/RTOS项目/源码/BSP/DMA/dma.c`、`projects/RTOS项目/源码/STM32F10x_FWLib/src/stm32f10x_spi.c`、`stm32f10x_i2c.c`；协议、电平和收发器分层 |
| ARM Linux 启动链 / `embedded-arm-linux-boot-chain` | `projects/嵌入式八股/3. 杂七杂八/5. 嵌入式 ARM Linux 系统架构全解：一文讲透硬件、U-Boot、内核、驱动与应用.md`；`projects/嵌入式八股/糯叽叽八股/11 Bootloader与Rootfs.md` | 以教程、启动配置和启动证据为主；本仓库无对应完整 ARM Linux 启动源码 |
| 内存生命周期与内存池 / `embedded-memory-lifetime-and-pool-design` | `projects/嵌入式八股/糯叽叽八股/01 C语言.md`；`projects/嵌入式八股/糯叽叽八股/02 C++.md`；`projects/嵌入式八股/糯叽叽八股/07 FreeRTOS.md`；`projects/嵌入式八股/3. 杂七杂八/7. 嵌入式系统开发，必知的10个内存管理策略.md` | `projects/RTOS项目/源码/FreeRTOS/include/FreeRTOSConfig.h`、`portable/MemMang/heap_4.c`、`APP_TASK/app_tasks.c`；有动态堆配置和 `xTaskCreate` 证据，没有自定义内存池及长期压力测试证据 |
| C++ 资源生命周期 / `embedded-cpp-resource-lifetime` | `projects/嵌入式八股/糯叽叽八股/01 C语言.md`；`projects/嵌入式八股/糯叽叽八股/02 C++.md`；`projects/嵌入式八股/糯叽叽八股/03 STL与容器.md` | `RAII`、构造/析构、拷贝/移动、`unique_ptr/shared_ptr/weak_ptr`、`vector`/迭代器；来源是教程/八股，没有完整 C++ 固件项目源码 |
| STM32 时钟与采样 / `stm32-clock-and-sampling-timing` | `projects/嵌入式八股/3. 杂七杂八/9. 嵌入式 STM32 时钟体系全解：从硬件底层到量产实战.md`；`projects/嵌入式八股/3. 杂七杂八/11. 图解 ADC：工作原理、架构分类与核心性能指标.md`；`projects/RTOS项目/文档/4 硬件驱动开发/4.2 传感器与采集/4.2.2 MQ2 气体传感器：ADC采集与数据处理.md` | `system_stm32f10x.c`: `SYSCLK_FREQ_72MHz/SystemCoreClock/SystemInit`；`mq2.c`: `RCC_ADCCLKConfig`、`ADC1_CH4/PA4`、`ADC_SampleTime_239Cycles5`、10 次平均；`delay.c`: `delay_init/SysTick_Handler`；配置不等于实测 |
| Linux 驱动与设备树 / `linux-driver-device-tree-boundary` | `projects/嵌入式八股/糯叽叽八股/10 嵌入式Linux驱动.md`；`projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md`；`projects/嵌入式八股/3. 杂七杂八/5. 嵌入式 ARM Linux 系统架构全解：一文讲透硬件、U-Boot、内核、驱动与应用.md` | 教程示例符号 `compatible`、`platform_driver`、`probe`、`devm_platform_ioremap_resource`、`file_operations`、`request_irq/free_irq`；仓库没有对应完整 Linux 驱动源码，不能说用户已实现 |
| C 存储期/链接/镜像审计 / `embedded-c-storage-linkage-audit` | `projects/嵌入式八股/糯叽叽八股/01 C语言.md`；`projects/嵌入式八股/糯叽叽八股/04 操作系统.md` | `startup_stm32f10x_md.s`: `__Vectors`、`Reset_Handler`、`SystemInit`、`__main`、`__initial_sp`、`__heap_base`、`__heap_limit`；`PWM.sct`: `ER_IROM1/RW_IRAM1/+RW/+ZI`；`PWM.map`: `.data/.bss`、HEAP/STACK、`Total RW/ROM`；依赖 ARM/MDK 构建变体，C 标准不规定段名 |
| Linux TCP 丢包路径 / `linux-tcp-loss-path-diagnosis` | `projects/嵌入式八股/2. 小林图解/图解网络/04｜传输层篇/4.4 TCP 半连接队列和全连接队列.md`；`4.12 TCP 连接，一端断电和进程崩溃有什么区别？.md`；`4.13 拔掉网线后， 原本的 TCP 连接还存在吗？.md`；`4.16 TCP Keepalive 和 HTTP Keep-Alive 是一个东西吗？.md`；`4.22 用了 TCP 协议，数据一定不会丢吗？.md` | `SYN/ACK` 队列、`listen/backlog/somaxconn`、`SO_KEEPALIVE`、`tcp_retries2`、qdisc、RingBuffer、`ss/netstat/ethtool/mtr`；文章方法论需结合目标内核版本、服务实现、抓包和应用日志，不等于线上实测 | 
| Linux 虚拟内存回收 / `linux-virtual-memory-reclaim-path` | `projects/嵌入式八股/2. 小林图解/图解系统/04｜内存管理篇/4.1–4.7`；`projects/嵌入式八股/3. 杂七杂八/7. 嵌入式系统开发，必知的10个内存管理策略.md` | `malloc/brk/mmap`、缺页、页缓存/匿名页、`kswapd`、direct reclaim、`WMARK_*`、`pgscand/pgscank/pgsteal`；128KB、watermark、OOM 和冷热页模型依版本/架构/库配置，需目标机证据 | 
| UDP 端点 / 广播 / 组播 | `archive/大丙Linux教程/第4章 套接字通信/10 基于UDP的套接字通信.md`；`11 UDP之广播.md`；`12 UDP之组播（多播）.md`；`projects/嵌入式八股/糯叽叽八股/05 计算机网络.md`；`09 嵌入式Linux应用.md` | `bind`、`recvfrom`、`sendto`、`SO_BROADCAST`、`IP_MULTICAST_IF`、`IP_ADD_MEMBERSHIP`；教程 API 需结合接口、路由、防火墙和网络命名空间实测，三类合同不互相替代 |
| 文件持久化 / `linux-file-persistence-crash-consistency` | `projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.1 文件系统全家桶.md`；`7.2 进程写文件时，进程发生了崩溃，已写入的数据会丢失吗？.md`；`projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md` | `write`、`fflush`、`fsync`、`fdatasync`、`rename`、Page Cache/writeback；进程崩溃、内核崩溃和掉电的保证不同，文件 API 不自动提供业务记录原子性 |
| 用户态周期 / `linux-userspace-timer-drift-audit` | `projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md`；`projects/嵌入式八股/2. 小林图解/图解系统/09｜网络系统篇/9.2 I／O 多路复用：select／poll／epoll.md`；`archive/大丙Linux教程/第4章 套接字通信/09 IO多路转接（复用）之epoll.md` | `timer_create/timerfd_create/clock_nanosleep`、`TIMER_ABSTIME`、`epoll_wait` 和 expiration count；周期值不是执行完成保证，需记录抖动、overrun、EINTR 和积压策略 |
| C 结构体二进制合同 / `embedded-c-struct-binary-contract-audit` | `projects/嵌入式八股/糯叽叽八股/01 C语言.md`；`3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md`；`糯叽叽八股/08 通讯协议.md`；`糯叽叽八股/06 STM32.md` | `sizeof`、`offsetof`、`_Alignof`、位域、`#pragma pack`、`union`、DMA、寄存器、CAN/DLC/CRC；ABI 位序、端序、未对齐访问和 DMA/cache 依目标平台，跨平台合同优先显式编码/解码 |
| 跨表示层数值合同 / `embedded-numeric-contract-audit` | `projects/嵌入式八股/2. 小林图解/图解系统/02｜硬件结构篇/2.7 为什么 0.1 + 0.2 不等于 0.3？.md`；`projects/嵌入式八股/3. 杂七杂八/14. PLC 原理 + 数据类型，工控入门天花板知识点.md` | `IEEE 754`、`REAL/INT` 转换、`ScaleLinear`、`FilterCoefficient`、阈值/回差；PLC 语义依厂商/固件，当前没有目标数值源码、日志和标定实测，不推广为 STM32 事实 |

## 共同来源边界

- 项目源码、配置和测试优先于复习文档；教程和转载用于解释候选方法，不自动证明项目事实。
- 代码相关结论必须同时记录路径、符号、实际职责和平台/版本依赖；当前新增 Skill 的详细元数据位于 `../skills/` 各 `SKILL.md` frontmatter。
- `source-register.md` 是逐文件登记簿；`source-map.md` 只列核心结论，不替代全量清单。

## 排除项

`projects/嵌入式八股/2. 小林图解/` 的合并稿与拆分稿存在重叠，本轮以拆分稿和主题资料交叉验证，不把同一篇文章重复计数为独立证据。
