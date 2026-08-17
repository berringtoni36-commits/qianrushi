# RTOS 当前 target 与构建产物身份审计

> 本报告只读取 Keil 工程、历史 Build log、AXF/HEX/MAP/Scatter 和下载配置；没有调用 Keil/J-Link，也没有声称目标板已烧录或运行。

## 结论

- 当前 target：`project` / `STM32F103C8` / `Keil.STM32F1xx_DFP.1.0.5`。
- 工程声明的 target 文件：43 个；Build log 记录的编译/汇编单元：43 个；按文件名集合比较：`一致`。
- MAP 向量地址：`0x8000000`；HEX 数据起始地址：`0x8000000`；静态地址对齐：`是`。
- 这能支持“当前目录中存在一份与 target/历史 Build log 布局相容的构建证据”，不能支持“本次在当前环境重新编译并已在板上运行”。

## C0–C4 证据节点

| 节点 | 当前状态 | 允许的表述 | 仍缺什么 |
|---|---|---|---|
| C0 工程合同 | static pass | target、芯片、宏、源文件组、IROM/IRAM、输出规则可核对 | 当前 Keil/Pack 可用性 |
| C1 产物身份 | static-compatible | target 文件名与历史 Build log 对齐，MAP/HEX 起始布局相容 | 同一次构建的完整输入 hash/当前环境重编译 |
| C2 Flash | not-evidenced | 只能写下载配置/流程存在 | J-Link 或 ST-Link 会话、program/verify/readback |
| C3 Reset/boot | not-evidenced | 只能写源码向量和启动链 | 复位后的 PC/MSP/VTOR、断点到 main |
| C4 runtime | not-evidenced | 只能写 UART/LCD/任务代码路径 | 原始串口、LCD、业务输入输出和时间戳 |

## 关键矛盾与边界

- 历史 Build log 的项目路径：`D:\CommercialProject\range_hood_project_SDK\range_hood_project\USER\project.uvprojx`；它包含 Windows 绝对路径，且不是当前 iCloud vault 路径。
- `TargetStatus/InvalidFlash`：`1`；J-Link `Device`：`UNSPECIFIED`；工程 target DLL：`SARMCM3.DLL`。这三项是配置线索，不是连接结果。
- Build log 报告：`Code=35318 RO-data=6478 RW-data=312 ZI-data=13112`，错误/警告：`0/0`；这是历史日志内容，不自动证明当前源文件未变化。
- `0x08000000` 的主工程布局与 `FLASH_APP1_ADDR=0x0800F000` 的 IAP 规划不能混为一谈；当前报告不把后者当作独立 APP 链接证据。

## 可执行补证步骤

1. 在同一 Keil target 执行 Rebuild，保存完整 log、工具/Pack 版本和 AXF/HEX/MAP/SCT 的 SHA-256。
2. 记录实际送入下载器的文件路径和 hash，执行 program + verify + readback；避免未经确认的整片擦除覆盖 Boot 内容。
3. 复位后记录向量首两个 word、PC/MSP/VTOR，并在 `Reset_Handler`、`main` 和业务断言处取证。
4. 记录 `DEBUG`/`SENSOR_DEBUG`/`ifopen` 变体、UART 接线和原始输出；将“Build succeeded”“Flash verified”“reached main”“business observed”分开报告。

## 来源

- `projects/RTOS项目/源码/USER/project.uvprojx`
- `projects/RTOS项目/源码/OBJ/PWM.build_log.htm`
- `projects/RTOS项目/源码/USER/PWM.map`
- `projects/RTOS项目/源码/OBJ/PWM.hex`
- `projects/RTOS项目/源码/OBJ/PWM.axf`
- `projects/RTOS项目/源码/OBJ/PWM.bin`
- `projects/RTOS项目/源码/OBJ/PWM.sct`
- `projects/RTOS项目/源码/USER/JLinkSettings.ini`
