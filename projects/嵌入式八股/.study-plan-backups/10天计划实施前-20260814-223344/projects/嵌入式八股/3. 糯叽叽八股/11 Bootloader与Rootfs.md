---
title: "Bootloader 与 Rootfs"
tags: [嵌入式, 面试, 八股]
---

# Bootloader 与 Rootfs

[[糯叽叽八股（完整版）|← 总索引]] · [[10 嵌入式Linux驱动|← 上一章：嵌入式 Linux 驱动]]

---

## 3.1 什么是 Bootloader？它的主要作用是什么？

### 3.1.1 基本概念

**Bootloader** 是系统上电或复位后 **最先运行的一段程序**，主要负责 **初始化硬件并加载操作系统或应用程序**。

它通常存放在 **Flash 的固定启动地址**，由 CPU 上电后自动执行。

### 3.1.2 主要作用

1. **硬件初始化**

初始化最基本的硬件资源，例如：

- 时钟
- 内存
- 串口
- Flash

为后续程序运行提供基础环境。

2. **加载应用程序或操作系统**

Bootloader 会从指定存储位置（Flash、SD 卡、网络等）加载程序到内存，然后跳转执行。

例如：

- 嵌入式 Linux 加载内核
- MCU 加载应用程序
3. **固件升级（Firmware Update）**

Bootloader 常用于 **在线升级（OTA 或串口升级）**：

- UART 升级
- CAN 升级
- 网络升级

升级完成后再启动新程序。

4. **系统恢复与安全校验**

部分 Bootloader 会进行：

- 固件完整性校验（CRC / Hash）
- 安全启动（Secure Boot）

防止系统启动非法程序。

### 3.1.3 MCU 中 Bootloader 的典型流程

```text
上电复位
   ↓
执行 Bootloader
   ↓
初始化硬件
   ↓
检测是否需要升级
   ↓
加载应用程序
   ↓
跳转到 Application
```

### 3.1.4 面试精简回答

> Bootloader 是系统上电后首先运行的一段启动程序，主要负责硬件初始化、加载操作系统或应用程序，并提供固件升级和安全校验等功能。它通常存放在 Flash 的启动地址，在系统启动过程中起到引导作用。

---

## 3.2 Bootloader 和 BIOS / UEFI 有什么区别？

### 3.2.1 概念区别

- **Bootloader** 嵌入式系统中的 **启动加载程序**；负责初始化硬件并加载应用程序或操作系统；常见于 MCU 或嵌入式 Linux 设备
- **BIOS / UEFI** PC 平台中的 **固件（Firmware）**；负责完成系统硬件初始化并启动 Bootloader 或操作系统

简单理解：

```text
PC：BIOS / UEFI → Bootloader → OS
嵌入式：Bootloader → OS / Application
```

### 3.2.2 功能区别

### 3.2.3 启动流程区别

**PC 启动流程**

```text
上电
 ↓
BIOS / UEFI
 ↓
Bootloader（如 GRUB）
 ↓
操作系统
```

**嵌入式系统启动流程**

```text

```

### 3.2.4 面试回答

> Bootloader 是嵌入式系统中的启动加载程序，主要负责硬件初始化并加载操作系统或应用程序；而 BIOS 或 UEFI 是 PC 平台的固件，负责完成系统硬件初始化并启动 Bootloader。简单来说，BIOS/UEFI 更偏底层固件，而 Bootloader 主要负责加载系统。

---

## 3.3 Bootloader 启动 Linux 内核的过程是什么？

### 3.3.1 启动流程概述

Bootloader 启动 Linux 内核通常包括 **硬件初始化、加载内核、传递参数、跳转执行** 四个主要步骤。

典型流程：

```text
上电
 ↓
Bootloader 运行
 ↓
初始化硬件
 ↓
加载 Linux 内核到内存
 ↓
加载设备树和 rootfs 信息
 ↓
传递启动参数
 ↓
跳转到内核入口地址
 ↓
Linux 内核启动
```

### 3.3.2 硬件初始化

Bootloader 首先完成最基本的硬件初始化，例如：

- CPU 时钟
- DDR 内存
- 串口（用于调试输出）
- Flash / eMMC / SD 卡

为 Linux 内核运行提供基础环境。

### 3.3.3 加载 Linux 内核

