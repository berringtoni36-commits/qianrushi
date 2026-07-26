---
title: "Day 11 · 二分查找"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 11 · 二分查找》。"
---

# Day 11 · 二分查找

> **日期：** 2026-__-__
> **学习目标：** 二分查找的多种变体与应用
> **相关知识页：** [[09-二分查找|09-二分查找]] · [[03-数组与矩阵|03-数组与矩阵]]

---

## 一、今日模板回顾

### 标准二分
```cpp
int binarySearchTemplate(const vector<int>& nums, int target) {
    int left = 0, right = static_cast<int>(nums.size()) - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```
### 左边界二分
```cpp
int lowerBoundTemplate(const vector<int>& nums, int target) {
    int left = 0, right = static_cast<int>(nums.size());
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] >= target) right = mid;
        else left = mid + 1;
    }
    return left;
}
```
### 右边界二分
```cpp
int upperBoundTemplate(const vector<int>& nums, int target) {
    int left = 0, right = static_cast<int>(nums.size());
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] > target) right = mid;
        else left = mid + 1;
    }
    return left;
}
```
---

## 二、做题记录

### 1. 搜索插入位置（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/search-insert-position/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2372/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/355047/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 搜索插入位置（LeetCode 35 · Easy）|直达本题最终代码]]
- **题目详解：** [[35-搜索插入位置|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 搜索二维矩阵（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/search-a-2d-matrix/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2423/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370359/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 搜索二维矩阵（LeetCode 74 · Medium）|直达本题最终代码]]
- **题目详解：** [[74-搜索二维矩阵|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 在排序数组中查找元素首末位置（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2371/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/355034/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 在排序数组中查找元素的第一个和最后一个位置（LeetCode 34 · Medium）|直达本题最终代码]]
- **题目详解：** [[34-在排序数组中查找元素首末位置|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 搜索旋转排序数组（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/search-in-rotated-sorted-array/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2370/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/355022/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 搜索旋转排序数组（LeetCode 33 · Medium）|直达本题最终代码]]
- **题目详解：** [[33-搜索旋转排序数组|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 寻找旋转排序数组中的最小值（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/find-minimum-in-rotated-sorted-array/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2534/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/411020/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 寻找旋转排序数组中的最小值（LeetCode 153 · Medium）|直达本题最终代码]]
- **题目详解：** [[153-寻找旋转排序数组中的最小值|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 寻找两个正序数组的中位数（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/median-of-two-sorted-arrays/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2329/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/339893/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 寻找两个正序数组的中位数（LeetCode 4 · Hard）|直达本题最终代码]]
- **题目详解：** [[4-寻找两个正序数组的中位数|打开完整题解]]
- **优先级：** 扩展题

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
