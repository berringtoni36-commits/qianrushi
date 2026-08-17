# 独立前向复核记录

处理日期：2026-08-14（Asia/Shanghai）

## 目的与限制

本记录保存本轮由独立只读复核代理对规范 Skill 的源代码/文档事实进行的前向检查。它用于发现“Skill 是否把边界说窄或说宽”，不是 ZCode 的真实会话触发率，也不是目标板、目标内核或 Qt/OpenCV 的运行测试。复核代理没有写入原始 vault、客户端目录或规范 Skill。

## 已完成复核

### `linux-file-persistence-crash-consistency`

结论：通过边界复核，无需回炉。

- `write()` 返回成功最多说明数据被内核接收，不能单独证明已到稳定介质；短写还必须先处理返回长度和 `EINTR`。
- 进程崩溃、内核崩溃、重启和突然掉电必须分开建模；进程退出后 Page Cache 仍可能被回写，掉电会丢失尚未持久化的数据。
- `fflush()`/`close()`、`fsync()`/`fdatasync()`、`O_SYNC`/`O_DSYNC`、`rename()` 和父目录同步承担不同合同，不能在没有目标文件系统、设备缓存和电源保护证据时作绝对承诺。
- 临时文件 → 完整写入 → 文件 `fsync` → `rename` → 父目录 `fsync` 是可审计的可靠更新模式，但不是当前仓库已有代码的事实声明。

依据：`projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.2 进程写文件时，进程发生了崩溃，已写入的数据会丢失吗？.md:30`、`:198`；`projects/嵌入式八股/3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md:662`。规范 Skill 已将 `fflush`、`rename`、`O_SYNC`、`O_DSYNC` 放入 `audit_targets`，不再冒充当前源码精确符号证据。

### `qt-event-loop-signal-slot-audit`

结论：通过源代码边界复核；已有“GUI 阻塞风险”和“完成事件不可混淆”判断得到直接支持，无需回炉。

- `mainwindow.cpp:124-139` 的 `yolop_process()` 在按钮槽中调用 `waitKey(10000)`，随后进入无上界结果文件轮询并反复 `waitKey(100)`；这会阻塞 GUI 线程对重绘、点击和取消事件的处理。
- `mainwindow.cpp:104-106` 的视频路径还存在 `waitKey(2000)`；构造阶段的 `waitForStarted()` 是另一类同步启动等待，不能与推理完成混为一谈。
- `readyReadStandardOutput()` 只代表当前有可读字节，不代表一行、一个任务、结果文件完整或一次推理完成；当前 `process2` 是长驻 `bash`，其 `finished()` 也不能未经额外合同等同于单次 LSTR 命令完成。
- `process2`/`process3` 无 parent，析构函数没有展示 `terminate()`、有界等待、`kill()` 和子进程组收尾；这是生命周期缺口，不能直接夸大为所有运行路径都已证明泄漏。
- `Open`/`Stop` 是 `QAction`，手动连接却使用 `clicked()`；文档中的“双重绑定”必须核对真实 signal、objectName、meta-object 和连接次数，不能仅凭 `on_` 槽名断言。

依据：`projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/mainwindow.cpp:31`、`:104-149`、`:59-62`；`projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/ui_mainwindow.h:35`、`:172`；`projects/linux视觉感知项目/文档/02 Qt 上位机/2.2 信号槽机制与交互.md:179-183`。

### `vision-model-tensor-contract-audit`

结论：通过静态模型—源码合同复核，无需回炉；运行时和训练语义仍保持未验证。

- 仓库内两份 `lstr_360x640.onnx` 大小均为 `3,074,878` bytes，SHA-256 相同；离线 graph 读取得到 2 个 float 输入：`input_rgb [1,3,360,640]`、`input_mask [1,1,360,640]`。这与 C++ 的 image/mask tensor 形状吻合。
- graph 有 5 个 float 输出：`pred_logits [1,7,2]`、`pred_curves [1,7,8]`、`foo_out_1 [1,7,2]`、`foo_out_2 [1,7,8]`、`weights [1,240,240]`。代码请求全部输出，但只把前两个按 logits/curves 解释；“模型只有两个输出”是不准确的简化说法。
- `LSTR_ONNX/main.cpp:91-103` 直接按 OpenCV BGR 内存读取并写入 CHW，没有 `cvtColor`；这可能造成数值/精度风险，但通常不是 shape/rank mismatch 的首因。模型名 `input_rgb` 或 mean/std 不能单独证明训练时的颜色语义。
- 输入绑定按枚举顺序而非显式节点名；代码没有断言输入数量、名称、dtype、通道数或输出 rank。实际 cwd、加载的是哪份模型、运行时 `Mat` 通道数、`Run()` 成功和结果图正确性仍为 U。
- 集成 LSTR 的文件夹→LIME→LSTR→结果文件边由 `上位机程序/Lane_Detection/LSTR/main.cpp:208-240` 证明；Qt/摄像头/QProcess 是否在目标环境把两条模型分支接通，不能由目录结构和系统文档单独推出。

依据：`projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/LSTR_ONNX/main.cpp:76-165`、`projects/linux视觉感知项目/源码/上位机程序/Lane_Detection/LSTR/main.cpp:208-240`、`projects/linux视觉感知项目/源码/卷积神经网络/卷积神经网络/Unet_NCNN/src/unet.cpp:66-88`；精确文件 hash 与静态元数据已回填 `vision-model-tensor-contract-audit`。

## 后续处理规则

1. 若复核发现规范 Skill 的来源、符号或事实边界过宽，先修改 `distillation/skills/` 规范源，再重跑官方校验、静态压力测试和 `audit_vault.py`。
2. 若只是补充独立证据，不把它伪装成新的客户端命中率；继续单独保留在本文件。
3. 任何目标板、目标内核、Qt/OpenCV、模型运行或客户端真实命中结论，都必须有对应运行日志/新会话记录，不能由本记录代替。