Bootloader 从存储设备读取内核镜像，例如：

- Flash
- SD 卡
- eMMC
- 网络（TFTP）

然后将 **内核镜像（zImage / uImage / Image）加载到指定内存地址**。

### 3.3.4 加载设备树（Device Tree）

Bootloader 同时加载 **设备树（.dtb）**，用于描述硬件信息，例如：

- CPU
- 内存
- 外设
- 中断控制器

Linux 内核会根据设备树初始化驱动。

### 3.3.5 传递启动参数

Bootloader 会向 Linux 传递 **启动参数（bootargs）**，例如：

```text
console=ttyS0 root=/dev/mmcblk0p2 rw
```

这些参数包括：

- 控制台设备
- root 文件系统位置
- 调试信息

### 3.3.6 跳转到内核入口

Bootloader 最后执行：

- 设置寄存器参数
- 跳转到 Linux 内核入口地址

此时 Bootloader 的工作结束，Linux 内核开始执行。

### 3.3.7 面试回答

> Bootloader 启动 Linux 内核的过程主要包括：首先进行硬件初始化，如时钟和内存；然后从 Flash 或存储设备加载内核镜像到内存；同时加载设备树并传递启动参数；最后跳转到内核入口地址，由 Linux 内核开始启动。

---

## 3.4 U-Boot 的主要功能有哪些？

### 3.4.1 硬件初始化

U-Boot 在系统启动早期负责 **基础硬件初始化**，例如：

- CPU 时钟初始化
- DDR 内存初始化
- 串口初始化（用于调试输出）
- Flash、SD 卡、eMMC 初始化

为后续加载操作系统提供运行环境。

### 3.4.2 加载操作系统

U-Boot 可以从多种存储设备 **加载操作系统内核**：

- Flash
- NAND / NOR
- SD 卡
- eMMC
- 网络（TFTP）

然后将 **Linux 内核加载到指定内存地址并启动**。

### 3.4.3 传递启动参数

U-Boot 会向 Linux 内核传递 **启动参数（bootargs）**，例如：

```text
console=ttyS0 root=/dev/mmcblk0p2 rw
```

这些参数用于指定：

- 控制台设备
- root 文件系统位置
- 调试信息等

### 3.4.4 提供命令行交互

U-Boot 提供 **命令行接口（CLI）**，方便开发和调试，例如：

- printenv：查看环境变量
- setenv：设置环境变量
- boot / bootm：启动系统
- tftp：网络下载程序

### 3.4.5 固件下载与升级

U-Boot 支持 **程序下载和固件升级**，例如：

- 串口下载（Kermit / YMODEM）
- 网络下载（TFTP）
- USB 下载

常用于 **系统烧录和升级**。

### 3.4.6 面试回答

> U-Boot 是嵌入式系统常用的 Bootloader，主要功能包括硬件初始化、从存储设备或网络加载 Linux 内核、向内核传递启动参数，以及提供命令行接口用于调试和固件升级。

---

## 3.5 U-Boot 的启动阶段（SPL / TPL）分别是什么？

### 3.5.1 启动阶段概念

在一些嵌入式系统中，由于 **片上 SRAM 空间有限**，无法直接加载完整的 U-Boot，因此会采用 **分阶段启动**：

```text
TPL → SPL → U-Boot → Linux Kernel
```

每个阶段逐步完成更复杂的初始化。

### 3.5.2 TPL（Third Program Loader）

**TPL 是最早执行的启动阶段**。

主要特点：

- 代码体积非常小
- 运行在 **片上 SRAM** 中
- 只完成最基本初始化

主要任务：

- 初始化最基础的硬件
- 初始化 DRAM 所需的最小环境
- 加载 **SPL 到 SRAM**

并不是所有平台都需要 TPL，通常在 **SRAM 极小的 SoC** 上使用。

### 3.5.3 SPL（Secondary Program Loader）

**SPL 是第二阶段启动程序**。

主要特点：

- 比 TPL 功能更完整
- 负责初始化 **DDR 内存**

主要任务：

1. 初始化 DRAM
2. 初始化存储设备（NAND / SD / eMMC）
3. 从存储设备加载 **完整 U-Boot** 到 DDR
4. 跳转执行 U-Boot

### 3.5.4 U-Boot 主程序

