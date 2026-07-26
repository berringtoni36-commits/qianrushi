---
title: "Day 6 · 二叉树基础"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 6 · 二叉树基础》。"
---

# Day 6 · 二叉树基础

> **日期：** 2026-__-__
> **学习目标：** 二叉树基础——DFS 与 BFS 两大框架
> **相关知识页：** [[05-二叉树|05-二叉树]] · [[08-回溯算法|08-回溯算法]]

---

## 一、今日模板回顾

### DFS（递归框架）
```cpp
int treeDepth(TreeNode* root) {
    if (!root) return 0;
    return 1 + max(treeDepth(root->left), treeDepth(root->right));
}
```
### BFS（层序框架）
```cpp
vector<vector<int>> levelOrderTemplate(TreeNode* root) {
    if (!root) return {};
    queue<TreeNode*> q;
    q.push(root);
    vector<vector<int>> answer;
    while (!q.empty()) {
        int levelSize = q.size();
        answer.emplace_back();
        while (levelSize--) {
            TreeNode* node = q.front(); q.pop();
            answer.back().push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
    }
    return answer;
}
```
---

## 二、做题记录

### 1. 二叉树的中序遍历（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/binary-tree-inorder-traversal/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2447/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/379732/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 二叉树的中序遍历（LeetCode 94 · Easy）|直达本题最终代码]]
- **题目详解：** [[94-二叉树的中序遍历|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 二叉树的最大深度（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2457/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/384008/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 二叉树的最大深度（LeetCode 104 · Easy）|直达本题最终代码]]
- **题目详解：** [[104-二叉树的最大深度|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 翻转二叉树（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/invert-binary-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2607/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/439367/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 翻转二叉树（LeetCode 226 · Easy）|直达本题最终代码]]
- **题目详解：** [[226-翻转二叉树|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 对称二叉树（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/symmetric-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2454/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/383977/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 对称二叉树（LeetCode 101 · Easy）|直达本题最终代码]]
- **题目详解：** [[101-对称二叉树|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 二叉树的直径（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/diameter-of-binary-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/3040/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/597701/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 二叉树的直径（LeetCode 543 · Easy）|直达本题最终代码]]
- **题目详解：** [[543-二叉树的直径|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 二叉树的层序遍历（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/binary-tree-level-order-traversal/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2455/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/383991/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 二叉树的层序遍历（LeetCode 102 · Medium）|直达本题最终代码]]
- **题目详解：** [[102-二叉树的层序遍历|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 将有序数组转换为二叉搜索树（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/convert-sorted-array-to-binary-search-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2461/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/384091/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 将有序数组转换为二叉搜索树（LeetCode 108 · Easy）|直达本题最终代码]]
- **题目详解：** [[108-将有序数组转换为二叉搜索树|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 8. 验证二叉搜索树（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/validate-binary-search-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2451/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/379839/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#8. 验证二叉搜索树（LeetCode 98 · Medium）|直达本题最终代码]]
- **题目详解：** [[98-验证二叉搜索树|打开完整题解]]
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
