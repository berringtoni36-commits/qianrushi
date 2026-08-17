# 候选：C 结构体二进制布局—寄存器/协议契约审计

id: c07
title: C 结构体二进制布局—寄存器/协议契约审计
type: framework
verification: V1=pass, V2=pass, V3=pass

## 方法论

先建立外部字段表，再用目标 ABI 的 sizeof/offsetof/_Alignof、静态断言、已知字节向量和显式编码/解码核对结构体；分别审计寄存器固定地址、DMA 缓冲区、协议帧和 Flash 记录，不用 pragma pack 或位域掩盖未知布局。

## 来源

- projects/嵌入式八股/糯叽叽八股/01 C语言.md
- projects/嵌入式八股/3. 杂七杂八/10. 嵌入式开发，最值得精通的28个结构体.md
- projects/嵌入式八股/糯叽叽八股/08 通讯协议.md
- projects/嵌入式八股/糯叽叽八股/06 STM32.md

## 三重验证

- V1：C 语言、结构体方法论、通信协议和 STM32 寄存器资料交叉支撑。
- V2：可用于审计 CAN/DMA/寄存器/Flash 记录中未对齐、端序、长度、CRC 和字段偏移问题。
- V3：把对象表示、ABI 和外部二进制合同合成一条检查流，与存储链接、总线选型和 ISR 事件链区分。
