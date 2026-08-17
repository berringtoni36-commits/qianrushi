# 案例候选

- RTOS 油烟机项目：任务拆分、信号量和共享状态把多个周期不同的功能串起来。
- Linux 视觉项目：摄像头、LIME、LSTR 和 Qt 形成端到端链路，但源码审计发现默认帧目录不一致。
- STM32 Map 审计：`startup_stm32f10x_md.s`、`PWM.sct` 与 `PWM.map` 共同说明初始栈、HEAP、`.data/.bss` 和区域占用；不能只看 C 变量定义推断镜像布局。
- Linux TCP 诊断：用 LISTEN 状态的 `ss`/`netstat` 区分 accept 队列溢出，再把 ACK、Socket 缓冲、qdisc、RingBuffer 和应用处理分开核对。
