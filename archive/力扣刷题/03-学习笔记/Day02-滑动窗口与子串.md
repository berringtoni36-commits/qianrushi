---
title: "Day 2 · 滑动窗口与子串"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 2 · 滑动窗口与子串》。"
---

# Day 2 · 滑动窗口与子串

> **日期：** 2026-__-__
> **学习目标：** 滑动窗口三问法与子串处理技巧
> **相关知识页：** [[02-双指针与滑动窗口|02-双指针与滑动窗口]] · [[03-数组与矩阵|03-数组与矩阵]]

---

## 一、今日模板回顾

### 滑动窗口通用模板
```cpp
int longestWindow(const string& s) {
    array<int, 128> count{};
    int answer = 0;
    for (int left = 0, right = 0; right < static_cast<int>(s.size()); ++right) {
        ++count[static_cast<unsigned char>(s[right])];
        while (count[static_cast<unsigned char>(s[right])] > 1)
            --count[static_cast<unsigned char>(s[left++])];
        answer = max(answer, right - left + 1);
    }
    return answer;
}
```
### 前缀和
```cpp
int countSubarrays(const vector<int>& nums, int k) {
    unordered_map<long long, int> count{{0, 1}};
    long long prefix = 0;
    int answer = 0;
    for (int x : nums) prefix += x, answer += count[prefix - k], ++count[prefix];
    return answer;
}
```
### 单调队列
```cpp
vector<int> windowMaximum(const vector<int>& nums, int k) {
    deque<int> q;
    vector<int> answer;
    for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
        while (!q.empty() && q.front() <= i - k) q.pop_front();
        while (!q.empty() && nums[q.back()] <= nums[i]) q.pop_back();
        q.push_back(i);
        if (i + 1 >= k) answer.push_back(nums[q.front()]);
    }
    return answer;
}
```
---

## 二、做题记录

### 1. 无重复字符的最长子串（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2328/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/339855/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 无重复字符的最长子串（LeetCode 3 · Medium）|直达本题最终代码]]
- **题目详解：** [[3-无重复字符的最长子串|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 找到字符串中所有字母异位词（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2860/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/541455/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 找到字符串中所有字母异位词（LeetCode 438 · Medium）|直达本题最终代码]]
- **题目详解：** [[438-找到字符串中所有字母异位词|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 和为 K 的子数组（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/subarray-sum-equals-k/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/3051/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/602984/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 和为 K 的子数组（LeetCode 560 · Medium）|直达本题最终代码]]
- **题目详解：** [[560-和为K的子数组|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 滑动窗口最大值（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/sliding-window-maximum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2633/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/445221/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 滑动窗口最大值（LeetCode 239 · Hard）|直达本题最终代码]]
- **题目详解：** [[239-滑动窗口最大值|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 最小覆盖子串（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/minimum-window-substring/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2425/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370411/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 最小覆盖子串（LeetCode 76 · Hard）|直达本题最终代码]]
- **题目详解：** [[76-最小覆盖子串|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 最大子数组和（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/maximum-subarray/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2398/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/362176/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 最大子数组和（LeetCode 53 · Medium）|直达本题最终代码]]
- **题目详解：** [[53-最大子数组和|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 合并区间（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/merge-intervals/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2401/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/362233/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 合并区间（LeetCode 56 · Medium）|直达本题最终代码]]
- **题目详解：** [[56-合并区间|打开完整题解]]
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
