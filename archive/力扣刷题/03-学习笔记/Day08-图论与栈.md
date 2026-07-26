---
title: "Day 8 · 图论与栈"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 8 · 图论与栈》。"
---

# Day 8 · 图论与栈

> **日期：** 2026-__-__
> **学习目标：** 图的遍历（DFS/BFS）与栈的基础应用
> **相关知识页：** [[07-图论|07-图论]] · [[06-栈与堆|06-栈与堆]]

---

## 一、今日模板回顾

### 网格 DFS（沉岛法）
```cpp
void sink(vector<vector<char>>& grid, int x, int y) {
    if (x < 0 || x >= static_cast<int>(grid.size()) || y < 0 ||
        y >= static_cast<int>(grid[0].size()) || grid[x][y] != '1') return;
    grid[x][y] = '0';
    sink(grid, x + 1, y); sink(grid, x - 1, y);
    sink(grid, x, y + 1); sink(grid, x, y - 1);
}
```
### 多源 BFS
```cpp
void multiSourceBfs(queue<pair<int, int>>& q, vector<vector<int>>& grid) {
    static constexpr int dx[4] = {1, -1, 0, 0};
    static constexpr int dy[4] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [x, y] = q.front(); q.pop();
        for (int d = 0; d < 4; ++d) {
            int nx = x + dx[d], ny = y + dy[d];
            if (nx < 0 || nx >= static_cast<int>(grid.size()) || ny < 0 ||
                ny >= static_cast<int>(grid[0].size()) || grid[nx][ny] != 1) continue;
            grid[nx][ny] = 2;
            q.push({nx, ny});
        }
    }
}
```
### 拓扑排序（Kahn 算法）
```cpp
bool topologicalTemplate(const vector<vector<int>>& graph, vector<int> indegree) {
    queue<int> q;
    for (int i = 0; i < static_cast<int>(graph.size()); ++i)
        if (indegree[i] == 0) q.push(i);
    int visited = 0;
    while (!q.empty()) {
        int node = q.front(); q.pop();
        ++visited;
        for (int next : graph[node]) if (--indegree[next] == 0) q.push(next);
    }
    return visited == static_cast<int>(graph.size());
}
```
---

## 二、做题记录

### 1. 岛屿数量（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/number-of-islands/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2568/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/421995/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 岛屿数量（LeetCode 200 · Medium）|直达本题最终代码]]
- **题目详解：** [[200-岛屿数量|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 腐烂的橘子（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/rotting-oranges/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/5733/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/2013561/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 腐烂的橘子（LeetCode 994 · Medium）|直达本题最终代码]]
- **题目详解：** [[994-腐烂的橘子|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 课程表（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/course-schedule/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2575/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/426294/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 课程表（LeetCode 207 · Medium）|直达本题最终代码]]
- **题目详解：** [[207-课程表|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 实现 Trie（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/implement-trie-prefix-tree/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2576/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/426311/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 实现 Trie（前缀树）（LeetCode 208 · Medium）|直达本题最终代码]]
- **题目详解：** [[208-实现Trie|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 有效的括号（Easy）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/valid-parentheses/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2353/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/346874/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 有效的括号（LeetCode 20 · Easy）|直达本题最终代码]]
- **题目详解：** [[20-有效的括号|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 最小栈（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/min-stack/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2536/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/411065/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 最小栈（LeetCode 155 · Medium）|直达本题最终代码]]
- **题目详解：** [[155-最小栈|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 字符串解码（Medium）
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/decode-string/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2779/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/503292/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 字符串解码（LeetCode 394 · Medium）|直达本题最终代码]]
- **题目详解：** [[394-字符串解码|打开完整题解]]
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
