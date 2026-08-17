# Q010 事实核对来源

## 原始题目

- `/Users/zhaowenqiang/Library/Mobile Documents/iCloud~md~obsidian/Documents/qianrushi/projects/嵌入式八股/2. 嵌入式高频八股150题/01 C-C++基础（1-25题）.md`
- 第 10 题：`malloc/free 和 new/delete 有什么区别？`

## 标准语义核对

- C++ Working Draft：`new-expression`、`delete-expression`、动态存储期和分配函数相关条款，见 `https://eel.is/c++draft/expr.new`、`https://eel.is/c++draft/expr.delete`、`https://eel.is/c++draft/basic.stc.dynamic.allocation`。
- C++ Working Draft：异常分配函数和 `std::nothrow` 相关声明，见 `https://eel.is/c++draft/new.delete.single`、`https://eel.is/c++draft/new.delete.array`。
- C++ Working Draft：对象生命周期与显式析构相关条款，见 `https://eel.is/c++draft/basic.life`。

## 本题采用的准确表述

1. `malloc` / `free` 是 C 库风格的原始存储接口；它们不按 C++ 对象模型自动调用构造函数和析构函数。
2. `new` 表达式既涉及存储取得，也涉及对象初始化；`delete` 表达式结束对象生命周期并调用对应释放函数。
3. `new[]` 必须和 `delete[]` 配对；`malloc` 必须和 `free` 配对；错误配对属于未定义行为。
4. 普通 `new` 分配失败默认抛出 `std::bad_alloc`；`new (std::nothrow)` 使用返回空指针的失败形式。
5. “new 的底层就是 malloc”不是跨实现保证。视频改说为：通常经过匹配的 `operator new`，底层分配器可以是自定义堆、内存池或其他实现。
6. RAII 能把资源释放绑定到对象生命周期，但不能自动解决嵌入式系统的碎片、最坏时延或 RAM 上限问题。

## 原文修正记录

- 原题示例中的 `new int[10]` 被视频改成对象数组和显式生命周期示例，避免把基本类型数组的默认初始化误读为“全部初始化为 0”。
- 原题的“new 出来的内存能用 free 释放吗？析构函数不会被调用”在视频中收紧为：这是未定义行为，不能保证按 `delete` 规则完成析构和释放。
