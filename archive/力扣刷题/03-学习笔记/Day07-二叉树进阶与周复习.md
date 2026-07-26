---
title: "Day 7 · 二叉树进阶 + 第一周复习"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 7 · 二叉树进阶 + 第一周复习》。"
---

# Day 7 · 二叉树进阶 + 第一周复习

> **日期：** 2026-__-__
> **学习目标：** 二叉树进阶 + 第一周知识体系梳理
> **相关知识页：** [[05-二叉树|05-二叉树]] · [[03-数组与矩阵|03-数组与矩阵]]

---

## 一、今日模板回顾

### 二叉树构造
```cpp
TreeNode* buildTreeTemplate(const vector<int>& preorder, int pl, int pr,
                            const vector<int>& inorder, int il, int ir,
                            const unordered_map<int, int>& index) {
    if (pl >= pr) return nullptr;
    int rootIndex = index.at(preorder[pl]);
    int leftSize = rootIndex - il;
    TreeNode* root = new TreeNode(preorder[pl]);
    root->left = buildTreeTemplate(preorder, pl + 1, pl + 1 + leftSize,
                                   inorder, il, rootIndex, index);
    root->right = buildTreeTemplate(preorder, pl + 1 + leftSize, pr,
                                    inorder, rootIndex + 1, ir, index);
    return root;
}
```
### 路径前缀和
```cpp
int pathPrefix(TreeNode* node, long long prefix, long long target,
               unordered_map<long long, int>& count) {
    if (!node) return 0;
    prefix += node->val;
    int answer = count[prefix - target];
    ++count[prefix];
    answer += pathPrefix(node->left, prefix, target, count);
    answer += pathPrefix(node->right, prefix, target, count);
    if (--count[prefix] == 0) count.erase(prefix);
    return answer;
}
```
### 后序遍历 + 全局变量
```cpp
class Solution {
    int ans = 0;
    int depth(TreeNode* root) {
        if (!root) return 0;
        int left = depth(root->left), right = depth(root->right);
        ans = max(ans, left + right);
        return max(left, right) + 1;
    }
public:
    int diameterOfBinaryTree(TreeNode* root) {
        depth(root);
        return ans;
    }
};
```
---

## 二、做题记录

### 1. BST 第 K 小的元素（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/kth-smallest-element-in-a-bst/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2611/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/439441/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 二叉搜索树中第 K 小的元素（LeetCode 230 · Medium）|直达本题最终代码]]
- **题目详解：** [[230-BST第K小的元素|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 二叉树的右视图（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/binary-tree-right-side-view/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2567/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/421980/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 二叉树的右视图（LeetCode 199 · Medium）|直达本题最终代码]]
- **题目详解：** [[199-二叉树的右视图|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 二叉树展开为链表（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/flatten-binary-tree-to-linked-list/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2476/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/390328/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 二叉树展开为链表（LeetCode 114 · Medium）|直达本题最终代码]]
- **题目详解：** [[114-二叉树展开为链表|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 从前序与中序遍历构造二叉树（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/construct-binary-tree-from-preorder-and-inorder-traversal/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2458/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/384035/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 从前序与中序遍历序列构造二叉树（LeetCode 105 · Medium）|直达本题最终代码]]
- **题目详解：** [[105-从前序与中序遍历构造二叉树|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 路径总和 III（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/path-sum-iii/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2859/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/541434/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 路径总和 III（LeetCode 437 · Medium）|直达本题最终代码]]
- **题目详解：** [[437-路径总和III|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 二叉树的最近公共祖先（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2630/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/445172/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 二叉树的最近公共祖先（LeetCode 236 · Medium）|直达本题最终代码]]
- **题目详解：** [[236-二叉树的最近公共祖先|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 二叉树中的最大路径和（Hard）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/binary-tree-maximum-path-sum/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2486/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/394504/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 二叉树中的最大路径和（LeetCode 124 · Hard）|直达本题最终代码]]
- **题目详解：** [[124-二叉树中的最大路径和|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

---

## 三、第一周复习总结

### 模板默写检查

| 模板 | 能否默写 | 备注 |
|------|----------|------|
| 哈希表查找 | ✅ ❌ | |
| 双指针对撞 | ✅ ❌ | |
| 快慢指针 | ✅ ❌ | |
| 滑动窗口 | ✅ ❌ | |
| 前缀和 | ✅ ❌ | |
| 链表翻转 | ✅ ❌ | |
| 二叉树 DFS | ✅ ❌ | |
| 二叉树 BFS | ✅ ❌ | |

### 本周知识图谱

```
算法基础
├── 哈希表：空间换时间
├── 双指针：对撞 / 快慢 / 滑动窗口
├── 前缀和：区间和 → 两次相减
├── 数组/矩阵：原地操作 / 边界收缩
├── 链表：虚拟头 / 快慢 / 翻转
└── 二叉树：DFS(前/中/后) / BFS / BST
```

### 错题集

| 题号 | 题目 | 错误原因 | 现在是否能做对 |
|------|------|----------|---------------|
| | | | ✅ ❌ |

### 第二周展望
- Day 8：图论 + 栈
- Day 9：单调栈 + 堆
- Day 10：回溯算法
- Day 11：二分查找
- Day 12：动态规划入门 + 贪心
- Day 13：进阶动态规划
- Day 14：技巧 + 全局复习

---

## 四、今日总结

**学到的新模板/技巧：**
-

**遇到的困难：**
-

**遗留问题（需复习）：**
-

**整体感受：** 😊 😐 😢
