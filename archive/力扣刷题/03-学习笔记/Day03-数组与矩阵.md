---
title: "Day 3 · 数组与矩阵"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 3 · 数组与矩阵》。"
---

# Day 3 · 数组与矩阵

> **日期：** 2026-__-__
> **学习目标：** 数组原地操作技巧与矩阵遍历/变换
> **相关知识页：** [[03-数组与矩阵|03-数组与矩阵]] · [[01-哈希表|01-哈希表]]

---

## 一、今日模板回顾

### 三次翻转法
```cpp
void rotateArray(vector<int>& nums, int k) {
    k %= nums.size();
    reverse(nums.begin(), nums.end());
    reverse(nums.begin(), nums.begin() + k);
    reverse(nums.begin() + k, nums.end());
}
```
### 前缀积+后缀积
```cpp
vector<int> productExceptSelfTemplate(const vector<int>& nums) {
    vector<int> answer(nums.size(), 1);
    for (int i = 1; i < static_cast<int>(nums.size()); ++i)
        answer[i] = answer[i - 1] * nums[i - 1];
    int suffix = 1;
    for (int i = static_cast<int>(nums.size()) - 1; i >= 0; --i)
        answer[i] *= suffix, suffix *= nums[i];
    return answer;
}
```
### 螺旋矩阵边界收缩
```cpp
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        vector<int> ans;
        int top = 0, bottom = matrix.size() - 1;
        int left = 0, right = matrix[0].size() - 1;
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; ++j) ans.push_back(matrix[top][j]);
            ++top;
            for (int i = top; i <= bottom; ++i) ans.push_back(matrix[i][right]);
            --right;
            if (top <= bottom)
                for (int j = right; j >= left; --j) ans.push_back(matrix[bottom][j]);
            --bottom;
            if (left <= right)
                for (int i = bottom; i >= top; --i) ans.push_back(matrix[i][left]);
            ++left;
        }
        return ans;
    }
};
```
### 搜索二维矩阵（右上角法）
```cpp
class Solution {
public:
    bool searchMatrix(vector<vector<int>>& matrix, int target) {
        int m = matrix.size(), n = matrix[0].size();
        int left = 0, right = m * n - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            int x = matrix[mid / n][mid % n];
            if (x == target) return true;
            if (x < target) left = mid + 1;
            else right = mid - 1;
        }
        return false;
    }
};
```
---

## 二、做题记录

### 1. 轮转数组（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/rotate-array/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2563/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/421926/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 轮转数组（LeetCode 189 · Medium）|直达本题最终代码]]
- **题目详解：** [[189-轮转数组|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 除自身以外数组的乘积（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/product-of-array-except-self/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2632/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/445198/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 除自身以外数组的乘积（LeetCode 238 · Medium）|直达本题最终代码]]
- **题目详解：** [[238-除自身以外数组的乘积|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 缺失的第一个正数（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/first-missing-positive/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2378/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/356160/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 缺失的第一个正数（LeetCode 41 · Hard）|直达本题最终代码]]
- **题目详解：** [[41-缺失的第一个正数|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 矩阵置零（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/set-matrix-zeroes/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2422/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370343/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 矩阵置零（LeetCode 73 · Medium）|直达本题最终代码]]
- **题目详解：** [[73-矩阵置零|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 螺旋矩阵（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/spiral-matrix/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2399/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/362206/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 螺旋矩阵（LeetCode 54 · Medium）|直达本题最终代码]]
- **题目详解：** [[54-螺旋矩阵|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 旋转图像（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/rotate-image/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2385/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/356298/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 旋转图像（LeetCode 48 · Medium）|直达本题最终代码]]
- **题目详解：** [[48-旋转图像|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 搜索二维矩阵 II（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/search-a-2d-matrix-ii/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2634/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/445234/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 搜索二维矩阵 II（LeetCode 240 · Medium）|直达本题最终代码]]
- **题目详解：** [[240-搜索二维矩阵II|打开完整题解]]
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