在 DDR 初始化完成后，系统进入 **完整 U-Boot** 阶段：

主要功能：

- 完整硬件初始化
- 提供命令行接口
- 加载 Linux 内核
- 启动系统

### 3.5.5 面试回答

> U-Boot 在一些平台上采用分阶段启动。TPL 是最早执行的程序，体积很小，主要完成最基础的硬件初始化并加载 SPL；SPL 是第二阶段启动程序，负责初始化 DDR，并从存储设备加载完整的 U-Boot，最后由 U-Boot 加载 Linux 内核启动系统。

---

## 3.6 U-Boot 环境变量的作用是什么？

### 3.6.1 基本概念

U-Boot 环境变量是 **Bootloader 中用于保存系统配置和启动参数的一组变量**，用于控制系统启动行为。

这些变量通常 **存储在 Flash 或 eMMC 中**，系统重启后仍然可以保留。

### 3.6.2 主要作用

1. **配置启动参数**

通过 bootargs 向 Linux 内核传递启动参数，例如：

```text
console=ttyS0 root=/dev/mmcblk0p2 rw
```

用于指定：

- 控制台设备
- root 文件系统位置
- 启动模式
2. **控制启动流程**

通过 bootcmd 指定系统启动时执行的命令，例如：

```text
bootcmd=bootm 0x80000000
```

决定系统如何加载并启动内核。

3. **保存系统配置**

环境变量还可以保存：

- IP 地址
- 服务器地址
- 内核加载地址
- 启动设备

例如：

```text
ipaddr=192.168.1.100
serverip=192.168.1.1
```

### 3.6.3 常用环境变量命令

常见操作命令：

### 3.6.4 面试回答

> U-Boot 环境变量用于保存系统启动配置，例如启动命令、内核参数、网络配置等。系统启动时 U-Boot 会读取这些变量控制启动流程，并通过 bootargs 向 Linux 内核传递启动参数。环境变量通常保存在 Flash 中，可以通过 printenv、setenv 等命令进行管理。

---

## 3.7 U-Boot 如何加载 kernel、device tree 和 rootfs？

### 3.7.1 加载 kernel

U-Boot 会从存储设备中 **读取 Linux 内核镜像到内存**，常见存储介质包括：

- NAND / NOR Flash
- SD 卡 / eMMC
- 网络（TFTP）

常见内核镜像：

- zImage
- Image
- uImage

典型流程：

```text
读取 kernel → 加载到指定内存地址 → 启动 kernel
```

常用命令示例：

```bash
load mmc 0:1 0x80000000 zImage
bootz 0x80000000
```

### 3.7.2 加载 Device Tree（设备树）

设备树用于 **描述硬件信息**，例如：

- CPU
- 内存
- 外设
- 中断

U-Boot 会加载 .dtb 文件到内存，然后在启动内核时 **将 dtb 地址传递给 Linux**。

示例：

```bash
load mmc 0:1 0x83000000 xxx.dtb
bootz 0x80000000 - 0x83000000
```

### 3.7.3 指定 rootfs（根文件系统）

U-Boot **不会直接加载 rootfs**，而是通过 **bootargs 向 Linux 内核传递 rootfs 信息**。

例如：

```bash
setenv bootargs console=ttyS0 root=/dev/mmcblk0p2 rw
```

Linux 内核启动后会根据 root= 参数挂载 root 文件系统。

常见 rootfs 类型：

- ext4（SD / eMMC）
- squashfs
- NFS（网络文件系统）

### 3.7.4 启动内核

当 kernel 和 dtb 加载完成后，U-Boot 通过启动命令进入 Linux：

常见命令：

- bootz：启动 zImage
- bootm：启动 uImage
- booti：启动 Image（ARM64）

示例：

```bash
bootz kernel_addr - fdt_addr
```

### 3.7.5 面试回答

> U-Boot 会先从 Flash、SD 卡或网络加载 Linux 内核镜像到内存，同时加载设备树 dtb 文件，并在启动内核时将 dtb 地址传递给 Linux。rootfs 一般不会由 U-Boot 加载，而是通过 bootargs 向内核传递 root 文件系统的位置，Linux 内核启动后再完成 rootfs 的挂载。

---

## 3.8 什么是 RootFS（根文件系统）？Linux 系统为什么必须要有 RootFS？

### 3.8.1 RootFS 的概念

