---
title: "嵌入式 Linux 驱动"
tags: [嵌入式, 面试, 八股]
---

# 嵌入式 Linux 驱动

[[projects/嵌入式八股/index|← 总索引]] · [[09 嵌入式Linux应用|← 上一章：嵌入式 Linux 应用]] · [[11 Bootloader与Rootfs|下一章：Bootloader 与 Rootfs →]]

---

## 2.1 Linux 驱动程序与应用程序的区别

> [!tip] 🔗 项目关联
> - [[projects/嵌入式八股/1. 项目八股/Linux物理内存碎片高频面试题#第 15 题：Python 在这个项目里是不是核心采集层？exfrag.py 和 exfrag_user.py 分别负责什么？|内存项目 15：Python 在这个项目里是不是核心采集层？ex…]]

### 2.1.1 运行层级

- **驱动程序（Kernel Space）**
    - 运行在内核态（privileged mode）
    - 可以直接访问硬件寄存器、中断、内核数据结构
    - 一旦出错可能导致整个系统崩溃
- **应用程序（User Space）**
    - 运行在用户态（unprivileged mode）
    - 不能直接操作硬件，需要通过系统调用或驱动接口访问硬件
    - 出错一般只影响自身进程

### 2.1.2 接口与通信方式

- **驱动程序**
    - 提供接口给应用程序，如字符设备 /dev/...、ioctl、sysfs、netlink
    - 内核模块可注册文件操作结构 file_operations，提供 open/read/write/ioctl 等接口
- **应用程序**
    - 通过系统调用与驱动程序通信：open/read/write/ioctl/mmap
    - 可以使用标准库封装，例如 fopen/fread/fwrite

### 2.1.3 功能定位

- **驱动程序**：
    - 控制硬件设备，提供稳定接口
    - 实现中断处理、DMA、时序控制、缓存管理
    - 属于操作系统的一部分
- **应用程序**：
    - 完成具体业务逻辑，如数据处理、显示、网络通信
    - 调用驱动提供的接口完成硬件操作

### 2.1.4 总结

- 驱动程序在 **内核态**，直接操作硬件，功能底层
- 应用程序在 **用户态**，通过驱动访问硬件，实现业务逻辑
- 驱动程序错误可能导致系统崩溃，应用程序错误一般只影响自身
- 面试考点：**用户态 vs 内核态、权限差异、接口方式、功能定位**

---

## 2.2 内核模块（module）及加载/卸载

### 2.2.1 内核模块概念

- **定义**：内核模块（Kernel Module）是可以在 Linux 内核运行时动态加载或卸载的代码单元
- **特点**：
    - 可扩展内核功能，无需重启系统
    - 可实现设备驱动、文件系统、网络协议等
    - 运行在 **内核态**，拥有完全权限
- **模块类型**：
  a. **驱动模块**（Device Driver Module）
  b. **文件系统模块**（Filesystem Module）
  c. **网络协议模块**（Network Module）
  d. **其他功能模块**

### 2.2.2 内核模块编写基本结构

```c
#include <linux/module.h>
#include <linux/kernel.h>

static int __init my_module_init(void) {
    printk(KERN_INFO "Module loaded\n");
    return 0;
}

static void __exit my_module_exit(void) {
    printk(KERN_INFO "Module unloaded\n");
}

module_init(my_module_init);
module_exit(my_module_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Author");
MODULE_DESCRIPTION("Simple Kernel Module Example");
```

- __init：模块加载时执行的初始化函数
- __exit：模块卸载时执行的清理函数
- MODULE_*：模块元信息

### 2.2.3 模块加载（insmod / modprobe）

1. **insmod**：直接加载 .ko 文件

    ```bash
    sudo insmod my_module.ko
    ```

    - **特点**：简单，依赖关系需手动处理

2. **modprobe**：通过内核模块路径自动处理依赖

    ```bash
    sudo modprobe my_module
    ```

    - **特点**：会自动加载模块依赖，推荐使用

3. **查看已加载模块**

    ```bash
    lsmod        # 列出所有加载的模块
    modinfo my_module.ko  # 查看模块信息
    ```

### 2.2.4 模块卸载（rmmod / modprobe -r）

1. **rmmod**：直接卸载模块

    ```bash
    sudo rmmod my_module
    ```

2. **modprobe -r**：卸载模块并处理依赖

    ```bash
    sudo modprobe -r my_module
    ```

3. **注意事项**：

    - 模块卸载前确保没有被使用（如设备正在使用）
    - 内核会检查引用计数，避免卸载正在使用的模块

### 2.2.5 总结

- 内核模块是可动态加载的内核扩展，运行在内核态
- **加载**：insmod / modprobe
- **卸载**：rmmod / modprobe -r

---

## 2.3 init_module() / cleanup_module() 或 module_init() / module_exit() 的作用

在 Linux 内核模块中，这些函数用于**定义模块的加载和卸载行为**。

### 2.3.1 init_module() / cleanup_module()

- **定义**：最早的内核模块接口
- **作用**：
    - init_module()：模块被 insmod 或 modprobe 加载时调用，负责初始化模块
    - cleanup_module()：模块被 rmmod 或 modprobe -r 卸载时调用，负责清理资源
- **限制**：直接定义 init_module() / cleanup_module() 会与内核符号绑定，缺乏灵活性

**示例**：

```c
    return 0;
}

void cleanup_module(void) {
    printk(KERN_INFO "Module unloaded\n");
}
```

### 2.3.2 module_init() / module_exit()

- **定义**：宏方式封装 init/exit 函数，现代模块推荐使用
- **作用**：
    - module_init(func)：注册模块初始化函数 func
    - module_exit(func)：注册模块退出函数 func
- **优点**：
    - 可以自定义函数名（不局限于 init_module / cleanup_module）
    - 内核更灵活，兼容多版本
    - 与 __init / __exit 注解结合，可优化内核内存

**示例**：

```c
#include <linux/module.h>
#include <linux/kernel.h>

static int __init my_init(void) {
    printk(KERN_INFO "Module loaded\n");
    return 0;
}

static void __exit my_exit(void) {
    printk(KERN_INFO "Module unloaded\n");
}

module_init(my_init);
module_exit(my_exit);

MODULE_LICENSE("GPL");
```

### 2.3.3 区别总结

| 项目 | `init_module()` / `cleanup_module()` | `module_init()` / `module_exit()` |
|---|---|---|
| 形式 | 约定的旧式入口/退出函数名 | 宏注册自定义的初始化/退出函数 |
| 可读性 | 函数名固定，模块间容易冲突 | 函数名可按模块语义命名 |
| 内核处理 | 由模块装载流程查找入口 | 宏根据编译配置放入相应 init/exit 段 |
| 内存优化 | 不能直接表达函数属性 | 可配合 `__init`、`__exit` 回收或标记代码 |
| 推荐方式 | 适合理解历史接口 | 现代 Linux 模块通常使用 |

需要区分用户空间同名系统调用和内核模块入口：现代内核的模块源码通常写普通函数，再通过 `module_init()`/`module_exit()` 注册；模块装载工具负责把模块映射进内核并触发入口。

### 2.3.4 总结

- **作用**：定义模块加载和卸载行为
- **旧接口**：init_module() / cleanup_module()
- **现代接口**：module_init() / module_exit() + 自定义函数
- 面试常考点：**初始化/退出流程、内核内存优化、模块可维护性**

---

## 2.4 内核模块与用户态程序交互

### 2.4.1 符设备接口（/dev）

- **概念**：内核模块注册一个字符设备，用户程序通过 /dev/... 文件访问
- **实现步骤**：
  a. 内核模块注册字符设备号
  b. 实现 file_operations 结构（open/read/write/ioctl）
  c. 用户程序使用 open/read/write/ioctl 与设备交互
- **示例（内核模块）**：

```c
static ssize_t my_read(struct file *filp, char __user *buf, size_t count, loff_t *f_pos) {
    char data[] = "Hello from kernel\n";
    size_t n = min(count, sizeof(data) - 1);
    if (copy_to_user(buf, data, n))
        return -EFAULT;
    return n;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .read = my_read,
};

int major = register_chrdev(0, "my_device", &fops);
```

- **用户程序（省略错误处理的最小示例）**：

```c
int fd = open("/dev/my_device", O_RDONLY);
char buf[64] = {0};
ssize_t n = read(fd, buf, sizeof(buf) - 1);
if (n > 0) {
    buf[n] = '\0';
    printf("%s", buf);
}
close(fd);
```

### 2.4.2 ioctl（控制接口）

- **概念**：提供命令控制接口，用户程序可发送自定义命令给内核模块
- **使用场景**：配置寄存器、启动/停止硬件操作
- **示例**：

```c
// 内核模块
long my_ioctl(struct file *filp, unsigned int cmd, unsigned long arg) {
    switch(cmd) {
        case CMD_START:
            // 启动硬件
            break;
    }
    return 0;
}
```

### 2.4.3 sysfs / procfs

- **sysfs**：内核对象属性接口，模块可在 /sys/class/... 下创建属性文件
    - 用户态可通过 cat/echo 访问
- **procfs**：内核信息接口，模块可在 /proc 下创建文件
- **特点**：易于调试和配置，适合少量数据交换
- **示例**：

```c
// 创建 sysfs 属性
struct kobject *kobj = kobject_create_and_add("my_kobj", kernel_kobj);
sysfs_create_file(kobj, &attr.attr);
```

### 2.4.4 Netlink Socket

- **概念**：内核和用户态通过 netlink 套接字通信
- **特点**：适合频繁或复杂数据交换
- **使用场景**：网络驱动、事件通知、状态回报

### 2.4.5 mmap 映射

- **概念**：驱动把经过验证的设备/缓冲区页映射到用户空间，用户程序访问映射区；并不是把任意内核虚拟地址直接暴露出去
- **特点**：可减少数据搬运，适合大数据传输或帧缓冲；DMA 缓冲区还要按平台使用相应的 DMA 映射接口并处理缓存一致性

### 2.4.6 总结

- **设计原则**：
    - 小量控制数据 → ioctl / sysfs
    - 大量数据 → mmap / netlink
    - 高可靠异步通知 → netlink

---

## 2.5 Linux 驱动开发中常用的头文件

- 内核模块基础：module.h / kernel.h / init.h
- 内存分配：slab.h
- 设备驱动接口：fs.h / cdev.h / uaccess.h
- 中断与同步：interrupt.h / spinlock.h / mutex.h / semaphore.h
- 定时与延时：timer.h / hrtimer.h / jiffies.h / delay.h
- 总线与外设：i2c.h / spi.h / gpio.h / serial_core.h
- 高级功能：kthread.h / poll.h / sched.h

这些头文件几乎涵盖了 **Linux 内核驱动开发常用功能**，面试和开发中需要熟悉对应接口。

---

## 2.6 为什么内核模块不能直接使用标准 C 库函数

### 2.6.1 用户态 vs 内核态

- **内核模块运行在内核态（Kernel Space）**
- **标准 C 库函数运行在用户态（User Space）**
    - 例如 printf(), malloc() 等依赖系统调用和用户态运行时环境
    - 内核没有用户态运行环境，也无法依赖用户空间库

### 2.6.2 内存与地址空间限制

- 内核态和用户态有不同的虚拟地址空间
- 标准 C 库函数操作的用户空间内存、文件描述符等在内核态不可直接访问
- 内核有自己的一套内存分配（kmalloc/kfree）和 I/O 接口（printk、copy_to_user）

### 2.6.3 不可阻塞与安全要求

- 内核代码必须遵守实时性和安全性约束
- 标准 C 库可能调用阻塞系统调用（如 malloc 可能触发页错误）
- 内核态不能被阻塞或触发页错误

### 2.6.4 总结

- 内核模块不能直接使用标准 C 库函数，因为：
  a. 内核态没有用户态运行环境
  b. 地址空间和内存模型不同
  c. libc 依赖阻塞系统调用，不符合内核安全性
- 内核提供了专用 API 替代用户态 libc 功能
- 面试考点：**用户态与内核态区别、内存管理、安全性、替代函数**

---

## 2.7 字符设备的基本操作接口

在 Linux 驱动开发中，字符设备（Character Device）提供**文件操作接口**给用户态程序访问。核心是 file_operations 结构体。

### 2.7.1 file_operations 示例

```c
    .open = my_open,
    .release = my_release,
    .read = my_read,
    .write = my_write,
};
```

### 2.7.2 总结

- **open/release**：设备文件打开/关闭
- **read/write**：数据传输
- **ioctl/mmap/poll**：高级功能
- **file_operations**：核心结构体，将函数注册到内核，让用户态通过 /dev/... 调用

面试常考点：**file_operations 作用、read/write 与用户态交互、ioctl 的使用场景**

---

## 2.8 字符设备驱动中 open、read、write、close 的实现

在 Linux 字符设备驱动中，open/read/write/release(close) 是最基础的接口，由 file_operations 结构体注册，用户态程序通过 /dev/... 调用。

### 2.8.1 open

- **调用时机**：用户程序调用 open("/dev/mydev", O_RDWR)
- **作用**：初始化设备状态，分配资源
- **注意事项**：
    - 可统计引用计数，避免重复打开
    - 可保存 file->private_data 指针，供后续 read/write 使用

```c
static int my_open(struct inode *inode, struct file *file) {
    printk(KERN_INFO "Device opened\n");
    file->private_data = kmalloc(64, GFP_KERNEL); // 为每个文件描述符分配缓冲区
    if (!file->private_data) return -ENOMEM;
    return 0;
}
```

### 2.8.2 read

- **调用时机**：用户程序调用 read(fd, buf, size)
- **作用**：将设备数据拷贝到用户空间
- **注意事项**：
    - 使用 copy_to_user，内核空间不能直接访问用户空间
    - 返回值是实际读取的字节数
    - 可支持阻塞/非阻塞读

```c
static ssize_t my_read(struct file *file, char __user *buf, size_t len, loff_t *offset) {
    char *kbuf = file->private_data;
    size_t to_copy = min(len, strlen(kbuf));
    if (copy_to_user(buf, kbuf, to_copy)) return -EFAULT;
    return to_copy;
}
```

### 2.8.3 write

- **调用时机**：用户程序调用 write(fd, buf, size)
- **作用**：将用户数据写入设备
- **注意事项**：
    - 使用 copy_from_user
    - 可进行数据处理或传给硬件
    - 返回值是实际写入的字节数

```c
static ssize_t my_write(struct file *file, const char __user *buf, size_t len, loff_t *offset) {
    char *kbuf = file->private_data;
    size_t to_copy = min(len, (size_t)63); // 为日志字符串预留 '\0'
    if (copy_from_user(kbuf, buf, to_copy)) return -EFAULT;
    kbuf[to_copy] = '\0';
    printk(KERN_INFO "User wrote: %s\n", kbuf);
    return to_copy;
}
```

### 2.8.4 release / close

- **调用时机**：用户程序调用 close(fd)
- **作用**：释放设备资源
- **注意事项**：
    - 与 open 成对出现
    - 释放 private_data 或其他动态分配资源

```c
static int my_release(struct inode *inode, struct file *file) {
    printk(KERN_INFO "Device closed\n");
    kfree(file->private_data);
    return 0;
}
```

### 2.8.5 file_operations 注册

```c
static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = my_open,
    .release = my_release,
    .read = my_read,
    .write = my_write,
};
```

### 2.8.6 总结

- **open**：打开设备，分配资源，保存 private_data
- **read**：内核空间 → 用户空间，copy_to_user
- **write**：用户空间 → 内核空间，copy_from_user
- **close/release**：释放资源
- 面试重点：**用户态/内核态内存访问、private_data 使用、阻塞/非阻塞读写**

---

## 2.9 ioctl 在驱动中的作用

### 2.9.1 ioctl 的作用

1. **配置硬件或设备参数**
    - 比如设置波特率、启动/停止设备、调整采样频率等
    - 适合小量控制数据
2. **扩展设备功能**
    - read/write 主要传输数据，ioctl 可以实现自定义命令
    - 可支持多种操作，而不改变文件接口
3. **实现用户态与内核态的通信**
    - 用户态通过 ioctl(fd, CMD, arg) 发送命令
    - 内核模块解析命令并执行对应操作

### 2.9.2 ioctl 使用方法

**内核模块实现**

```c
#include <linux/fs.h>
#include <linux/uaccess.h>

#define CMD_START 1
#define CMD_STOP  2

static long my_ioctl(struct file *file, unsigned int cmd, unsigned long arg) {
    switch (cmd) {
        case CMD_START:
            printk(KERN_INFO "Device start\n");
            break;
        case CMD_STOP:
            printk(KERN_INFO "Device stop\n");
            break;
        default:
            return -EINVAL;
    }
    return 0;
}

static struct file_operations fops = {
    .owner = THIS_MODULE,
    .open = my_open,
    .release = my_release,
    .read = my_read,
    .write = my_write,
    .unlocked_ioctl = my_ioctl,
};
```

**用户程序调用**

```c
int fd = open("/dev/my_device", O_RDWR);
ioctl(fd, CMD_START, 0);  // 发送启动命令
ioctl(fd, CMD_STOP, 0);   // 发送停止命令
close(fd);
```

- 内核中 unlocked_ioctl 是现代接口，替代旧的 ioctl
- arg 参数可传递数值或用户空间指针，需要使用 copy_from_user/copy_to_user

### 2.9.3 使用场景

- 配置寄存器或硬件状态
- 启动/停止采样、DMA
- 控制驱动内部状态
- 高级功能扩展，而不改变文件接口

### 2.9.4 总结

- ioctl 是 **用户态向内核态发送控制命令的接口**
- 与 read/write 区别：read/write 传输数据，ioctl 传输控制命令
- 内核模块通过 unlocked_ioctl 解析命令执行操作
- 面试常考点：**用户态/内核态交互、控制命令设计、copy_from_user/copy_to_user 使用**

---

## 2.10 驱动中实现阻塞/非阻塞读写

### 2.10.1 阻塞读写

- **特点**：如果设备数据未准备好，读写调用会挂起，直到数据可用
- **实现方法**：使用 **等待队列（wait_queue_head_t）**

**例子：阻塞读**

```c
#include <linux/wait.h>
#include <linux/sched.h>

static DECLARE_WAIT_QUEUE_HEAD(my_wait_queue);
static int data_ready = 0;
static char device_data[64];

static ssize_t my_read(struct file *file, char __user *buf, size_t len, loff_t *offset) {
    // 阻塞直到数据就绪
    wait_event_interruptible(my_wait_queue, data_ready != 0);

    size_t n = min(len, sizeof(device_data));
    if (copy_to_user(buf, device_data, n)) return -EFAULT;
    data_ready = 0;  // 清标志（真实驱动还需锁保护）
    return n;
}

// 在数据准备好时唤醒等待队列
void data_produce(char *data) {
    size_t n = strnlen(data, sizeof(device_data));
    memcpy(device_data, data, n);
    if (n < sizeof(device_data))
        device_data[n] = '\0';
    data_ready = 1;
    wake_up_interruptible(&my_wait_queue);
}
```

- **wait_event_interruptible**：阻塞当前进程直到条件成立或收到信号

### 2.10.2 非阻塞读写

- **特点**：如果数据未就绪，立即返回，不挂起用户进程
- **实现方法**：检查 O_NONBLOCK 标志，并返回 -EAGAIN 或 -EWOULDBLOCK

**例子：非阻塞读**

```c
static ssize_t my_read(struct file *file, char __user *buf, size_t len, loff_t *offset) {
    if (file->f_flags & O_NONBLOCK) {
        if (data_ready == 0) return -EAGAIN; // 数据未准备好
    } else {
        wait_event_interruptible(my_wait_queue, data_ready != 0);
    }

    size_t n = min(len, sizeof(device_data));
    if (copy_to_user(buf, device_data, n)) return -EFAULT;
    data_ready = 0;
    return n;
}
```

- 用户程序调用示例：

```c
int fd = open("/dev/my_device", O_RDONLY | O_NONBLOCK);
read(fd, buf, sizeof(buf));  // 若无数据立即返回 -1, errno=EAGAIN
```

### 2.10.3 select/poll 支持

- 驱动可以实现 poll 方法，使用户程序通过 select/poll/epoll 判断是否可读/可写
- 避免轮询 CPU 占用

```c
static unsigned int my_poll(struct file *file, struct poll_table_struct *wait) {
    poll_wait(file, &my_wait_queue, wait);
    if (data_ready) return POLLIN | POLLRDNORM;
    return 0;
}
```

上面是教学简化示例；真实驱动要用锁、原子/`READ_ONCE` 等方式保护 `data_ready` 和数据缓冲，并正确处理 `wait_event_interruptible()` 的返回值、短读和并发读者。

### 2.10.4 总结

- **阻塞读写**：进程挂起，使用等待队列 wait_queue_head_t
- **非阻塞读写**：立即返回 -EAGAIN，通过 O_NONBLOCK 判断
- **select/poll**：结合等待队列，支持多路复用
- 面试常考点：**等待队列机制、阻塞与非阻塞区别、poll/select 支持**

---

## 2.11 中断在驱动中的注册和使用

### 2.11.1 中断基本概念

- **中断向量（IRQ number）**：硬件事件对应的编号
- **中断处理函数（ISR）**：中断发生时由内核调用的函数
- **中断触发类型**：电平触发（Level）或边沿触发（Edge）

### 2.11.2 注册中断

使用 request_irq() 注册中断处理函数。

```c
#include <linux/interrupt.h>
#include <linux/gpio.h>

#define IRQ_NUM 17  // 假设 GPIO 中断号

static irqreturn_t my_irq_handler(int irq, void *dev_id) {
    printk(KERN_INFO "Interrupt occurred!\n");
    return IRQ_HANDLED;  // IRQ_HANDLED 表示中断已处理
}

static int __init my_module_init(void) {
    int ret;
    ret = request_irq(IRQ_NUM,           // 中断号
                      my_irq_handler,    // 中断处理函数
                      IRQF_TRIGGER_RISING, // 触发方式：上升沿
                      "my_irq_dev",      // 设备名
                      NULL);             // 未使用 IRQF_SHARED 时可为 NULL；共享中断必须传稳定的非 NULL 标识
    if (ret) {
        printk(KERN_ERR "Failed to request IRQ\n");
        return ret;
    }
    printk(KERN_INFO "IRQ registered\n");
    return 0;
}
```

### 2.11.3 中断处理函数特点

1. **快速执行**：ISR 不能做耗时操作
2. **不可阻塞**：不能调用可能睡眠的函数（如 msleep、wait_event）
3. **共享中断**：多个设备可共享一个 IRQ，通过 dev_id 区分

### 2.11.4 中断处理后的任务延迟处理

- **Bottom half / 延迟处理机制**
    - **Tasklet**：轻量级，软中断上下文；在较新的内核开发中应结合版本/维护策略评估，很多场景优先使用线程化中断或 workqueue
    - **Workqueue**：可在进程上下文运行，允许睡眠

```c
#include <linux/workqueue.h>

static void my_work_func(struct work_struct *work);
static DECLARE_WORK(my_work, my_work_func);

static irqreturn_t my_irq_handler(int irq, void *dev_id) {
    schedule_work(&my_work);  // 将任务放入 workqueue 延迟处理
    return IRQ_HANDLED;
}

static void my_work_func(struct work_struct *work) {
    printk(KERN_INFO "Handling work in process context\n");
}
```

### 2.11.5 注销中断

模块卸载时必须释放中断：

```c
static void __exit my_module_exit(void) {
    free_irq(IRQ_NUM, NULL);
    printk(KERN_INFO "IRQ freed\n");
}
```

### 2.11.6 总结

- **注册中断**：request_irq()
- **处理函数**：快速执行、不可阻塞
- **延迟处理**：Tasklet / Workqueue
- **注销中断**：free_irq()
- 面试常考点：**ISR 特性、触发方式、共享中断、延迟处理机制**

---

## 2.12 request_irq() 作用及 ISR 中可做的操作

### 2.12.1 request_irq() 的作用

- **功能**：向内核注册一个中断处理函数（ISR），让指定 IRQ 号的中断触发时调用该函数
- **函数原型**：

```c
int request_irq(unsigned int irq,            // 中断号
                irq_handler_t handler,      // 中断处理函数
                unsigned long flags,        // 触发方式、共享标志等
                const char *name,           // 设备名，用于 /proc/interrupts
                void *dev_id);              // 设备标识，用于共享中断
```

- **参数说明**：
  a. irq：硬件中断号
  b. handler：ISR 函数
  c. flags：中断类型（电平触发/边沿触发）及共享中断标志，如 IRQF_SHARED
  d. name：显示在 /proc/interrupts 的设备名
  e. dev_id：设备标识，尤其在共享中断时区分设备
- **返回值**：
    - 0：成功
    - <0：失败

### 2.12.2 ISR（中断服务例程）特点

- **运行在中断上下文**；传统 hard IRQ 顶半部通常在本 CPU 屏蔽可嵌套中断后执行，但线程化中断、NMI 和具体架构路径不同，不能把所有 ISR 都概括成同一种屏蔽状态
- **必须快速执行**，不允许耗时操作
- **不能阻塞或睡眠**，不能调用可能睡眠的函数（如 msleep()、wait_event()）
- **可访问硬件寄存器、读取数据**，然后通过 **底半部（bottom half）延迟处理**

### 2.12.3 ISR 中可以做的操作

1. **读取/写入硬件寄存器**
    - 获取中断原因
    - 清除中断标志

    ```c
    status = readl(dev->reg_base + REG_STATUS);
    writel(CLEAR_FLAG, dev->reg_base + REG_STATUS);
    ```

2. **保存数据到内核缓冲区**
    - 将采集到的数据写入环形缓冲区或队列
3. **通知下层或用户态**
    - 使用 **queue_work()** 或 **tasklet_schedule()** 做延迟处理
4. **统计或记录事件**
    - 计数器累加、简单日志打印（printk）

### 2.12.4 ISR 中禁止的操作

- 不能调用可能阻塞的函数
- 不能进行大量计算或耗时操作
- 不能进行用户态访问（如 copy_to_user）

### 2.12.5 总结

- **request_irq()**：注册 ISR，使指定 IRQ 触发时调用
- **ISR**：快速执行、处理硬件事件、保存数据、唤醒进程或调度底半部
- **禁止操作**：阻塞、耗时操作、直接用户态访问
- 面试常考点：**中断上下文特点、ISR 能做什么、不能做什么、底半部机制**

---

## 2.13 kmalloc、vmalloc 区别及 GFP 标志用法

### 2.13.1 kmalloc 与 vmalloc 区别

**示例：**

```c
// kmalloc
char *buf = kmalloc(1024, GFP_KERNEL);
if (!buf) return -ENOMEM;
kfree(buf);

// vmalloc
char *bigbuf = vmalloc(2*1024*1024); // 2MB
if (!bigbuf) return -ENOMEM;
vfree(bigbuf);
```

### 2.13.2 GFP 标志用法

- **GFP = Get Free Page**，用于控制内存分配行为

**注意事项：**

- **进程上下文** → 使用 GFP_KERNEL 安全
- **中断上下文或持有自旋锁等原子上下文** → 不能睡眠，通常使用 GFP_ATOMIC 或端口允许的等价标志；具体以调用上下文和内核 API 要求为准
- 大块分配且连续物理内存不足 → 考虑 vmalloc

### 2.13.3 总结

- **kmalloc**：分配物理连续的小块内存；若用于 DMA 仍应优先使用 DMA API（如 `dma_alloc_coherent()` 或 `dma_map_single()`），不能仅凭物理连续就直接交给设备
- **vmalloc**：分配大块虚拟连续内存，物理可能不连续，效率稍低
- **GFP_KERNEL**：可阻塞分配，常规使用
- **GFP_ATOMIC**：不可阻塞，适合中断上下文或自旋锁保护场景
- 面试常考点：**连续性、分配大小、上下文安全性、GFP 标志使用**

---

## 2.14 用户态如何通过 mmap 或 read/write 与驱动交互？

### 2.14.1 通过 read/write 交互

- **原理**：驱动实现 file_operations 中的 read/write 函数
- **特点**：
    - 适合小块、频率不高的数据传输
    - 内核使用 copy_to_user / copy_from_user 将数据在用户态与内核态之间拷贝

**内核驱动示例**

```c
static ssize_t my_read(struct file *file, char __user *buf, size_t len, loff_t *offset) {
    char kbuf[] = "Hello from kernel";
    size_t n = min(len, sizeof(kbuf) - 1);
    if (copy_to_user(buf, kbuf, n))
        return -EFAULT;
    return n;
}

static ssize_t my_write(struct file *file, const char __user *buf, size_t len, loff_t *offset) {
    char kbuf[64];
    size_t n = min(len, sizeof(kbuf) - 1);
    if (copy_from_user(kbuf, buf, n)) return -EFAULT;
    kbuf[n] = '\0';
    printk(KERN_INFO "User wrote: %s\n", kbuf);
    return n;
}
```

**用户态示例**

```c
int fd = open("/dev/my_device", O_RDWR);
char buf[64] = {0};
ssize_t n = read(fd, buf, sizeof(buf) - 1);
if (n > 0) {
    buf[n] = '\0';
    printf("%s", buf);
}
write(fd, "hello", 5);
close(fd);
```

### 2.14.2 通过 mmap 交互

- **原理**：驱动在 file_operations 中实现 mmap，将内核缓冲区映射到用户空间
- **特点**：
    - 内核和用户共享同一块内存
    - 适合大数据量传输或 DMA 缓冲
    - 可减少 copy_to_user / copy_from_user 的数据搬运，但仍需处理页属性、DMA 缓存一致性和生命周期

**内核驱动示例**

```c
static int my_mmap(struct file *file, struct vm_area_struct *vma) {
    phys_addr_t phys = device_buffer_phys; /* 已由驱动验证的设备/DMA 物理地址 */
    size_t size = device_buffer_size;
    if (vma->vm_end - vma->vm_start > size)
        return -EINVAL;
    return remap_pfn_range(vma, vma->vm_start, phys >> PAGE_SHIFT,
                           vma->vm_end - vma->vm_start,
                           vma->vm_page_prot);
}

static struct file_operations fops = {
    .mmap = my_mmap,
    .read = my_read,
    .write = my_write,
};
```

**用户态示例**

```c
int fd = open("/dev/my_device", O_RDWR);
char *addr = mmap(NULL, BUF_SIZE, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
if (addr == MAP_FAILED) {
    perror("mmap");
    close(fd);
    return -1;
}

// 直接读写映射区
snprintf(addr, BUF_SIZE, "%s", "Hello via mmap");
printf("%s\n", addr);

munmap(addr, BUF_SIZE);
close(fd);
```

### 2.14.3 read/write 与 mmap 区别

| 维度 | `read()`/`write()` | `mmap()` |
|---|---|---|
| 数据路径 | 驱动在系统调用中通过 `copy_to_user()`/`copy_from_user()` 搬运数据 | 建立用户虚拟地址到设备/内核页的映射，之后由用户直接访问映射区 |
| 适合数据 | 小块控制数据、简单字符设备接口 | 大块缓冲、帧缓存、环形队列等 |
| 同步方式 | 每次系统调用可作为一次同步点 | 需要显式设计生产者/消费者、缓存一致性和可见性协议 |
| 安全边界 | 驱动控制长度并检查用户指针 | 映射权限、范围和生命周期必须严格限制 |
| 拷贝与性能 | 可能有一次或多次用户/内核拷贝 | 可减少拷贝，但不一定完全零拷贝 |
| 失败风险 | 长度、阻塞、短读短写和信号中断 | 页属性、DMA 一致性、失效映射和越界访问 |

`mmap()` 不是自动的“零拷贝”：如果底层 DMA、缓存或设备内存仍需同步，仍会有映射和缓存维护成本。驱动必须校验 `vma` 范围，不能把任意内核虚拟地址直接暴露给用户。

对于由 DMA API 分配的缓冲区，实际驱动通常应优先采用平台提供的 `dma_mmap_*()` 辅助接口；只有在明确掌握物理页、缓存属性和生命周期时才直接使用 `remap_pfn_range()`。

### 2.14.4 总结

- **read/write**：适合小数据量、简单交互
- **mmap**：适合大数据量、减少拷贝的高吞吐场景；是否达到零拷贝取决于缓冲区、DMA 和缓存一致性设计
- 驱动实现方式：file_operations 中实现对应函数
- 面试常考点：**用户态/内核态数据交换、零拷贝、mmap remap 机制**

---

## 2.15 ioremap() 的作用及使用

在 Linux 驱动开发中，ioremap() 是处理物理地址映射到内核虚拟地址的常用接口，尤其用于访问外设寄存器。

### 2.15.1 ioremap() 的作用

- **功能**：将 **物理地址的外设寄存器或内存区域** 映射到 **内核虚拟地址**
- **原因**：内核不能直接访问任意物理地址，需要通过虚拟地址访问
- **返回值**：内核虚拟地址指针，可用 readl/writel 访问寄存器

**示例：**

```c
void __iomem *base = ioremap(PHYS_BASE, REG_SIZE);
if (!base)
    return -ENOMEM;

writel(CTRL_ENABLE, base + CTRL_OFFSET);
u32 status = readl(base + STATUS_OFFSET);

iounmap(base);
```

### 2.15.2 ioremap 使用场景

1. **访问 MMIO（Memory-Mapped I/O）寄存器**
    - 外设寄存器通常映射到物理地址空间
    - CPU 无法直接用普通指针访问，需要通过 ioremap()
2. **非连续或高端物理内存映射**
    - DMA 或外设寄存器通常不在常规内核线性映射区域
3. **设备初始化和控制**
    - 初始化寄存器
    - 设置控制位
    - 读取状态寄存器

### 2.15.3 ioremap 与内核普通内存的区别

| 维度 | `ioremap()` 得到的 I/O 映射 | 内核普通内存 |
|---|---|---|
| 对象 | 外设 MMIO 寄存器或设备内存物理区域 | RAM 中的普通页、`kmalloc`/页分配器对象 |
| 访问方式 | 使用 `readb/readl`、`writeb/writel` 等 I/O accessor | 使用普通 C 指针或 `memcpy`，遵循普通内存语义 |
| 副作用 | 读写可能触发硬件动作，顺序和宽度有要求 | 读写主要改变内存内容 |
| 映射属性 | 由架构设置设备内存的缓存/顺序属性 | 由内核内存管理设置普通 RAM 属性 |
| 释放方式 | `iounmap()` | 按分配接口释放，如 `kfree()` 或 `free_pages()` |
| 常见错误 | 把 I/O 地址当普通指针、越界、错误访问宽度 | 使用后释放、越界、并发和生命周期错误 |

`ioremap()` 不是通用 DMA 映射接口。DMA 缓冲应根据设备和内存类型使用 `dma_alloc_coherent()`、`dma_map_single()` 等 DMA API，并配合 `dma_sync_*()`；具体是否需要缓存同步取决于架构和 DMA 一致性。

### 2.15.4 注意事项

- 使用 iounmap() 释放映射
- 访问寄存器必须使用 **readl/writel** 而非普通指针操作
- 映射范围不要超过实际寄存器区域，否则可能触发异常

### 2.15.5 总结

- ioremap() 用于将物理寄存器地址映射到内核虚拟地址，便于访问硬件
- 适用于 **MMIO 寄存器和设备内存映射**；DMA 缓冲映射应使用相应 DMA API
- 与普通内核内存不同，必须通过 readl/writel 等 I/O 接口访问
- 面试常考点：**MMIO、物理地址映射、ioremap/iounmap、寄存器访问方法**

---

## 2.16 如何定位驱动中的内存泄漏？

### 2.16.1 常见内存泄漏场景

1. kmalloc / vmalloc 后未释放
2. ioremap 后未调用 iounmap
3. request_irq 后未 free_irq
4. 创建 workqueue / timer / tasklet 后未销毁
5. probe 失败路径（error path）中资源未回收
6. 引用计数增加但未减少（kref、get_device）

### 2.16.2 代码层面定位方法

1. 成对检查资源申请与释放
    - kmalloc ↔ kfree
    - vmalloc ↔ vfree
    - ioremap ↔ iounmap
    - request_irq ↔ free_irq
2. 重点检查错误处理分支
    - 初始化中途失败时是否释放已申请资源
    - 建议使用 goto error 标签统一释放
3. 模块卸载路径检查
    - module_exit 中是否释放所有资源
    - remove() 是否与 probe() 对称

### 2.16.3 使用内核调试工具

1. kmemleak
    - 内核配置打开 CONFIG_DEBUG_KMEMLEAK
    - 启动后扫描内存泄漏
2. 常用命令：

    ```text
    echo scan > /sys/kernel/debug/kmemleak
    cat /sys/kernel/debug/kmemleak
    ```

1. slab 信息分析
    - 查看 slab 使用情况：

    ```text
    cat /proc/slabinfo
    slabtop
    ```

    - 某个对象数量持续增长，可能存在泄漏

1. /proc/meminfo
    - 观察 Slab、SReclaimable、SUnreclaim 持续上涨

### 2.16.4 动态调试与日志

1. 在申请和释放处打印日志
    - 记录指针地址、大小、调用路径
    - 对比是否成对出现
2. 使用动态调试（dynamic debug）
    - 精确定位函数调用路径

### 2.16.5 压力测试与复现

1. 反复加载/卸载模块
    - insmod / rmmod 循环
    - 观察内存是否回收
2. 高频打开/关闭设备
    - open/close
    - ioctl 反复调用

### 2.16.6 总结

1. 驱动内存泄漏多出现在异常路径和资源释放不完整
2. 优先通过代码审查保证资源成对释放
3. kmemleak 是定位内核内存泄漏的核心工具
4. slabtop 和 /proc/meminfo 可辅助判断泄漏趋势
5. 面试重点关注：错误路径、probe/remove 对称性、kmemleak 使用

---

## 2.17 内核调试方法有哪些？（printk、gdb、ftrace、动态调试）

> [!tip] 🔗 项目关联
> - [[projects/嵌入式八股/1. 项目八股/Linux物理内存碎片高频面试题#第 1 题：Tracepoint 和 kprobe 的原理分别是什么？它们在稳定性、灵活性、参数获取方式和适用场景上有什么区别？|内存项目 1：Tracepoint 和 kprobe 的原理分…]]
> - [[projects/嵌入式八股/1. 项目八股/Linux物理内存碎片高频面试题#第 6 题：eBPF 是什么？为什么它适合做 Linux 内核态监控？|内存项目 6：eBPF 是什么？为什么它适合做 Linux 内…]]

### 2.17.1 printk

- **原理**：向内核日志缓冲区写入信息
- **使用方式**：

```c
printk(KERN_INFO "Value=%d\n", val);
```

- **日志级别**：KERN_EMERG, KERN_ALERT, KERN_ERR, KERN_WARNING, KERN_INFO, KERN_DEBUG
- **查看日志**：

```text
dmesg
cat /var/log/kern.log
```

- **优点**：简单、随处可用
- **缺点**：打印过多会影响性能，调试实时问题困难

### 2.17.2 gdb + kgdb

- **原理**：通过串口或网络连接调试内核
- **特点**：
    - 可以单步执行内核代码
    - 查看内核变量、调用栈
- **使用步骤**：
  a. 配置内核：CONFIG_KGDB, CONFIG_KGDB_SERIAL_CONSOLE
  b. 启动调试串口或网络
  c. gdb attach 内核
- **优点**：可精确单步调试
- **缺点**：设置复杂，实时性差

### 2.17.3 ftrace

- **原理**：内核内置跟踪工具，通过跟踪函数调用、事件实现性能分析与调试
- **常用功能**：
    - function：跟踪函数调用
    - function_graph：绘制函数调用图
    - tracepoints：追踪内核事件
- **使用示例**：

```text
mount -t debugfs none /sys/kernel/debug
echo function > /sys/kernel/debug/tracing/current_tracer
echo 1 > /sys/kernel/debug/tracing/tracing_on
# 运行待分析的操作后读取 trace
cat /sys/kernel/debug/tracing/trace
echo 0 > /sys/kernel/debug/tracing/tracing_on
```

- **优点**：可分析调用关系、时间开销
- **缺点**：需要学习内核跟踪机制

### 2.17.4 动态调试（dynamic debug）

- **原理**：动态打开或关闭内核指定模块的 printk 输出
- **配置**：内核需启用 CONFIG_DYNAMIC_DEBUG
- **使用示例**：

```text
# 打开指定模块的 debug
echo 'module my_driver +p' > /sys/kernel/debug/dynamic_debug/control
# 关闭
echo 'module my_driver -p' > /sys/kernel/debug/dynamic_debug/control
```

- **优点**：灵活控制日志，不重编译内核
- **缺点**：仅限 printk 日志

### 2.17.5 其他辅助方法

1. **kmemleak**：定位内存泄漏
2. **slabtop / /proc/slabinfo**：查看内存分配情况
3. **oProfile / perf**：性能分析
4. **硬件 JTAG / ICE**：底层硬件调试

### 2.17.6 总结

- **printk**：快速、简单，但影响性能
- **gdb/kgdb**：精确调试，适合复杂问题
- **ftrace**：跟踪函数调用和事件，分析性能和逻辑
- **dynamic debug**：灵活控制日志输出
- 面试重点：**选择合适方法定位问题、理解调试上下文**

---

## 2.18 设备树（Device Tree）

设备树（Device Tree, DT）是 Linux 内核用于描述硬件信息的一种数据结构，尤其在 **嵌入式平台（ARM/SoC）** 上广泛使用。

### 2.18.1 设备树的作用

1. **硬件与内核解耦**
    - 内核不再硬编码具体硬件寄存器和设备信息
    - 同一内核可适配不同硬件
2. **描述硬件信息**
    - CPU、内存、总线类型
    - 外设寄存器地址、IRQ、DMA、时钟等
3. **驱动与硬件匹配**
    - 驱动无需硬编码具体物理地址

### 2.18.2 设备树文件结构

- 文件格式：.dts（源文件） → .dtb（二进制文件，内核加载）
- 基本结构：

```text
/ {
    model = "MyBoard";
    compatible = "myvendor,myboard";

    memory@80000000 {
        device_type = "memory";
        reg = <0x80000000 0x4000000>; // 起始地址和大小
    };

    uart0: serial@4000C000 {
        compatible = "arm,pl011";
        reg = <0x4000C000 0x1000>;  // 寄存器基地址和大小
        interrupts = <0 29 4>;      // 中断号和触发类型
        clocks = <&uart_clk>;
    };
};
```

### 2.18.3 驱动如何使用设备树

1. **设备匹配**
    - 驱动通过 of_match_table 指定 compatible 字段匹配设备

    ```c
    static const struct of_device_id my_uart_of_match[] = {
        { .compatible = "arm,pl011", },
        {},
    };
    MODULE_DEVICE_TABLE(of, my_uart_of_match);
    ```

2. **获取资源**
    - 内核提供 API 获取寄存器、IRQ、DMA 等资源

    ```c
    struct resource *res;
    void __iomem *base;
    int irq;

    base = devm_platform_ioremap_resource(pdev, 0);
    if (IS_ERR(base))
        return PTR_ERR(base);
    irq = platform_get_irq(pdev, 0);
    if (irq < 0)
        return irq;
    res = platform_get_resource(pdev, IORESOURCE_MEM, 0);
    ```

3. **Platform driver 注册**
    - 驱动注册为 platform driver，由内核通过设备树匹配调用 probe 函数

### 2.18.4 总结

- 设备树是硬件信息描述的标准方法
- 内核通过设备树动态识别硬件，无需硬编码
- 驱动通过 compatible 匹配设备，并获取资源（寄存器、IRQ、DMA）
- 面试常考点：**Device Tree 作用、结构、驱动匹配、资源获取**

---

## 2.19 如何在设备树中定义 GPIO / SPI / I2C 外设？

### 2.19.1 GPIO 定义

- GPIO 在设备树中通常定义为 **控制器节点** 或 **按用途引用**
- 属性常用：
    - gpio-controller：表示该节点是 GPIO 控制器
    - #gpio-cells：每个 GPIO 描述的单元数
    - gpios：用于其他设备引用 GPIO

**示例：GPIO 控制器**

```text
gpio1: gpio@40020000 {
    compatible = "st,stm32-gpio";
    reg = <0x40020000 0x400>;
    gpio-controller;
    #gpio-cells = <2>;
    interrupts = <6>;
};
```

**示例：使用 GPIO 的设备（如 LED）**

```text
leds {
    compatible = "gpio-leds";
    status = "okay";

    led0 {
        label = "user_led";
        gpios = <&gpio1 5 GPIO_ACTIVE_HIGH>;  // GPIO1第5号管脚
    };
};
```

### 2.19.2 SPI 外设定义

- SPI 外设由 **总线控制器** 和 **从设备节点** 定义
- 属性常用：
    - compatible：匹配驱动
    - reg：片选号（CS）
    - spi-max-frequency：总线最大频率
    - pinctrl-0 / pinctrl-names：管脚复用

**示例：SPI 控制器**

```text
spi1: spi@40013000 {
    compatible = "st,stm32-spi";
    reg = <0x40013000 0x400>;
    interrupts = <35>;
    clocks = <&spi1_clk>;
    status = "okay";
};
```

**示例：SPI 从设备**

```text
spidev0: spi-device@0 {
    compatible = "spidev";
    reg = <0>;                   // CS0
    spi-max-frequency = <1000000>;
    status = "okay";
};
```

### 2.19.3 I2C 外设定义

- I2C 外设由 **控制器节点** 和 **从设备节点** 描述
- 属性常用：
    - compatible：匹配驱动
    - reg：I2C 从机地址
    - clocks / pinctrl-0：时钟与管脚
    - interrupts（可选）：部分设备需要中断

**示例：I2C 控制器**

```text
i2c1: i2c@40005400 {
    compatible = "st,stm32-i2c";
    reg = <0x40005400 0x400>;
    clocks = <&i2c1_clk>;
    interrupts = <31>;
    status = "okay";
};
```

**示例：I2C 从设备**

```text
temp_sensor: tmp102@48 {
    compatible = "ti,tmp102";
    reg = <0x48>;  // I2C 地址
};
```

### 2.19.4 驱动获取资源示例

```c
// 获取 GPIO
struct gpio_desc *led_gpio = devm_gpiod_get(&pdev->dev, "user_led", GPIOD_OUT_LOW);

// 获取 SPI
struct spi_device *spi = to_spi_device(pdev->dev);

// 获取 I2C
struct i2c_client *client = to_i2c_client(pdev->dev);
```

### 2.19.5 总结

- **GPIO**：用 gpio-controller 定义控制器，其他节点通过 gpios 引用
- **SPI**：控制器节点 + 从设备节点，reg 表示 CS
- **I2C**：控制器节点 + 从设备节点，reg 表示 I2C 地址
- 驱动通过 **设备树匹配** 获取资源（GPIO、寄存器、IRQ）
- 面试常考点：**节点结构、compatible 匹配、reg / gpios / interrupts 的意义**

---

[[projects/嵌入式八股/index|← 总索引]] · [[09 嵌入式Linux应用|← 上一章：嵌入式 Linux 应用]] · [[11 Bootloader与Rootfs|下一章：Bootloader 与 Rootfs →]]
