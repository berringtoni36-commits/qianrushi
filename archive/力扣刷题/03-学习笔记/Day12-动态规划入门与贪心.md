---
title: "Day 12 · 动态规划入门与贪心算法"
tags: [tech, in-progress]
created: 2026-07-15
type: permanent
summary: "C++17 Hot 100 项目中的《Day 12 · 动态规划入门与贪心算法》。"
---

# Day 12 · 动态规划入门与贪心算法

> **日期：** 2026-__-__
> **学习目标：** 掌握 DP 基础模式与贪心算法
> **相关知识页：** [[10-动态规划|10-动态规划]] · [[11-贪心算法|11-贪心算法]]

---

## 一、今日模板回顾

### DP 解题五步法
```
1. dp 数组含义
2. 状态转移方程
3. 初始化
4. 遍历顺序
5. 手动验证
```

### 背包问题框架
```cpp
vector<char> zeroOneKnapsack(const vector<int>& weights, int capacity) {
    vector<char> reachable(capacity + 1);
    reachable[0] = true;
    for (int weight : weights)
        for (int value = capacity; value >= weight; --value)
            reachable[value] = reachable[value] || reachable[value - weight];
    return reachable;
}
```
### 贪心 vs DP
```cpp
int maxProfitTemplate(const vector<int>& prices) {
    int lowest = INT_MAX, answer = 0;
    for (int price : prices) {
        lowest = min(lowest, price);
        answer = max(answer, price - lowest);
    }
    return answer;
}
```
---

## 二、做题记录

### 1. 买卖股票的最佳时机（Easy）- 贪心
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/best-time-to-buy-and-sell-stock/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2483/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/394460/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#1. 买卖股票的最佳时机（LeetCode 121 · Easy）|直达本题最终代码]]
- **题目详解：** [[121-买卖股票的最佳时机|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 2. 跳跃游戏（Medium）- 贪心
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/jump-game/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2400/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/362214/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#2. 跳跃游戏（LeetCode 55 · Medium）|直达本题最终代码]]
- **题目详解：** [[55-跳跃游戏|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 3. 跳跃游戏 II（Medium）- 贪心
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/jump-game-ii/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2382/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/356247/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#3. 跳跃游戏 II（LeetCode 45 · Medium）|直达本题最终代码]]
- **题目详解：** [[45-跳跃游戏II|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 4. 划分字母区间（Medium）- 贪心
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/partition-labels/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/3673/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/1039493/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#4. 划分字母区间（LeetCode 763 · Medium）|直达本题最终代码]]
- **题目详解：** [[763-划分字母区间|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 5. 爬楼梯（Easy）- DP
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/climbing-stairs/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2415/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/363638/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#5. 爬楼梯（LeetCode 70 · Easy）|直达本题最终代码]]
- **题目详解：** [[70-爬楼梯|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 6. 杨辉三角（Easy）- 模拟
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/pascals-triangle/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2480/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/390367/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#6. 杨辉三角（LeetCode 118 · Easy）|直达本题最终代码]]
- **题目详解：** [[118-杨辉三角|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 7. 打家劫舍（Medium）- DP
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/house-robber/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2566/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/421971/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#7. 打家劫舍（LeetCode 198 · Medium）|直达本题最终代码]]
- **题目详解：** [[198-打家劫舍|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 8. 完全平方数（Medium）- 背包DP
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/perfect-squares/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2647/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/451625/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#8. 完全平方数（LeetCode 279 · Medium）|直达本题最终代码]]
- **题目详解：** [[279-完全平方数|打开完整题解]]
- **优先级：** 扩展题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 9. 零钱兑换（Medium）- 背包DP
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/coin-change/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2713/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/477128/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#9. 零钱兑换（LeetCode 322 · Medium）|直达本题最终代码]]
- **题目详解：** [[322-零钱兑换|打开完整题解]]
- **优先级：** 核心题

- **核心思路：**
- **代码实现：**
- **复杂度：** O(__) / O(__)
- **学习状态：** ⬜ 未学 / 👀 看过题解 / 🟡 提示后 AC / 🟢 独立 AC / 🔵 可无提示重写
- **感悟/易错点：**

### 10. 单词拆分（Medium）- DP
- **LeetCode 题目：** [打开题目](https://leetcode.cn/problems/word-break/)
- **AcWing 题目：** [打开题目](https://www.acwing.com/activity/content/problem/content/2509/)
- **AcWing yxc 代码：** [打开代码](https://www.acwing.com/activity/content/code/content/400818/)
- **YXC 最终提交版：** [[Hot100两周速通-yxc简洁代码#10. 单词拆分（LeetCode 139 · Medium）|直达本题最终代码]]
- **题目详解：** [[139-单词拆分|打开完整题解]]
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
