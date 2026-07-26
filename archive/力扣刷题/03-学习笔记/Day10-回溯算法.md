---
title: "Day 10 · 回溯算法"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 10 · 回溯算法》。"
---

# Day 10 · 回溯算法

> **日期：** 2026-__-__
> **学习目标：** 回溯算法框架与剪枝优化
> **相关知识页：** [[08-回溯算法|08-回溯算法]] · [[07-图论|07-图论]]

---

## 一、今日模板回顾

### 回溯标准模板
```cpp
class Solution {
public:
    vector<string> letterCombinations(string digits) {
        if (digits.empty()) return {};
        const vector<string> mp{"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
        vector<string> ans;
        string path(digits.size(), 0);
        auto dfs = [&](auto&& self, int i) -> void {
            if (i == digits.size()) return ans.push_back(path);
            for (char c : mp[digits[i] - '2']) path[i] = c, self(self, i + 1);
        };
        dfs(dfs, 0);
        return ans;
    }
};
```
### 排列 vs 组合 vs 子集
```cpp
class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> ans(1);
        for (int x : nums) {
            int size = ans.size();
            for (int i = 0; i < size; ++i) {
                ans.push_back(ans[i]);
                ans.back().push_back(x);
            }
        }
        return ans;
    }
};
```
### 去重技巧
```cpp
void chooseUnique(const vector<int>& nums, int start, vector<int>& path,
                  vector<vector<int>>& answer) {
    answer.push_back(path);
    for (int i = start; i < static_cast<int>(nums.size()); ++i) {
        if (i > start && nums[i] == nums[i - 1]) continue;  // 同一层去重
        path.push_back(nums[i]);
        chooseUnique(nums, i + 1, path, answer);
        path.pop_back();
    }
}
```
---

## 二、做题记录

### 1. 全排列（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/permutations/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2383/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/356268/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 全排列（LeetCode 46 · Medium）|直达本题最终代码]]
- **题目详解：** [[46-全排列|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 子集（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/subsets/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2427/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370434/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 子集（LeetCode 78 · Medium）|直达本题最终代码]]
- **题目详解：** [[78-子集|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 电话号码的字母组合（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2350/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/346821/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 电话号码的字母组合（LeetCode 17 · Medium）|直达本题最终代码]]
- **题目详解：** [[17-电话号码的字母组合|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 组合总和（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/combination-sum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2376/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/355108/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 组合总和（LeetCode 39 · Medium）|直达本题最终代码]]
- **题目详解：** [[39-组合总和|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 括号生成（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/generate-parentheses/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2355/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/347825/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 括号生成（LeetCode 22 · Medium）|直达本题最终代码]]
- **题目详解：** [[22-括号生成|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 单词搜索（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/word-search/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2428/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370446/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 单词搜索（LeetCode 79 · Medium）|直达本题最终代码]]
- **题目详解：** [[79-单词搜索|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 分割回文串（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/palindrome-partitioning/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2501/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/400664/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 分割回文串（LeetCode 131 · Medium）|直达本题最终代码]]
- **题目详解：** [[131-分割回文串|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 8. N 皇后（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/n-queens/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2396/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/362151/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#8. N 皇后（LeetCode 51 · Hard）|直达本题最终代码]]
- **题目详解：** [[51-N皇后|打开完整题解]]
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
