---
name: embedded-c-struct-binary-contract-audit
description: "Use when auditing whether an embedded C struct safely matches a register map, DMA buffer, CAN/UART/SPI/I2C frame, flash record, or other binary layout. Trigger phrases include can this struct map a CAN frame, sizeof/offsetof mismatch, pragma pack, bit-field order, union type punning, endian conversion, unaligned access, volatile register mapping, or protocol CRC/DLC layout. Do not use for storage duration/linkage, bus selection, or ISR event delivery alone."
metadata:
  source_files:
    - projects/嵌入式八股/糯叽叽八股/01 C语言.md
    - projects/嵌入式八股/3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md
    - projects/嵌入式八股/糯叽叽八股/08 通讯协议.md
    - projects/嵌入式八股/糯叽叽八股/06 STM32.md
  source_symbols:
    - sizeof
    - offsetof
    - _Alignof
    - pragma pack
    - bit-field
    - union
    - flexible array
    - volatile
    - CRC
    - DLC
    - memcpy
    - endian
  related_skills:
    - embedded-c-storage-linkage-audit
    - embedded-numeric-contract-audit
    - embedded-memory-lifetime-and-pool-design
    - embedded-bus-selection
---

# 嵌入式 C 结构体与二进制契约审计

## 来源证据

source_files:
  - projects/嵌入式八股/糯叽叽八股/01 C语言.md
  - projects/嵌入式八股/3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md
  - projects/嵌入式八股/糯叽叽八股/08 通讯协议.md
  - projects/嵌入式八股/糯叽叽八股/06 STM32.md

source_symbols:
  - sizeof
  - offsetof
  - _Alignof
  - pragma pack
  - bit-field
  - union
  - flexible array
  - volatile
  - CRC
  - DLC
  - memcpy
  - endian

## R — 来源摘录与事实

- 结构体成员可能有中间和尾部填充，sizeof 必须以目标 ABI 的实际结果为准；数组、指针和结构体不能用 strlen 等字符串规则替代。
- 位域顺序、存储单元和布局依赖实现/ABI；pragma pack 只能影响字节对齐，不能保证位域位序或硬件访问宽度。
- 寄存器映射需要核对基地址、字段偏移、访问宽度和 volatile；通信帧需要核对端序、长度、DLC、CRC、校验范围和未对齐访问。

## I — 方法论解释

先把外部二进制合同写成字段表：偏移、长度、端序、有效位、对齐、生命周期和校验。再判断 C 结构体是否只是方便的内存表示，还是被错误地当成线上的序列化格式。跨编译器、跨芯片和跨协议时，优先用定宽类型、显式掩码/移位和 memcpy/序列化函数；不要用“当前机器看起来一样”替代合同。

寄存器映射和网络/Flash 序列化是两个方向：前者关心固定地址和硬件副作用，后者关心字节流和兼容版本。二者都需要 offsetof/sizeof/静态断言或目标平台测试，但不能互相套用。

## A1 — 资料中的应用

- 结构体资料用位域描述寄存器字段，同时指出跨编译器位域布局风险。
- GPIO/外设结构体示例用 RESERVED 字段匹配芯片手册偏移，并用 volatile 约束寄存器访问。
- CAN 示例把 ID、DLC、data、CRC、ACK 放入帧流程；参数存储示例用 magic、version、length、CRC 检查记录。
- 柔性数组示例用 sizeof(header) + payload_length 计算变长报文大小；紧凑结构体示例警告未对齐访问风险。

## A2 — 未来触发场景

- 用户问一个 struct 能否直接映射 CAN/UART/DMA/寄存器/Flash 记录。
- 用户遇到 sizeof、offsetof、端序、CRC 范围、位域顺序、结构体填充或 HardFault。
- 用户要审计协议升级、跨编译器构建或不同 MCU 上的二进制兼容性。

## E — 可执行审计流程

1. 从芯片手册或协议文档列出每个字段的偏移、宽度、端序、有效位、保留位、长度规则和校验范围。
2. 在目标编译器上用 sizeof、offsetof、_Alignof 和静态断言验证布局；不要只在宿主机验证。
3. 检查 pragma pack、位域、union、柔性数组、指针、枚举、bool、float 和隐式填充；对外部字节流优先显式编码/解码。
4. 检查未对齐读写、DMA cache/ownership、volatile、读改写副作用和访问宽度；必要时用 memcpy 到自然对齐对象。
5. 用已知字节向量测试端序、长度和 CRC；再做跨版本/坏包/截断/最大长度测试，输出“布局匹配、部分匹配或不可直接映射”。

## B — 边界与风险

- volatile 只约束编译器对该对象访问的可观察性，不提供原子性、互斥、内存屏障或 DMA cache 一致性。
- pragma pack 可能导致未对齐访问和性能/异常风险；不能用它修复位域顺序。
- union 观察不同成员的表示依赖实现、端序和浮点格式；不要用它代替跨平台序列化合同。
- 存储期、链接属性、.data/.bss 和 Map 使用 embedded-c-storage-linkage-audit；总线电气选型使用 embedded-bus-selection；ISR/DMA 事件链使用 rtos-communication-debugging。

## 相关 Skills

- embedded-c-storage-linkage-audit：存储期、链接和镜像布局。
- embedded-bus-selection：UART、RS232/485、I2C、SPI、CAN 的工程选型。
- rtos-communication-debugging：ISR、DMA、信号量和任务事件链。
- linux-file-persistence-crash-consistency：文件持久化和崩溃一致性。
