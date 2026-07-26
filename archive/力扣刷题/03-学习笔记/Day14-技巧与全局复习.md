---
title: "Day 14 · 技巧专题 + 全局复习"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 14 · 技巧专题 + 全局复习》。"
---

# Day 14 · 技巧专题 + 全局复习

> **日期：** 2026-__-__
> **学习目标：** 位运算等技巧 + 全面知识体系梳理
> **相关知识页：** [[12-技巧专题|12-技巧专题]] · [[13-复杂度速查表|13-复杂度速查表]]

---

## 一、今日模板回顾

### 异或找唯一
```cpp
int singleNumberTemplate(const vector<int>& nums) {
    return accumulate(nums.begin(), nums.end(), 0, bit_xor<int>());
}
```
### 摩尔投票法（找众数）
```cpp
int majorityElementTemplate(const vector<int>& nums) {
    int candidate = 0, votes = 0;
    for (int x : nums) {
        if (votes == 0) candidate = x;
        votes += x == candidate ? 1 : -1;
    }
    return candidate;
}
```
### 荷兰国旗（三指针）
```cpp
void sortColorsTemplate(vector<int>& nums) {
    int left = 0, current = 0, right = static_cast<int>(nums.size()) - 1;
    while (current <= right) {
        if (nums[current] == 0) swap(nums[left++], nums[current++]);
        else if (nums[current] == 2) swap(nums[current], nums[right--]);
        else ++current;
    }
}
```
---

## 二、做题记录

### 1. 只出现一次的数字（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/single-number/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2506/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/400753/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 只出现一次的数字（LeetCode 136 · Easy）|直达本题最终代码]]
- **题目详解：** [[136-只出现一次的数字|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 多数元素（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/majority-element/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2544/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/417114/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 多数元素（LeetCode 169 · Easy）|直达本题最终代码]]
- **题目详解：** [[169-多数元素|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 颜色分类（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/sort-colors/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2424/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/370383/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 颜色分类（LeetCode 75 · Medium）|直达本题最终代码]]
- **题目详解：** [[75-颜色分类|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 下一个排列（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/next-permutation/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2368/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/349093/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 下一个排列（LeetCode 31 · Medium）|直达本题最终代码]]
- **题目详解：** [[31-下一个排列|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 寻找重复数（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/find-the-duplicate-number/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2665/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/456473/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 寻找重复数（LeetCode 287 · Medium）|直达本题最终代码]]
- **题目详解：** [[287-寻找重复数|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

---

## 三、全局复习与知识体系

### 知识体系总图

```
算法知识体系
├── 数据结构
│   ├── 哈希表：查找 O(1)、计数、分组
│   ├── 数组/矩阵：前缀和、原地操作、螺旋遍历
│   ├── 链表：虚拟头、快慢、翻转、LRU
│   ├── 二叉树：DFS(前/中/后)、BFS、BST
│   ├── 图：DFS/BFS、拓扑排序、Trie
│   ├── 栈：括号匹配、单调栈
│   └── 堆：Top K、双堆中位数
│
├── 算法思想
│   ├── 双指针：对撞、快慢、滑动窗口
│   ├── 二分查找：标准、边界、旋转数组
│   ├── 回溯：排列、组合、子集、棋盘
│   ├── 贪心：局部最优、反例验证
│   ├── 动态规划：线性/背包/路径/区间/编辑距离
│   └── 图论遍历：DFS/BFS/拓扑排序
│
└── 技巧
    ├── 位运算：异或找唯一
    ├── 摩尔投票：找众数
    ├── 荷兰国旗：三指针分区
    └── Floyd 判圈：找重复数
```

### 模板掌握度最终检查

| 模板 | 掌握程度 | 最后一次复习日期 |
|------|----------|-----------------|
| 哈希表查找 | ❌ 🟡 🟢 🔵 | |
| 双指针对撞 | ❌ 🟡 🟢 🔵 | |
| 快慢指针 | ❌ 🟡 🟢 🔵 | |
| 滑动窗口 | ❌ 🟡 🟢 🔵 | |
| 前缀和 | ❌ 🟡 🟢 🔵 | |
| 链表翻转 | ❌ 🟡 🟢 🔵 | |
| 二叉树 DFS | ❌ 🟡 🟢 🔵 | |
| 二叉树 BFS | ❌ 🟡 🟢 🔵 | |
| 回溯三要素 | ❌ 🟡 🟢 🔵 | |
| 二分查找 | ❌ 🟡 🟢 🔵 | |
| DP 五步法 | ❌ 🟡 🟢 🔵 | |
| 单调栈 | ❌ 🟡 🟢 🔵 | |
| BFS/DFS 图 | ❌ 🟡 🟢 🔵 | |
| 拓扑排序 | ❌ 🟡 🟢 🔵 | |

### 薄弱环节总结
-

### 后续学习计划
-

---

## 四、今日总结

**学到的新模板/技巧：**
-

**遇到的困难：**
-

**遗留问题（需复习）：**
-

**整体感受：** 😊 😐 😢

---

## 🏆 14 天速通完成！

**总完成题数：** __ / 100  
**Easy：** __ / 20 | **Medium：** __ / 68 | **Hard：** __ / 12  

**14 天计划收尾：**
- [ ] 所有计入完成数的题均达到“独立 AC”或“可无提示重写”
- [ ] 未达标题目已在原 Day 1-14 笔记中保留真实状态与错误原因
- [ ] 没有把“看过题解”或“提示后 AC”误计为完成
