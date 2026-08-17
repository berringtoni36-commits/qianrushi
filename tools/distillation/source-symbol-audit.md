# Skill 来源符号审计

> 本报告只审计 `source_symbols` 是否能在该 Skill 声明的 `source_files` 中逐字定位；它不把概念标签、文档术语或带命名空间的 API 名称误判成来源缺失。完整逐符号记录见 [`source-symbol-audit.tsv`](source-symbol-audit.tsv)。

- Skill 数：56
- 声明符号：765
- 逐字命中：705
- 限定名叶子命中：17
- 需要人工确认的语义标签：43

## 按 Skill 汇总

| Skill | 符号数 | 逐字命中 | 限定名叶子命中 | 语义/待确认 |
|---|---:|---:|---:|---:|
| `algorithm-active-recall-loop` | 7 | 7 | 0 | 0 |
| `algorithm-problem-framework-selection` | 7 | 3 | 0 | 4 |
| `algorithm-state-and-invariant-derivation` | 7 | 2 | 0 | 5 |
| `cmake-source-discovery-incremental-build-audit` | 32 | 25 | 0 | 7 |
| `embedded-arm-linux-boot-chain` | 11 | 7 | 0 | 4 |
| `embedded-bus-selection` | 8 | 8 | 0 | 0 |
| `embedded-c-storage-linkage-audit` | 17 | 16 | 0 | 1 |
| `embedded-c-struct-binary-contract-audit` | 12 | 9 | 0 | 3 |
| `embedded-cpp-resource-lifetime` | 10 | 8 | 0 | 2 |
| `embedded-interview-layered-answer` | 6 | 5 | 0 | 1 |
| `embedded-learning-state-and-active-recall` | 6 | 6 | 0 | 0 |
| `embedded-memory-lifetime-and-pool-design` | 9 | 9 | 0 | 0 |
| `embedded-numeric-contract-audit` | 11 | 11 | 0 | 0 |
| `interactive-lab-fact-boundary-audit` | 8 | 6 | 0 | 2 |
| `linux-buddy-fragmentation-diagnosis` | 7 | 7 | 0 | 0 |
| `linux-build-debug-chain` | 12 | 12 | 0 | 0 |
| `linux-driver-device-tree-boundary` | 17 | 17 | 0 | 0 |
| `linux-ebpf-map-counter-contract` | 8 | 8 | 0 | 0 |
| `linux-fd-process-io-debugging` | 12 | 12 | 0 | 0 |
| `linux-file-persistence-crash-consistency` | 7 | 6 | 0 | 1 |
| `linux-memory-ebpf-pipeline` | 6 | 6 | 0 | 0 |
| `linux-memory-fastpath-observation-contract` | 7 | 7 | 0 | 0 |
| `linux-memory-source-audit` | 12 | 12 | 0 | 0 |
| `linux-process-signal-daemon-lifecycle` | 24 | 24 | 0 | 0 |
| `linux-rx-napi-path-diagnosis` | 29 | 26 | 0 | 3 |
| `linux-socket-multiplexing-design` | 11 | 11 | 0 | 0 |
| `linux-tcp-loss-path-diagnosis` | 25 | 25 | 0 | 0 |
| `linux-thread-sync-deadlock-diagnosis` | 34 | 33 | 1 | 0 |
| `linux-udp-broadcast-reachability-contract` | 7 | 6 | 0 | 1 |
| `linux-udp-datagram-endpoint-routing` | 8 | 8 | 0 | 0 |
| `linux-udp-multicast-interface-membership-contract` | 8 | 8 | 0 | 0 |
| `linux-userspace-timer-drift-audit` | 10 | 9 | 0 | 1 |
| `linux-virtual-memory-reclaim-path` | 19 | 19 | 0 | 0 |
| `linux-vision-build-provenance-audit` | 12 | 12 | 0 | 0 |
| `linux-vision-file-ipc-lifecycle-audit` | 11 | 11 | 0 | 0 |
| `linux-vision-pipeline-and-optimization` | 16 | 15 | 1 | 0 |
| `linux-vision-project-storytelling` | 13 | 9 | 0 | 4 |
| `linux-vision-qt-image-buffer-adapter-audit` | 10 | 8 | 2 | 0 |
| `linux-vision-resource-telemetry-contract-audit` | 9 | 7 | 2 | 0 |
| `qt-event-loop-signal-slot-audit` | 24 | 16 | 6 | 2 |
| `rtos-auto-mode-state-machine` | 12 | 12 | 0 | 0 |
| `rtos-build-flash-runtime-provenance` | 21 | 21 | 0 | 0 |
| `rtos-communication-debugging` | 7 | 7 | 0 | 0 |
| `rtos-display-buzzer-feedback` | 29 | 29 | 0 | 0 |
| `rtos-freertos-config-and-boot` | 16 | 16 | 0 | 0 |
| `rtos-iap-firmware-upgrade` | 16 | 16 | 0 | 0 |
| `rtos-key-event-state-machine` | 9 | 9 | 0 | 0 |
| `rtos-motor-pid-control` | 17 | 17 | 0 | 0 |
| `rtos-project-storytelling` | 14 | 12 | 0 | 2 |
| `rtos-runtime-fault-diagnosis` | 17 | 17 | 0 | 0 |
| `rtos-sensor-acquisition-and-fusion` | 8 | 8 | 0 | 0 |
| `rtos-software-timer-periodic-design` | 24 | 24 | 0 | 0 |
| `rtos-task-and-isr-design` | 19 | 19 | 0 | 0 |
| `stm32-clock-and-sampling-timing` | 11 | 11 | 0 | 0 |
| `vault-source-boundary-and-derived-artifact-audit` | 7 | 7 | 0 | 0 |
| `vision-model-tensor-contract-audit` | 29 | 24 | 5 | 0 |

