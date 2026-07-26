---
title: "Day 5 · 链表进阶"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 5 · 链表进阶》。"
---

# Day 5 · 链表进阶

> **日期：** 2026-__-__
> **学习目标：** 链表进阶——递归、多指针与复杂操作
> **相关知识页：** [[04-链表|04-链表]]

---

## 一、今日模板回顾

### K 个一组翻转
```cpp
ListNode* reverseRange(ListNode* head, ListNode* tail) {
    ListNode* previous = tail;
    while (head != tail) {
        ListNode* next = head->next;
        head->next = previous;
        previous = head;
        head = next;
    }
    return previous;
}
```
### LRU 缓存
```cpp
list<pair<int, int>> order;  // front 为最近使用
unordered_map<int, list<pair<int, int>>::iterator> position;
```
---

## 二、做题记录

### 1. 两两交换链表中的节点（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/swap-nodes-in-pairs/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2357/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/347847/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 两两交换链表中的节点（LeetCode 24 · Medium）|直达本题最终代码]]
- **题目详解：** [[24-两两交换链表中的节点|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. K 个一组翻转链表（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/reverse-nodes-in-k-group/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2358/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/347863/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. K 个一组翻转链表（LeetCode 25 · Hard）|直达本题最终代码]]
- **题目详解：** [[25-K个一组翻转链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 随机链表的复制（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/copy-list-with-random-pointer/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2508/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/400796/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 随机链表的复制（LeetCode 138 · Medium）|直达本题最终代码]]
- **题目详解：** [[138-随机链表的复制|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 排序链表（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/sort-list/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2518/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/405095/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 排序链表（LeetCode 148 · Medium）|直达本题最终代码]]
- **题目详解：** [[148-排序链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 合并 K 个升序链表（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/merge-k-sorted-lists/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2356/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/347836/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 合并 K 个升序链表（LeetCode 23 · Hard）|直达本题最终代码]]
- **题目详解：** [[23-合并K个升序链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. LRU 缓存（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/lru-cache/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2516/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/405014/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. LRU 缓存（LeetCode 146 · Medium）|直达本题最终代码]]
- **题目详解：** [[146-LRU缓存|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

---

## 三、今日总结

**学到的新模板/技巧：**
-

**遇到的困难：**
-

**遗留问题（需复习）：**
-

**整体感受：** 😊 😐 😢
