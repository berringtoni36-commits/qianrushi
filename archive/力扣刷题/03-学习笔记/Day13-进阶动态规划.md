---
title: "Day 13 · 进阶动态规划"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 13 · 进阶动态规划》。"
---

# Day 13 · 进阶动态规划

> **日期：** 2026-__-__
> **学习目标：** 进阶 DP 与多维动态规划
> **相关知识页：** [[10-动态规划|10-动态规划]] · [[12-技巧专题|12-技巧专题]]

---

## 一、今日模板回顾

### 子序列 DP
```cpp
int lisTemplate(const vector<int>& nums) {
    vector<int> tails;
    for (int x : nums) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    return tails.size();
}
```
### 区间 DP
```cpp
string longestPalindromeTemplate(const string& s) {
    int n = s.size(), bestLeft = 0, bestLength = 0;
    vector<vector<char>> dp(n, vector<char>(n));
    for (int left = n - 1; left >= 0; --left)
        for (int right = left; right < n; ++right)
            if (s[left] == s[right] && (right - left < 2 || dp[left + 1][right - 1])) {
                dp[left][right] = true;
                if (right - left + 1 > bestLength) bestLeft = left, bestLength = right - left + 1;
            }
    return s.substr(bestLeft, bestLength);
}
```
### 路径 DP
```cpp
int minPathSumTemplate(const vector<vector<int>>& grid) {
    vector<int> dp(grid[0].size(), INT_MAX);
    dp[0] = 0;
    for (const auto& row : grid)
        for (int j = 0; j < static_cast<int>(row.size()); ++j)
            dp[j] = min(dp[j], j ? dp[j - 1] : INT_MAX) + row[j];
    return dp.back();
}
```
### 编辑距离
```cpp
class Solution {
public:
    int minDistance(string a, string b) {
        int n = b.size();
        vector<int> dp(n + 1);
        iota(dp.begin(), dp.end(), 0);
        for (int i = 1; i <= a.size(); ++i) {
            int diagonal = dp[0];
            dp[0] = i;
            for (int j = 1; j <= n; ++j) {
                int up = dp[j];
                if (a[i - 1] == b[j - 1]) dp[j] = diagonal;
                else dp[j] = min({dp[j], dp[j - 1], diagonal}) + 1;
                diagonal = up;
            }
        }
        return dp[n];
    }
};
```
---

## 二、做题记录

### 1. 最长递增子序列（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/longest-increasing-subsequence/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2672/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/456581/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 最长递增子序列（LeetCode 300 · Medium）|直达本题最终代码]]
- **题目详解：** [[300-最长递增子序列|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 乘积最大子数组（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/maximum-product-subarray/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2533/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/411014/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 乘积最大子数组（LeetCode 152 · Medium）|直达本题最终代码]]
- **题目详解：** [[152-乘积最大子数组|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 分割等和子集（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/partition-equal-subset-sum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2813/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/531708/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 分割等和子集（LeetCode 416 · Medium）|直达本题最终代码]]
- **题目详解：** [[416-分割等和子集|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 最长有效括号（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/longest-valid-parentheses/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2369/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/355012/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 最长有效括号（LeetCode 32 · Hard）|直达本题最终代码]]
- **题目详解：** [[32-最长有效括号|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 不同路径（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/unique-paths/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2407/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/363536/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 不同路径（LeetCode 62 · Medium）|直达本题最终代码]]
- **题目详解：** [[62-不同路径|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 最小路径和（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/minimum-path-sum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2409/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/363553/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 最小路径和（LeetCode 64 · Medium）|直达本题最终代码]]
- **题目详解：** [[64-最小路径和|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 最长回文子串（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/longest-palindromic-substring/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2330/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/339912/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 最长回文子串（LeetCode 5 · Medium）|直达本题最终代码]]
- **题目详解：** [[5-最长回文子串|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 8. 最长公共子序列（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/longest-common-subsequence/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/6966/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/3538890/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#8. 最长公共子序列（LeetCode 1143 · Medium）|直达本题最终代码]]
- **题目详解：** [[1143-最长公共子序列|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 9. 编辑距离（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/edit-distance/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2421/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370323/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#9. 编辑距离（LeetCode 72 · Medium）|直达本题最终代码]]
- **题目详解：** [[72-编辑距离|打开完整题解]]
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
