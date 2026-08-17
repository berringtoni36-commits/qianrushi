# 项目验证运行手册

> 这是一份执行模板，不是已经完成的运行报告。它把静态蒸馏结果转换成可复核的目标环境证据；原始仓库保持只读，实测记录应另存到 `distillation/`。

## 使用规则

每次验证先记录日期、设备/系统、工具版本、源码或固件变体、输入数据和命令，再记录原始输出。不要只写“成功”。每条结果标为：`pass`、`blocked`、`not-run`、`static-risk` 或 `not-evidenced`。

禁止把以下内容混写：

- 文件存在 ≠ 当前环境重新构建。
- 历史 Build log ≠ 当前源码构建。
- 下载配置 ≠ Flash program/verify/readback。
- 进程启动 ≠ 事件循环、结果文件或模型推理完成。
- Map 有值 ≠ 事件计数精确。
- 静态压力测试 6/6 ≠ ZCode 真实命中率。

## 0. 通用记录卡

```text
验证批次：
日期/时区：
操作者：
源码/固件变体及 SHA-256：
目标设备/内核/发行版/芯片：
工具链及版本：
输入数据或 workload：
原始日志位置（只写 distillation/）：
结论：pass / blocked / not-run / static-risk / not-evidenced
```

## 1. RTOS：C0–C4

当前静态入口：[`rtos-project/artifact-provenance.md`](artifact-provenance.md)。

执行顺序：

1. C0：冻结 Keil target、Device/Pack、宏、IncludePath、startup/port、IROM/IRAM、Flash algorithm 和输出文件路径。
2. C1：同一次 Rebuild 保存完整 Build log、AXF/HEX/MAP/Scatter 哈希；确认 target 文件组和实际编译单元一致。
3. C2：记录下载器型号、实际输入文件哈希、program、verify、readback、擦除范围和失败信息。不要把 `InvalidFlash` 或 `.ini` 开关当作连接成功。
4. C3：复位后读取向量首两个 word，记录 PC、MSP、VTOR，并分别在 `Reset_Handler`、`main`、`vTaskStartScheduler` 处取证。
5. C4：记录 `DEBUG`、`SENSOR_DEBUG`、`ifopen` 变体、串口参数、LCD/按键/传感器/电机结果和时间戳；“没有串口输出”只能作为现象。

建议结果表：

| 节点 | 原始证据 | 结果 | 可说的话 | 不能说的话 |
|---|---|---|---|---|
| C0 | 工程 XML/Pack/宏 |  |  |  |
| C1 | 同次 Build log + 文件哈希 |  |  |  |
| C2 | 下载器 log + verify/readback |  |  |  |
| C3 | PC/MSP/VTOR/断点 |  |  |  |
| C4 | 串口/业务原始日志 |  |  |  |

## 2. Linux 内存/eBPF：M0–M8

当前静态入口：[`linux-memory-ebpf/runtime-validation-matrix.md`](runtime-validation-matrix.md)。

先处理静态阻断：确认 `from extfrag import ExtFrag` 的模块名，以及 `BPF(src_file=...)` 的 C 文件相对路径。记录修复后的变体 hash，不要修改原始源码作为蒸馏步骤。

执行顺序：

1. M0–M3：在目标 Linux 中做 Python import、BCC import、C 文件解析路径和工作目录检查。
2. M4：保存 BCC/Clang 编译、verifier、内核版本、配置和 attach 原始输出。
3. M5–M6：分别验证 kprobe/tracepoint attach、受控 workload、`pgdat_map`/`zone_map`/`counts_map` 更新和 TUI 读取。
4. M7：验证 `last_time_map` 的 key/update/default delay 行为；把采样节流与用户态刷新分开测。
5. M8：在多 CPU、并发、PID 复用和读取期间更新条件下，用独立计数器或内核统计对照 PID Map；不要把 `lookup→++→update` 直接称为精确计数。

## 3. Linux 视觉：V0–V8

当前静态入口：[`linux-vision/main-chain-verification-matrix.md`](main-chain-verification-matrix.md)。

执行顺序：

1. V0–V2：冻结摄像头输出目录、LSTR 输入目录、结果目录、帧编号起点、格式和“写完”标记；用单帧和连续帧验证路径与编号。
2. V3–V4：记录 QProcess parent、stdout/stderr、finished/error、超时/取消/重启、run ID 和 Qt 事件循环响应；不要用 `start()` 返回成功代表任务完成。
3. V5：当前源码目录 clean configure/build，保存 source/build 根目录、target source、compile/link command、架构和 loader 证据；历史 `/media/kylin/...` build 只能作为历史快照。
4. V6：用已知图片核对模型输入数量、name、shape、dtype、HWC/CHW、辅助输入、输出 shape 和解码；文件存在不等于 Tensor 合同成立。
5. V7–V8：在目标 ARM/NEON/OpenMP 与 Qt/OpenCV 环境分别测性能、尾部处理、归约、stride、颜色和非连续 Mat；保存原始 benchmark 与已知像素结果。

## 4. 完成条件

一个项目只有在所需节点都有原始证据、变体可追溯、失败路径也有记录时，才可以把对应节点从 `not-run`/`not-evidenced` 改为 `pass`。修改状态后重新运行：

```bash
python3 distillation/scripts/provenance_audit.py
python3 distillation/scripts/audit_vault.py
```

不要手工改 JSON 统计；报告由当前文件系统生成。
