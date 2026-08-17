# RTOS 案例候选

- `TIM4_IRQHandler` 通知 `SpeedCalcTask`。
- `MotorControlTask` 串起目标 RPM、PID 和 PWM。
- `StartTask` 集中创建业务任务后自删除。
- IAP 接收、CRC32 校验和 Flash 写入。
- `Reset_Handler` 到 `vTaskStartScheduler()` 的启动接管链。
- `HardFault_Handler` 等异常入口仅死循环，以及当前关闭栈/堆钩子的诊断缺口。
- `ifopen=0` 下 IAP 代码路径默认不进入应用；打开后由 DMA TC 唤醒 `iap_task`。