**RootFS（Root File System，根文件系统）**是 Linux 启动后挂载的 **第一个文件系统**，也是整个文件系统的根目录 /。

它包含系统运行所需的 **基本目录、程序和库文件**。

常见目录结构：

```text
/
├── bin
├── sbin
├── lib
├── etc
├── dev
├── proc
├── sys
├── usr
└── tmp
```

### 3.8.2 RootFS 的主要内容

RootFS 通常包括：

1. **系统基本命令**

例如：

```text
/bin
/sbin
```

常见程序：ls、cp、mount 等。

2. **系统配置文件**

    ```text
    /etc
    ```

例如：

- 网络配置
- 启动脚本
3. **动态库**

    ```text
    /lib
    /lib64
    ```

提供程序运行所需的共享库。

4. **设备文件**

    ```text
    /dev
    ```

用于访问硬件设备。

5. **虚拟文件系统**

    ```text
    /proc
    /sys
    ```

用于提供内核信息。

### 3.8.3 为什么 Linux 必须要有 RootFS

Linux 内核启动完成后需要 **启动用户空间程序**，而这些程序必须存放在文件系统中。

RootFS 的作用：

1. **提供用户空间环境**

Linux 内核启动后会执行：

```text
/init
或
/sbin/init
```

这些程序位于 RootFS 中。

2. **提供系统命令和工具**

例如：

- shell
- 文件操作命令
- 系统管理工具
3. **提供系统配置和库文件**

程序运行需要：

- 配置文件
- 动态链接库

这些都在 RootFS 中。

如果没有 RootFS，Linux 内核虽然启动，但 **无法进入用户空间运行程序**。

### 3.8.4 常见 RootFS 类型

嵌入式系统常见 RootFS：

- **ext4**（SD / eMMC）
- **squashfs**（只读文件系统）
- **ramfs / initramfs**（内存文件系统）
- **NFS**（网络文件系统）

### 3.8.5 面试回答

> RootFS 是 Linux 系统启动后挂载的第一个文件系统，也是整个文件系统的根目录 /，其中包含系统命令、配置文件、动态库以及用户空间程序。Linux 内核启动后需要从 RootFS 中启动 init 进程并运行用户程序，因此没有 RootFS 系统就无法进入用户空间正常运行。

---

## 3.9 /init 或 /sbin/init 在系统启动中有什么作用？

### 3.9.1 基本概念

- **/init 或 /sbin/init** 是 **Linux 系统用户空间的第一个进程**（PID=1）
- 由内核启动后从 RootFS 中加载并执行
- 负责 **初始化用户空间环境**，启动系统的其余服务和应用程序

### 3.9.2 主要作用

1. **启动系统服务**

    - 读取启动配置文件（如 /etc/inittab、systemd 配置）
    - 按顺序启动守护进程、后台服务和网络服务

2. **管理系统运行级别 / Target**

    - 决定系统进入 **多用户模式**、**图形界面模式** 或 **救援模式**

3. **管理子进程**

    - 启动后会生成和监控其他进程
    - 子进程退出时，init 会回收资源，防止僵尸进程

4. **系统关机和重启**

    - 接收到关机或重启命令时，init 会按序停止服务并安全关机

### 3.9.3 面试回答

如果面试问：

/init 或 /sbin/init 在系统启动中有什么作用？

可以回答：

> /init 或 /sbin/init 是 Linux 用户空间的第一个进程（PID=1），由内核启动后执行。它负责初始化用户空间环境、启动系统服务、管理子进程，并处理系统关机或重启，是系统正常运行的核心用户空间进程。

---

## 3.10 不同 RootFS 文件系统的使用场景是什么？

### 3.10.1 ext4

- **类型**：通用可读写文件系统
- **使用场景**：
    - SD 卡、eMMC、NAND Flash 上的可读写系统
    - 支持日志，数据安全性高
- **优点**：成熟稳定，支持大文件、权限和日志
- **缺点**：Flash 写入次数有限，需要 Wear Leveling

### 3.10.2 squashfs

- **类型**：只读压缩文件系统
- **使用场景**：
    - 嵌入式只读系统
    - 系统镜像压缩，节省存储空间
- **优点**：只读、压缩率高、节省空间
- **缺点**：不能直接写入，需要 overlayfs 或 tmpfs 扩展写操作

