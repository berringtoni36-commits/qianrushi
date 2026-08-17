---
name: linux-file-persistence-crash-consistency
description: "Use when explaining or diagnosing what Linux file write success means after a process crash, kernel crash, reboot, sudden power loss, or filesystem recovery. Trigger phrases include write 返回成功是否落盘, fsync/fdatasync/fflush, Page Cache dirty data, 掉电丢数据, 原子 rename, or file durability contract. Do not use for virtual-memory reclaim, RTOS Flash/IAP, or generic file descriptor lifetime alone."
metadata:
  source_files:
    - projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.1 文件系统全家桶.md
    - projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.2 进程写文件时，进程发生了崩溃，已写入的数据会丢失吗？.md
    - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
    - projects/嵌入式八股/3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md
  source_symbols:
    - write
    - fsync
    - fdatasync
    - sync
    - Page Cache
    - write-back
    - dirty page
  audit_targets:
    - fflush
    - rename
    - O_SYNC
    - O_DSYNC
  related_skills:
    - linux-fd-process-io-debugging
    - linux-virtual-memory-reclaim-path
    - rtos-iap-firmware-upgrade
    - embedded-c-struct-binary-contract-audit
---

# Linux 用户态文件持久化与崩溃一致性

## 来源证据

source_files:
  - projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.1 文件系统全家桶.md
  - projects/嵌入式八股/2. 小林图解/图解系统/07｜文件系统篇/7.2 进程写文件时，进程发生了崩溃，已写入的数据会丢失吗？.md
  - projects/嵌入式八股/糯叽叽八股/09 嵌入式Linux应用.md
  - projects/嵌入式八股/3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md

source_symbols:
  - write
  - fsync
  - fdatasync
  - sync
  - Page Cache
  - write-back
  - dirty page

audit_targets:
  - fflush
  - rename
  - O_SYNC
  - O_DSYNC

## R — 来源摘录与事实

- 普通写入通常先作用于 Page Cache，未回写的数据是 dirty page；write 返回不等于数据已经到达稳定存储。
- 资料区分 fsync、fdatasync 和 sync：前两者针对文件 fd，后者影响系统范围的脏数据；具体保证仍受文件系统和存储设备语义影响。
- 进程被 kill 或崩溃与内核崩溃、突然掉电不是同一种故障；进程退出后内核通常仍可回写 Page Cache，掉电则可能丢失尚未持久化的数据。

## I — 方法论解释

回答“写成功了吗”前先定义承诺对象：应用缓冲区、内核 Page Cache、文件系统日志、块设备缓存还是稳定介质。再定义故障模型：进程崩溃、内核崩溃、重启、突然掉电。最后核对数据与元数据是否都需要一致，以及恢复后允许丢失多长窗口、允许半条记录还是必须旧版本/新版本二选一。

可靠更新通常需要临时文件写入、检查内容、fsync 文件、原子 rename，再按需要 fsync 父目录；这是一套设计模式，不是对仓库当前代码的事实描述。

## A1 — 资料中的应用

- 小林图解将文件分成数据和元数据，并说明 write-back 与 write-through 的吞吐/一致性权衡。
- 文件系统资料把 Page Cache、dirty page、回写线程和 fsync/fdatasync/sync 联系起来。
- 结构体资料给出 magic、version、length、CRC 的参数存储格式；CRC 能发现损坏，但不能单独保证掉电原子性。

## A2 — 未来触发场景

- 用户问 write/fflush 返回成功后进程崩溃或掉电，文件到底会是什么状态。
- 用户要设计日志、配置、帧结果或参数文件的崩溃一致性和恢复流程。
- 用户看到“文件存在但内容不完整”“新文件名存在但旧文件也损坏”。

## E — 可执行分析流程

1. 标注每层缓冲和故障模型：用户缓冲、write、Page Cache、文件系统、设备缓存、稳定介质；分别说明进程崩溃、内核崩溃和掉电。
2. 检查代码是否使用 fflush、fsync/fdatasync、O_SYNC/O_DSYNC，以及是否检查返回值和 EINTR；不要把 fflush 当成磁盘持久化。
3. 对更新协议核对数据与元数据顺序，是否有临时文件、校验、原子 rename、父目录同步、版本号和恢复选择。
4. 设计故障注入：在 write 后、fsync 后、rename 前后、断电模拟或 kill -9 后重启读取，记录允许结果。
5. 输出“已写入内核”“已提交文件系统”“已送达设备”“稳定介质承诺”四级表述，并标注文件系统/设备/内核版本边界。

## B — 边界与风险

- fsync 的语义不能脱离目标文件系统、块设备、写缓存和电源保护谈绝对不丢。
- CRC、版本和魔数用于检测/选择有效记录，不等于原子提交。
- 不把此 Skill 与 linux-virtual-memory-reclaim-path 混用；后者分析内存压力，不分析持久化承诺。
- RTOS Flash/IAP 的擦写、掉电保护和回滚属于 rtos-iap-firmware-upgrade 等固件 Skill。

## 相关 Skills

- linux-fd-process-io-debugging：fd、mmap、pipe 和用户态 I/O 生命周期。
- linux-virtual-memory-reclaim-path：Page Cache 作为内存压力对象时的回收路径。
- rtos-iap-firmware-upgrade：STM32 固件升级与 Flash 写入。
- embedded-c-struct-binary-contract-audit：持久化结构体的布局与序列化合同。
