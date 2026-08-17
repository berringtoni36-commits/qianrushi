# linux-vision 全量未回链与主链事实覆盖复核

审计日期：2026-08-14。原始来源 projects/linux视觉感知项目/、模型、构建树和媒体证据保持只读；本文件只在本域新增覆盖审计。

## 结论与统计

本轮输入是当前 source-inventory-current.tsv（全库 7,146 条数据行）以及本域 INDEX.md、source-map.md、DIGEST.md、verified.md 和真实源码。文件级扫描把显式 source/CMake/符号锚点算精确回链；目录、模块、构建树、媒体邻接或聚合描述只算 domain-scoped。

| 口径 | 数量 | 解释 |
|---|---:|---|
| 当前域清单 | 959 | 49 个知识文档、276 个代码/配置、634 个构建/媒体/模型/派生证据 |
| 精确回链 | 14 | 少量主链源码、CMake、模型和 Qt 事实锚点 |
| domain-scoped | 942 | 已纳入视觉项目范围，但多数构建/媒体/变体没有逐文件精确回链 |
| indexed-only | 3 | 根目录叙述/索引/替代稿等只有登记或宽泛入口，未形成 canonical 文件级回链 |
| build 文件含 /media/kylin 历史路径 | 72 | 当前快照对所有 linux-vision build 文件内容的可复现扫描结果 |
| 目标运行验证 | 0 次 | 未在目标 ARM/Qt/OpenCV/摄像头环境执行端到端回归 |

indexed-only 的三条应以 source-register.md 的当前路径和哈希复核；重点是根目录叙述/索引/替代稿，不应与已经有 source-map 锚点的主流程说明重复计数。全域 959 条逐路径登记仍以 source-register.md 和 source-inventory-current.tsv 为准。

## 可复用的摘要

- 摄像头采集、文件帧交换、LSTR/Unet 推理、结果显示和资源遥测应拆成 producer/consumer、编号、完成标记、进程生命周期、模型 tensor、Mat/QImage 所有权和采样时间七类合同。
- 基础 LIME、NEON/OpenMP LIME、LSTR ONNX Runtime、Unet NCNN 是不同 target/执行分支；目录名和历史二进制名不能证明当前主链。
- 构建 provenance 必须串起 source → CMake target → flags → library/model → binary → runtime loader → benchmark log；图表和文档数字只是 claim。

## 源码事实与文档 claim

### 1. Qt/QProcess 与文件型 IPC

- mainwindow.cpp:17 设置 LSTR/result；mainwindow.cpp:27-34 创建两个无 parent 的 QProcess，mainwindow.cpp:59-61 析构只删除 ui。
- mainwindow.cpp:127-139 向 ./LSTR ../videos/frames/ 写入启动命令，随后从 result/ 编号 1 开始同步读取；代码未见 finished/error/stderr/timeout/terminate/kill 的完整生命周期闭环。
- mainwindow.cpp:71 的摄像头计数从 0 开始，mainwindow.cpp:162 写入 Lane_Detection/frames/<count>.jpg；这与 LSTR 默认读取的 ../videos/frames/ 不一致，且生产者/消费者没有源码级原子 rename、done 标记或锁。
- 同一槽内存在 waitKey(10000)、同步 imread 轮询和 waitKey(100)；这证明事件循环阻塞风险，不能证明外部推理已完成或结果文件一定属于当前帧。

### 2. CMake target membership

- 基础 LIME CMakeLists.txt:17 是 add_executable(lime lime.cpp)。
- 优化目录 CMakeLists.txt:32 是 add_executable(lime lime_opt.cpp)；xinlime.cpp 存在但未进入当前 target。
- LSTR CMake 编译 main.cpp 并链接 libonnxruntime.so；Unet CMake 编译 src/unet.cpp 并链接 NCNN。两个 LIME 工程的同名 target 和历史 build 目录不能互相证明。
- 当前 build 文本中有 72 个文件含 /media/kylin 路径，说明历史 configure/build 身份；它不证明 iCloud 当前源码已用同一 source/config 重建。file 对现有候选产物显示为动态链接 ARM aarch64 ELF，也只能证明产物身份。

### 3. 模型与像素边界

- LSTR main.cpp:130 使用 Run(..., 2, ...)，main.cpp:226 从编号帧读取并在 239 写结果；Unet src/unet.cpp:66-80 明确处理 HWC 到 NCNN 输入布局。
- 这些静态事实不能推出 BGR/RGB 训练语义、实际 cwd、模型文件加载成功、Qt 摄像头主链接通或输出质量。
- lime_opt.cpp 的 NEON 分块路径没有已完成的目标 ARM 标量尾部回归证据；OpenMP 归约变量 total_sum 存在并发读改写风险，不能仅凭“用了 NEON/OpenMP”宣称结果与串行版一致。

### 4. 性能、精度和平台数字

文档 03 LIME 低照度增强/3.7 优化前后性能对比.md 声称 LIME 5.19 倍、LSTR 10.7 倍、端到端约 1.87 FPS，并给出约 40/314/182/536 ms、精度和模型比较。当前快照没有与当前源码、编译 flags、模型转换脚本、输入集、重复次数、原始日志和目标机身份完整闭合的 benchmark 链；这些数字只能标为文档 claim。

## 不能升格的证据

以下结论暂不能写成当前项目运行事实：Qt 界面不卡顿；QProcess 已正确回收；帧没有丢失/串帧；LSTR/Unet 端到端成功；ONNX/NCNN 模型与训练语义一致；NEON/OpenMP 无尾部/竞态问题；ARM 动态库可加载；摄像头实时；文档中的 FPS、加速比、精度、模型大小已复现。

构建产物、模型、图片和历史 CMake 文件是 provenance/evidence layer，不因存在于 959 条清单中而自动成为主链实现或测试结果。source-register 中的 57 条 skill-evidence 也不等价于本轮 14 个精确主链锚点。

## 可复现扫描口径

~~~sh
awk -F '\t' 'NR > 1 && $1 == "linux-vision" {n++} END {print n}' distillation/source-inventory-current.tsv
rg --files 'projects/linux视觉感知项目' | sort
while IFS=$'\t' read -r d c s h p; do
  if [[ "$d" == "linux-vision" && "$p" == */build/* ]] &&
     rg -q --hidden --fixed-strings '/media/kylin' "$p" 2>/dev/null; then
    n=$((n+1))
  fi
done < <(tail -n +2 distillation/source-inventory-current.tsv)
echo "$n"
rg -n 'QProcess|waitKey|imread|imwrite|add_executable|Run\(|onnxruntime|ncnn' \
  'projects/linux视觉感知项目/源码'
~~~

分类只以本域四个 canonical 文档的文件/符号锚点、目录/变体范围和当前清单为准；历史 build 和媒体不当作运行证据。未执行目标 Qt/OpenCV、摄像头、模型、clean rebuild 或 benchmark。

## 剩余风险与最小补证

先在目标 ARM 上 clean configure/build 每个独立 target，保存 source/CMake/flags/库/model hash 和 link/load 日志；再用临时目录、原子落盘、done 标记和 finished/error 超时测试文件 IPC；对 LIME 做尾部、串行对照、OpenMP 多线程和 NEON 回归；最后用固定输入集和原始计时日志复核性能/精度。没有这条闭环，文档数字和历史二进制只能保持为 claim/evidence。