### 3.10.3 ramfs / initramfs

- **类型**：内存文件系统（RAM）
- **使用场景**：
    - 系统启动早期挂载的临时文件系统
    - 用于加载内核模块或启动 init
- **优点**：速度快，完全驻内存
- **缺点**：掉电丢失，内存占用大

### 3.10.4 NFS（Network File System）

- **类型**：网络文件系统
- **使用场景**：
    - 无存储或开发调试环境
    - Linux 内核通过网络挂载 RootFS
- **优点**：便于远程调试和更新
- **缺点**：依赖网络，性能受网络影响

### 3.10.5 面试回答

> 常见 RootFS 文件系统有：
> - ext4：可读写系统，适用于 SD 卡或 Flash；
> - squashfs：只读压缩系统，节省存储空间；
> - ramfs / initramfs：内存文件系统，用于启动早期临时环境；
> - NFS：网络文件系统，适合无存储设备或调试开发。不同文件系统选择依据系统存储、读写需求和性能要求。

---

## 3.11 initramfs 和 initrd 有什么区别

### 3.11.1 基本概念

- **initrd（Initial RAM Disk）**
    - 早期的内核启动机制
    - 是一个 **压缩的临时根文件系统镜像**，挂载在内存作为临时 RootFS
    - 启动后通常会解压到 **RAM 磁盘（ramdisk）**
- **initramfs（Initial RAM Filesystem）**
    - Linux 2.6 及以后使用的新机制
    - 是一个 **CPIO 格式的压缩文件系统**，直接解压到内存
    - 不依赖块设备，也不需要单独的挂载过程
    - 启动后直接作为临时根文件系统，可由内核移交给真正的 RootFS

### 3.11.2 区别对比

### 3.11.3 面试回答

> initrd 是早期的临时根文件系统，需要挂载为块设备的 ramdisk；initramfs 是现代 Linux 的临时根文件系统，直接解压到内存，无需挂载，内核启动更快、更灵活。

---

## 3.12 Bootloader 如何指定 rootfs 的位置？

### 3.12.1 基本原理

Bootloader 并不会直接加载 rootfs，而是通过 **向 Linux 内核传递启动参数（bootargs）** 来指定 rootfs 的位置。内核启动后根据这些参数挂载根文件系统。

### 3.12.2 常见方式

1. **存储设备上的 rootfs**

    ```text
    setenv bootargs console=ttyS0 root=/dev/mmcblk0p2 rw
    ```

    - root= 指定 rootfs 分区
    - rw 表示可读写挂载

2. **网络文件系统（NFS）**

    ```text
    setenv bootargs console=ttyS0 root=/dev/nfs nfsroot=192.168.1.100:/nfsroot,tcp
    ```

    - root=/dev/nfs 指定内核通过网络挂载 rootfs
    - nfsroot= 指定 NFS 服务器路径和挂载选项

3. **内存文件系统（initramfs / ramfs）**

    - Bootloader 可以将内存文件系统镜像加载到内存，然后通过内核参数指定内核使用：

    ```text
    bootz kernel_addr - initramfs_addr
    ```

    - 此时内核会将 initramfs 解压到内存作为临时 RootFS

### 3.12.3 面试回答

> Bootloader 通过 bootargs 向 Linux 内核传递 rootfs 信息。对于存储设备上的 rootfs，使用 root=/dev/... 指定分区；对于网络文件系统，使用 root=/dev/nfs nfsroot=IP:/path；对于内存文件系统，则将 initramfs 加载到内存并在启动内核时传递地址。内核根据这些参数挂载根文件系统。

---

## 3.13 Kernel 挂载 RootFS 失败可能有哪些原因？

### 3.13.1 启动参数错误

- bootargs 中 root= 指定错误分区或路径
- rootfstype= 指定的文件系统类型与实际 RootFS 类型不匹配

示例：

```text
setenv bootargs console=ttyS0 root=/dev/mmcblk0p3 rw
```

- 如果分区号错误或不存在，内核无法挂载

### 3.13.2 驱动缺失

- 内核没有编译对应 **存储设备驱动** 或 **文件系统驱动**
- 例如使用 SD 卡 rootfs，但内核未包含 SD 控制器驱动
- 文件系统类型（ext4 / squashfs / NFS）对应驱动未启用

