---
title: "Day 1 · 哈希与双指针"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 1 · 哈希与双指针》。"
---

# Day 1 · 哈希与双指针

> **日期：** 2026-__-__
> **学习目标：** 哈希表的使用技巧与双指针的经典模式
> **相关知识页：** [[01-哈希表|01-哈希表]] · [[02-双指针与滑动窗口|02-双指针与滑动窗口]]

---

## 一、今日模板回顾

### 哈希表
```cpp
vector<int> twoSumTemplate(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};
        seen[nums[i]] = i;
    }
    return {};
}
```
### 双指针（对撞）
```cpp
bool twoPointerTemplate(const vector<int>& nums, int target) {
    int left = 0, right = static_cast<int>(nums.size()) - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) return true;
        if (sum < target) ++left;
        else --right;
    }
    return false;
}
```
### 双指针（快慢）
```cpp
void fastSlowTemplate(vector<int>& nums) {
    int slow = 0;
    for (int fast = 0; fast < static_cast<int>(nums.size()); ++fast)
        if (nums[fast] != 0) swap(nums[slow++], nums[fast]);
}
```
---

## 二、做题记录

### 1. 两数之和（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/two-sum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2326/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/339799/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 两数之和（LeetCode 1 · Easy）|直达本题最终代码]]
- **题目详解：** [[1-两数之和|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 字母异位词分组（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/group-anagrams/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2386/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/356303/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 字母异位词分组（LeetCode 49 · Medium）|直达本题最终代码]]
- **题目详解：** [[49-字母异位词分组|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 最长连续序列（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/longest-consecutive-sequence/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2490/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/394597/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 最长连续序列（LeetCode 128 · Medium）|直达本题最终代码]]
- **题目详解：** [[128-最长连续序列|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 移动零（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/move-zeroes/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2663/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/456460/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 移动零（LeetCode 283 · Easy）|直达本题最终代码]]
- **题目详解：** [[283-移动零|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 盛最多水的容器（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/container-with-most-water/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2344/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/346694/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 盛最多水的容器（LeetCode 11 · Medium）|直达本题最终代码]]
- **题目详解：** [[11-盛最多水的容器|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 三数之和（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/3sum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2348/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/346791/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 三数之和（LeetCode 15 · Medium）|直达本题最终代码]]
- **题目详解：** [[15-三数之和|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 接雨水（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/trapping-rain-water/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2379/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/356196/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 接雨水（LeetCode 42 · Hard）|直达本题最终代码]]
- **题目详解：** [[42-接雨水|打开完整题解]]
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