## 需要人工确认的标签

- `algorithm-problem-framework-selection`：`sliding_window`、`binary_search`、`backtracking`、`greedy`
- `algorithm-state-and-invariant-derivation`：`base_case`、`transition`、`invariant`、`choice_list`、`pruning`
- `cmake-source-discovery-incremental-build-audit`：`file(GLOB)`、`CONFIGURE_DEPENDS`、`add_subdirectory`、`add_library`、`target_sources`、`CMakeFiles/<target>.dir/<source>.cpp.o`、`<source>.cpp.o.d`
- `embedded-arm-linux-boot-chain`：`BootROM`、`PID1`、`serial console`、`last-known-good-stage`
- `embedded-c-storage-linkage-audit`：`Total RW Size`
- `embedded-c-struct-binary-contract-audit`：`bit-field`、`flexible array`、`endian`
- `embedded-cpp-resource-lifetime`：`copy constructor`、`move constructor`
- `embedded-interview-layered-answer`：`项目映射`
- `interactive-lab-fact-boundary-audit`：`source`、`boundary`
- `linux-file-persistence-crash-consistency`：`dirty page`
- `linux-rx-napi-path-diagnosis`：`hardware interrupt`、`four-tuple`、`Socket receive buffer`
- `linux-udp-broadcast-reachability-contract`：`INADDR_BROADCAST`
- `linux-userspace-timer-drift-audit`：`expiration count`
- `linux-vision-project-storytelling`：`camera`、`project-background`、`personal-contribution`、`evidence-boundary`
- `qt-event-loop-signal-slot-audit`：`QProcess::readyReadStandardError`、`QProcess::errorOccurred/error`
- `rtos-project-storytelling`：`personal-contribution`、`evidence-boundary`

## 判定口径

- `exact`：符号字符串在至少一个真实来源文件中出现，可直接作为定位提示。
- `qualified-leaf`：完整限定名未出现，但去掉命名空间后的叶子名称出现；回答时仍需人工确认它是否对应同一 API/方法。
- `review-label`：更可能是概念、字段语义、面试标签或来源中的不同写法；不因此判定 Skill 错误，也不把它写成精确源码事实。
