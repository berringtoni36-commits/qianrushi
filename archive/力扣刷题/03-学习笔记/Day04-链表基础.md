---
title: "Day 4 · 链表基础"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 4 · 链表基础》。"
---

# Day 4 · 链表基础

> **日期：** 2026-__-__
> **学习目标：** 链表基础操作——指针操纵与虚拟头节点
> **相关知识页：** [[04-链表|04-链表]] · [[02-双指针与滑动窗口|02-双指针与滑动窗口]]

---

## 一、今日模板回顾

### 虚拟头节点
```cpp
ListNode* dummyNodeTemplate(ListNode* head) {
    ListNode dummy(0, head);
    ListNode* previous = &dummy;
    // 从 previous 开始统一处理“可能修改头节点”的操作。
    return dummy.next;
}
```
### 链表翻转（三指针）
```cpp
ListNode* reverseListTemplate(ListNode* head) {
    ListNode* previous = nullptr;
    while (head) {
        ListNode* next = head->next;
        head->next = previous;
        previous = head;
        head = next;
    }
    return previous;
}
```
### 快慢指针（判环）
```cpp
bool hasCycleTemplate(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```
---

## 二、做题记录

### 1. 相交链表（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/intersection-of-two-linked-lists/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2537/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/411074/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 相交链表（LeetCode 160 · Easy）|直达本题最终代码]]
- **题目详解：** [[160-相交链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 反转链表（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/reverse-linked-list/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2574/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/426277/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 反转链表（LeetCode 206 · Easy）|直达本题最终代码]]
- **题目详解：** [[206-反转链表|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 回文链表（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/palindrome-linked-list/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2615/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/439511/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 回文链表（LeetCode 234 · Easy）|直达本题最终代码]]
- **题目详解：** [[234-回文链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 环形链表（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/linked-list-cycle/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2511/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/404934/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 环形链表（LeetCode 141 · Easy）|直达本题最终代码]]
- **题目详解：** [[141-环形链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 环形链表 II（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/linked-list-cycle-ii/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2512/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/404952/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 环形链表 II（LeetCode 142 · Medium）|直达本题最终代码]]
- **题目详解：** [[142-环形链表II|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 合并两个有序链表（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/merge-two-sorted-lists/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2354/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/347807/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 合并两个有序链表（LeetCode 21 · Easy）|直达本题最终代码]]
- **题目详解：** [[21-合并两个有序链表|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 两数相加（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/add-two-numbers/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2327/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/339832/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 两数相加（LeetCode 2 · Medium）|直达本题最终代码]]
- **题目详解：** [[2-两数相加|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 8. 删除链表的倒数第 N 个节点（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/remove-nth-node-from-end-of-list/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2352/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/346852/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#8. 删除链表的倒数第 N 个节点（LeetCode 19 · Medium）|直达本题最终代码]]
- **题目详解：** [[19-删除链表的倒数第N个节点|打开完整题解]]
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