### 3.13.3 文件系统损坏或不可读

- RootFS 分区或镜像损坏
- 文件系统不完整或 CRC 错误
- 压缩文件系统（如 squashfs）加载失败

### 3.13.4 网络挂载失败（NFS）

- 网络不可达或 NFS 服务器未启动
- IP 配置错误（内核无法获取网络）
- NFS 路径不存在或权限不足

### 3.13.5 init/initramfs 问题

- /init 或 /sbin/init 缺失或权限错误
- initramfs 镜像未正确加载或损坏
- init 脚本错误导致系统无法进入用户空间

### 3.13.6 面试回答

> 挂载失败常见原因包括：bootargs 中 root 参数错误、内核缺少存储或文件系统驱动、RootFS 损坏、网络挂载（NFS）配置错误，以及 init 或 initramfs 镜像缺失或损坏。

---

## 3.14 如果 Bootloader 能启动但 Linux 内核无法启动，可能原因有哪些？

### 3.14.1 内核镜像加载错误

- Bootloader 指定的内核镜像地址或大小错误
- 内核镜像损坏或不完整
- 内核类型与平台不匹配（ARM32 vs ARM64）

### 3.14.2 内核启动参数错误

- bootargs 中 root=、rootfstype= 指定错误
- console 配置错误导致无法输出调试信息

### 3.14.3 内核缺少必要驱动

- 存储设备驱动缺失（SD 卡、eMMC、NAND）
- 文件系统驱动缺失（ext4、squashfs、NFS）
- CPU 或板级设备驱动未编译进内核

### 3.14.4 设备树（Device Tree）问题

- dtb 文件未加载或路径错误
- dtb 与内核不匹配
- dtb 描述的硬件信息不正确

### 3.14.5 init 或 RootFS 问题

- RootFS 分区或镜像损坏
- /init 或 /sbin/init 缺失或不可执行
- initramfs 加载错误或脚本错误

### 3.14.6 内核配置问题

- 内核配置错误导致启动异常
- 缺少必需的启动选项或内核功能

### 3.14.7 面试回答

> 常见原因包括：内核镜像加载错误或损坏，启动参数错误，必要驱动缺失，设备树不匹配，RootFS 或 init/initramfs 问题，以及内核配置不正确。

---

## 3.15 Bootloader 如何实现多系统启动？

### 3.15.1 基本原理

多系统启动（Multi-Boot）是指在同一硬件平台上，Bootloader 可以选择加载 **不同的操作系统或不同版本的内核**。核心思想是 **通过配置或用户选择，决定加载哪套内核和 RootFS**。

### 3.15.2 常见实现方式

1. **使用环境变量存储启动选项**

    - Bootloader（如 U-Boot）通过环境变量 bootcmd 或自定义变量选择系统

示例：

```text
setenv boot_os_a 'load mmc 0:1 0x80000000 zImage_a; load mmc 0:1 0x83000000 dtb_a; bootz 0x80000000 - 0x83000000'
setenv boot_os_b 'load mmc 0:2 0x80000000 zImage_b; load mmc 0:2 0x83000000 dtb_b; bootz 0x80000000 - 0x83000000'
```

- 通过 bootcmd=run boot_os_a 或 bootcmd=run boot_os_b 选择启动系统
2. **提供启动菜单交互**

    - Bootloader 提供 CLI 或菜单界面
    - 用户可通过按键选择启动哪套系统

示例：

```text
Hit any key to stop autoboot: 3
1. Linux A
2. Linux B
```

3. **通过分区或存储地址区分系统**

    - 每个操作系统占用不同分区或 Flash 区域
    - Bootloader 根据分区号加载对应内核和 RootFS

4. **支持网络多系统启动**

    - Bootloader 可通过 TFTP 下载不同系统镜像
    - 可动态选择启动系统

### 3.15.3 面试回答

> Bootloader 通过环境变量、启动菜单或分区信息选择加载不同内核和 RootFS，从而实现多系统启动。用户可以通过按键选择启动系统，或者自动根据配置启动特定内核。U-Boot 支持从不同分区、存储地址或网络下载不同系统镜像启动。

---

[[糯叽叽八股（完整版）|← 总索引]] · [[10 嵌入式Linux驱动|← 上一章：嵌入式 Linux 驱动]]
